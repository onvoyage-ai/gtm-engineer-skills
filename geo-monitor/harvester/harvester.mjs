#!/usr/bin/env node
/**
 * geo-harvester v0.2 — scripted answer capture over CDP into the logged-in
 * pilot Chrome. Google AIO + ChatGPT + Gemini + Claude + Grok.
 *
 * Round-robin model (mirrors the manual pilot's safe rhythm): one worker per
 * engine, each worker runs the prompt list SEQUENTIALLY with per-engine
 * human-like gaps. Engines are different services → different limits →
 * parallel ACROSS engines is safe; parallel within one engine got the IP
 * blocked on 2026-10-03 and stays behind a warning.
 *
 * Attaches to the already-running pilot Chrome (connectOverCDP only; never
 * launches, binds or kills the debugging port).
 *
 * Measurement laws: one fresh conversation per prompt; verdict computed ONLY
 * from the captured slice; failures are markers (error/login_required),
 * never guesses. rows.json v2.2-compatible; partial rows flushed per cell so
 * --resume continues mid-run.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const AIO_MARKERS = [
	"AI Overview",
	"Overview of AI",
	"Tổng quan AI",
	"Thông tin tổng quan do AI tạo",
	"Tổng quan về AI",
	"AI-generated summary",
];
const RELATED_MARKERS = [
	"Related searches",
	"Related Queries",
	"Các tìm kiếm liên quan",
	"Tìm kiếm liên quan",
	"Mọi người cũng tìm kiếm",
	"Mọi người tìm kiếm",
];
const SELF_HOSTS = ["google.com", "gstatic.com", "googleusercontent.com", "gemini.google.com", "chatgpt.com", "claude.ai", "grok.com", "x.ai"];
const BLOCK_PATTERN =
	/unusual traffic|lưu lượng truy cập bất thường|not a robot|CAPTCHA|verify you are a human|kiểm tra xem bạn có đúng là người/i;
const LOGIN_PATTERN =
	/(please )?(log ?in|sign (in|up)|đăng nhập)/i;

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	if (i === -1) return fallback;
	const v = process.argv[i + 1];
	return v === undefined || v.startsWith("--") ? true : v;
}

const OPT = {
	cdp: arg("cdp", "http://127.0.0.1:9222"),
	prompts: arg("prompts", undefined),
	aliases: arg("aliases", undefined),
	out: arg("out", undefined),
	engines: String(arg("engines", "google"))
		.split(",")
		.map((e) => e.trim().toLowerCase())
		.filter(Boolean),
	limit: Number(arg("limit", "0")),
	hl: arg("hl", "vi"),
	gapMin: Number(arg("gap-min", "0")) * 1000,
	gapMax: Number(arg("gap-max", "0")) * 1000,
	batch: Math.max(0, Number(arg("batch", "0"))),
	batchGapMs: Number(arg("batch-gap", "240")) * 1000,
	timeoutMs: Number(arg("timeout", "180")) * 1000,
	resume: arg("resume", false) === true,
	redo: String(arg("redo", "")).split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
};

if (!OPT.prompts || !OPT.aliases || !OPT.out) {
	console.error(
		"usage: node harvester.mjs --prompts <csv> --aliases \"a,b,c\" --out <rows.json> " +
			"[--cdp URL] [--engines google,chatgpt,gemini,claude,grok] [--limit N] [--hl vi] " +
			"[--gap-min 30] [--gap-max 75] [--batch N] [--batch-gap 240] [--timeout 180] [--resume]",
	);
	process.exit(1);
}
/* ------------------------------------------------------------------ drivers */

/** Helper: poll a page-bound async fn until it returns a non-empty stable text.
 * minLen guards against pre-mature "stability" (e.g. prompt echo visible
 * before the assistant reply starts streaming). */
async function waitStream(page, read, { firstWaitMs = 6000, timeoutMs = OPT.timeoutMs, minLen = 200 } = {}) {
	const started = Date.now();
	await page.waitForTimeout(firstWaitMs);
	let lastLen = -1;
	let stableSince = 0;
	let text = "";
	while (Date.now() - started < timeoutMs) {
		const t = (await read().catch(() => "")) || "";
		if (t.length >= minLen && t.length === lastLen && Date.now() - stableSince >= 5000) {
			return { text: t, complete: true };
		}
		if (t.length !== lastLen) {
			lastLen = t.length;
			stableSince = Date.now();
			text = t;
		}
		await page.waitForTimeout(2500);
	}
	return { text, complete: false };
}

function linksFrom(page, selector) {
	return page
		.evaluate((s) => {
			let root = document;
			if (s) {
				const els = document.querySelectorAll(s);
				root = els.length ? els[els.length - 1] : null;
			}
			return root ? [...root.querySelectorAll("a[href^='http']")].map((a) => a.href) : [];
		}, selector)
		.catch(() => []);
}

const DRIVERS = {
	google: {
		label: "Google",
		gap: [30000, 75000],
		async fresh(page, prompt) {
			await page.goto(`https://www.google.com/search?q=${encodeURIComponent(prompt)}&hl=${OPT.hl}`, {
				waitUntil: "domcontentloaded",
				timeout: 60000,
			});
			await page.waitForTimeout(2500);
			for (let i = 0; i < 2; i++) {
				await page.mouse.wheel(0, 500).catch(() => {});
				await page.waitForTimeout(1200);
			}
		},
		async extract(page) {
			if (/\/sorry\//.test(page.url()) || (await page.evaluate(() => (document.body?.innerText || "").slice(0, 4000))).match(BLOCK_PATTERN))
				throw new Error("BLOCKED_CAPTCHA");
			const hasResults = await page.evaluate(() => !!document.querySelector("#rso, #search, #rcnt, #botstuff"));
			const data = await page.evaluate(
				({ aioMarkers, relatedMarkers }) => {
					const leafMatches = (el, markers) => {
						if (el.children.length > 0) return false;
						const t = (el.textContent || "").trim().toLowerCase();
						if (!t || t.length > 80) return false;
						return markers.some((m) => t.startsWith(m.toLowerCase()));
					};
					const findContainer = (markers, minLen) => {
						// leaf may be STRONG/SPAN/Hn (Google wraps the marker) —
						// div/section-only search misses it → false no_ai_overview (2026-10-03)
						for (const el of document.querySelectorAll("div, section, span, strong, h1, h2, h3, h4")) {
							if (!leafMatches(el, markers)) continue;
							let node = el;
							for (let hop = 0; hop < 10 && node; hop++) {
								const len = (node.innerText || "").length;
								if (len >= minLen && len <= 15000) return node;
								node = node.parentElement;
							}
							return el.closest("div, section") || el.parentElement || el;
						}
						return null;
					};
					const aio = findContainer(aioMarkers, 400);
					if (!aio) return null;
					const text = (aio.innerText || "").trim();
					const links = [...aio.querySelectorAll("a[href^='http']")].map((a) => a.href);
					const chips = [];
					const rel = findContainer(relatedMarkers, 10);
					if (rel) {
						const scope = rel.closest("div, section") || rel;
						for (const line of (scope.innerText || "").split("\n")) {
							const t = line.trim();
							if (t && !relatedMarkers.some((m) => t.toLowerCase().startsWith(m.toLowerCase()))) chips.push(t);
						}
					}
					return { text, links, chips };
				},
				{ aioMarkers: AIO_MARKERS, relatedMarkers: RELATED_MARKERS },
			);
			if (!data) {
				if (!hasResults) throw new Error("NO_RESULTS_PAGE");
				return { status: "no_ai_overview" };
			}
			return { status: "ok", text: data.text, links: data.links, webQueries: data.chips, truncated: false };
		},
	},

	chatgpt: {
		label: "ChatGPT",
		gap: [90000, 180000],
		async fresh(page) {
			await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
			await page.waitForTimeout(4000);
		},
		async submit(page, prompt) {
			const box = page.locator("#prompt-textarea").first();
			await box.click({ timeout: 30000 });
			await page.keyboard.insertText(prompt);
			await page.waitForTimeout(600);
			await page.keyboard.press("Enter");
		},
		async extract(page) {
			if (await blockedHere(page)) throw new Error("BLOCKED_CAPTCHA");
			// slice = last occurrence of the prompt → footer marker (skill-verified)
			const { text, complete } = await waitStream(page, () =>
				page.evaluate((p) => {
					const body = document.body?.innerText || "";
					const low = body.toLowerCase();
					const i = low.lastIndexOf(p.toLowerCase());
					if (i === -1) return "";
					const endIdx = low.indexOf("chatgpt can make mistakes", i);
					return (endIdx === -1 ? body.slice(i, i + 16000) : body.slice(i, endIdx)).trim();
				}, prompt_of(page)),
			);
			if (!text) return { status: "error", why: "no answer slice found (selector drift?)" };
			let links = await linksFrom(page, "[data-message-author-role='assistant']");
			if (!links.length) links = await linksFrom(page, "main article");
			return { status: "ok", text: text.slice(text.indexOf("\n") + 1), links: stripSelf(links), webQueries: [], truncated: !complete };
		},
	},

	gemini: {
		label: "Gemini",
		gap: [90000, 180000],
		async fresh(page) {
			await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 60000 });
			await page.waitForTimeout(4000);
		},
		async submit(page, prompt) {
			const box = page.locator("div.ql-editor[contenteditable=true]").first();
			await box.click({ timeout: 30000 });
			await page.keyboard.insertText(prompt);
			await page.waitForTimeout(600);
			await page.keyboard.press("Enter");
			// no navigation on failure: retry once if URL never gains a chat id (skill rule)
			await page.waitForTimeout(6000);
			if (!/gemini\.google\.com\/app\/[A-Za-z0-9]/.test(page.url())) {
				await box.click().catch(() => {});
				await page.keyboard.press("Enter");
			}
		},
		async extract(page) {
			if (await blockedHere(page)) throw new Error("BLOCKED_CAPTCHA");
			const { text, complete } = await waitStream(page, () =>
				page.evaluate(() => {
					const mr = document.querySelector("model-response") || document.querySelector(".model-response-text");
					return mr ? (mr.innerText || "").trim() : "";
				}),
			);
			if (!text) return { status: "error", why: "no model-response element (drift?)" };
			const links = await linksFrom(page, "model-response");
			return { status: "ok", text, links: stripSelf(links), webQueries: [], truncated: !complete };
		},
	},

	claude: {
		label: "Claude",
		gap: [90000, 180000],
		async fresh(page) {
			await page.goto("https://claude.ai/new", { waitUntil: "domcontentloaded", timeout: 60000 });
			await page.waitForTimeout(6000);
		},
		async submit(page, prompt) {
			const box = page.locator("div[contenteditable=true]").last();
			await box.click({ timeout: 30000 });
			await page.keyboard.insertText(prompt);
			await page.waitForTimeout(600);
			await page.keyboard.press("Enter");
			// clarify card: click Skip if it shows up
			await page.waitForTimeout(4000);
			const skip = page.getByRole("button", { name: /skip/i }).first();
			if (await skip.isVisible().catch(() => false)) await skip.click().catch(() => {});
		},
		async extract(page) {
			if (await blockedHere(page)) throw new Error("BLOCKED_CAPTCHA");
			// slice = last occurrence of the prompt → footer marker.
			// [data-message-author-role] died in the 2026-09 DOM drift; slice
			// is the skill-verified fallback (pure-MCP smoke 2026-10-03).
			const { text, complete } = await waitStream(page, () =>
				page.evaluate((p) => {
					const body = document.body?.innerText || "";
					const low = body.toLowerCase();
					const i = low.lastIndexOf(p.toLowerCase());
					if (i === -1) return "";
					return body.slice(i, i + 16000).trim();
				}, prompt_of(page)),
			);
			if (!text) return { status: "error", why: "no answer slice found (login?)" };
			let answer = text.slice(text.indexOf("\n") + 1).trim();
			const foot = answer.toLowerCase().indexOf("claude is ai and can make mistakes");
			if (foot > 200) answer = answer.slice(0, foot).trim();
			if (!answer) return { status: "error", why: "slice empty after trim" };
			// own-domain links (sidebar history) die in stripSelf; sources stay
			const links = await linksFrom(page, null);
			return { status: "ok", text: answer, links: stripSelf(links), webQueries: [], truncated: !complete };
		},
	},

	grok: {
		label: "Grok",
		gap: [90000, 180000],
		async fresh(page) {
			await page.goto("https://grok.com/", { waitUntil: "domcontentloaded", timeout: 60000 });
			await page.waitForTimeout(5000);
		},
		async submit(page, prompt) {
			const box = page.locator("div[contenteditable=true]").first();
			await box.click({ timeout: 30000 });
			await page.keyboard.insertText(prompt);
			await page.waitForTimeout(600);
			await page.keyboard.press("Enter");
			await page.waitForTimeout(6000);
			if (!/grok\.com\/c\//.test(page.url())) {
				await box.click().catch(() => {});
				await page.keyboard.press("Enter");
			}
		},
		async extract(page) {
			if (await blockedHere(page)) throw new Error("BLOCKED_CAPTCHA");
			// slice = last occurrence of the prompt → length cap.
			// [data-testid='message'] matching proved unreliable; slice is the
			// skill-verified fallback (pure-MCP smoke 2026-10-03).
			const { text, complete } = await waitStream(page, () =>
				page.evaluate((p) => {
					const body = document.body?.innerText || "";
					const low = body.toLowerCase();
					const i = low.lastIndexOf(p.toLowerCase());
					if (i === -1) return "";
					return body.slice(i, i + 16000).trim();
				}, prompt_of(page)),
			);
			if (!text) return { status: "error", why: "no answer slice found (login?)" };
			const answer = text.slice(text.indexOf("\n") + 1).trim();
			if (!answer) return { status: "error", why: "slice empty after trim" };
			const links = await linksFrom(page, null);
			return { status: "ok", text: answer, links: stripSelf(links), webQueries: [], truncated: !complete };
		},
	},
};

/* ------------------------------------------------------------- shared utils */

// chatgpt slice extraction needs the active prompt — tiny per-page stash
const PAGE_PROMPT = new WeakMap();
function prompt_of(page) {
	return PAGE_PROMPT.get(page) || "";
}

async function blockedHere(page) {
	if (/\/sorry\//.test(page.url())) return true;
	const t = await page.evaluate(() => (document.body?.innerText || "").slice(0, 4000)).catch(() => "");
	return BLOCK_PATTERN.test(t);
}
async function loginHere(page) {
	const t = await page.evaluate(() => (document.body?.innerText || "").slice(0, 3000)).catch(() => "");
	return LOGIN_PATTERN.test(t) && t.length < 3000;
}

function stripSelf(links) {
	return links.filter((l) => {
		try {
			const h = new URL(l).hostname.toLowerCase();
			return !SELF_HOSTS.some((s) => h === s || h.endsWith(`.${s}`));
		} catch {
			return false;
		}
	});
}

function cleanLinks(links) {
	const seen = new Set();
	const out = [];
	for (const raw of links) {
		try {
			const u = new URL(raw);
			if (u.protocol !== "http:" && u.protocol !== "https:") continue;
			const host = u.hostname.toLowerCase().replace(/^www\./, "");
			if (SELF_HOSTS.some((h) => host === h || h.endsWith(`.${h}`))) continue;
			u.search = "";
			u.hash = "";
			const url = u.toString();
			if (seen.has(url)) continue;
			seen.add(url);
			out.push(url);
		} catch {
			/* skip */
		}
	}
	return out;
}

function verdict(text, aliases) {
	const low = text.toLowerCase();
	let idx = -1;
	for (const a of aliases) {
		const i = low.indexOf(a.toLowerCase());
		if (i !== -1 && (idx === -1 || i < idx)) idx = i;
	}
	if (idx === -1) return { mentioned: "no", position: "" };
	const words = text.slice(0, idx).split(/\s+/).filter(Boolean).length;
	const total = Math.max(text.split(/\s+/).filter(Boolean).length, 1);
	const ratio = words / total;
	return { mentioned: "yes", position: ratio <= 1 / 3 ? "top" : ratio <= 2 / 3 ? "middle" : "bottom" };
}

/* ------------------------------------------------------------------ prompts */

function parseCsv(text) {
	const rows = [];
	let row = [];
	let cell = "";
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (quoted) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					cell += '"';
					i++;
				} else quoted = false;
			} else cell += c;
		} else if (c === '"') quoted = true;
		else if (c === ",") {
			row.push(cell);
			cell = "";
		} else if (c === "\n") {
			row.push(cell.replace(/\r$/, ""));
			rows.push(row);
			row = [];
			cell = "";
		} else if (c !== "\r") cell += c;
	}
	if (cell !== "" || row.length > 0) {
		row.push(cell.replace(/\r$/, ""));
		rows.push(row);
	}
	return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

function loadPrompts(file) {
	const raw = parseCsv(readFileSync(file, "utf8").replace(/^/, ""));
	const header = raw[0].map((h) => h.trim().toLowerCase());
	const pi = header.indexOf("prompt");
	const pri = header.indexOf("priority");
	if (pi === -1) throw new Error(`${file}: missing 'prompt' column`);
	const out = [];
	for (const r of raw.slice(1)) {
		if (pri >= 0 && (r[pri] || "").trim().toLowerCase() === "skip") continue;
		const p = (r[pi] || "").trim();
		if (p) out.push(p);
	}
	return out;
}

/* --------------------------------------------------------------------- main */

for (const e of OPT.engines) {
	if (!DRIVERS[e]) {
		console.error(`[harvest] unknown engine '${e}' (have: ${Object.keys(DRIVERS).join(", ")})`);
		process.exit(1);
	}
}

const DONE = new Set(["yes", "no", "no_ai_overview"]);

async function main() {
	const aliases = OPT.aliases
		.split(",")
		.map((a) => a.trim().toLowerCase())
		.filter(Boolean);
	if (aliases.length === 0) throw new Error("--aliases must list at least one alias");

	let prompts = loadPrompts(resolve(OPT.prompts));
	if (OPT.limit > 0) prompts = prompts.slice(0, OPT.limit);

	const outFile = resolve(OPT.out);
	const rows = new Map();
	if (OPT.resume && existsSync(outFile)) {
		for (const r of JSON.parse(readFileSync(outFile, "utf8"))) {
			rows.set(r.prompt, r);
		}
	}
	// --redo <engines>: drop those engines' cells so they run again.
	// For driver fixes that invalidate old verdicts (e.g. false
	// no_ai_overview) — resume alone would skip them as terminal.
	for (const r of rows.values()) {
		for (const e of OPT.redo) delete r?.engines?.[e];
	}
	// Pre-create every row BEFORE workers start: parallel workers must only
	// MUTATE shared row objects. Lazy get-or-create races (two workers both
	// see undefined, both build fresh objects, last set() wins and eats the
	// other engine's cell — observed 2026-10-03: split single-engine rows).
	for (const p of prompts) {
		if (!rows.has(p)) {
			rows.set(p, { prompt: p, branded: false, engines: {}, any_mentioned: "", pages_cited: [], notes: "" });
		}
	}
	const flush = () => {
		writeFileSync(outFile, JSON.stringify([...rows.values()], null, 1), "utf8");
	};

	console.error(
		`[harvest] ${prompts.length} prompts × engines [${OPT.engines.join(", ")}] — sequential per engine, parallel across`,
	);

	const browser = await chromium.connectOverCDP(OPT.cdp);
	const context = browser.contexts()[0];
	const startedAt = Date.now();

	// one worker per engine; engines are separate services, so running them
	// side by side each at its own gentle pace is the safe parallelism.
	const workers = OPT.engines.map(async (engineName, wIdx) => {
		const driver = DRIVERS[engineName];
		const page = await context.newPage();
		await page.setViewportSize({ width: 1440, height: 900 });
		let completed = 0;
		let consecErrors = 0;
		for (const prompt of prompts) {
			const prior = rows.get(prompt)?.engines?.[engineName];
			if (prior && DONE.has(prior.mentioned)) continue;

			// per-prompt row: pre-created before workers started (see above);
			// just take the shared object — never build here (race).
			const row = rows.get(prompt);

			const [gMin, gMax] = OPT.gapMin > 0 || OPT.gapMax > 0 ? [OPT.gapMin, OPT.gapMax] : driver.gap;
			await page.waitForTimeout(Math.random() * 15000 + wIdx * 15000);

			let next;
			const t0 = Date.now();
			try {
				await driver.fresh(page, prompt);
				if (driver.submit) {
					// blank/under-300 body after fresh = challenge page, not a real session
					let blen = await page.evaluate(() => (document.body?.innerText || "").length).catch(() => 0);
					if (blen < 300) {
						await page.waitForTimeout(5000);
						blen = await page.evaluate(() => (document.body?.innerText || "").length).catch(() => 0);
					}
					if (blen < 300) throw new Error("EMPTY_PAGE (challenge/blank — bot check active?)");
				}
				if (await loginHere(page)) throw new Error("NEEDS_LOGIN");
				if (driver.submit) {
					PAGE_PROMPT.set(page, prompt);
					await driver.submit(page, prompt);
				}
				const res = await driver.extract(page);
				if (res.status === "no_ai_overview") {
					next = { mentioned: "no_ai_overview", position: "", sentiment: "", img: null, note: "no AIO block" };
				} else if (res.status === "error") {
					next = { mentioned: "error", position: "", sentiment: "", img: null, note: res.why };
				} else {
					const v = verdict(res.text, aliases);
					const links = cleanLinks(res.links);
					const webQ = res.webQueries && res.webQueries.length > 0 ? res.webQueries : links.length > 0 ? ["unavailable"] : [];
					next = {
						mentioned: v.mentioned,
						position: v.position,
						sentiment: "",
						answer_text: res.text,
						answer_links: links,
						web_queries: webQ,
						img: null,
						chat_url: page.url(), // janitor wipe key: exact conversation URL
					};
					if (res.truncated) next.note = "truncated: stream not stable within timeout";
				}
			} catch (err) {
				const msg = String(err?.message || err).slice(0, 140);
				if (msg.startsWith("BLOCKED_CAPTCHA")) next = { mentioned: "error", note: "blocked page (unusual traffic/CAPTCHA)" };
				else if (msg.startsWith("NEEDS_LOGIN")) next = { mentioned: "login_required", note: "login wall appeared" };
				else next = { mentioned: "error", note: msg };
			}

			row.engines[engineName] = next;
			const cells = Object.values(row.engines);
			row.any_mentioned = cells.some((c) => c.mentioned === "yes")
				? "yes"
				: cells.every((c) => DONE.has(c.mentioned))
					? "no"
					: "";
			row.pages_cited = Object.entries(row.engines).flatMap(([e, c]) =>
				(c.answer_links || []).map((u) => `${u} (${engineName})`),
			);
			row.notes = `harvested v0.2 (${engineName}) ${new Date().toISOString()}`;
			rows.set(prompt, row);
			completed++;
			console.error(
				`[harvest:${engineName}] ${completed}/${prompts.length} (${((Date.now() - t0) / 1000).toFixed(0)}s) ` +
					`"${prompt.slice(0, 40)}" → ${next.mentioned}${next.position ? "/" + next.position : ""}`,
			);
			flush();

			consecErrors = next.mentioned === "error" || next.mentioned === "login_required" ? consecErrors + 1 : 0;
			if (next.mentioned === "login_required") {
				console.error(`[harvest:${engineName}] STOP: login wall — human needed; other engines continue`);
				break;
			}
			if (consecErrors >= 2) {
				console.error(
					`[harvest:${engineName}] STOP: 2 consecutive errors — circuit breaker halted this engine (challenge/rate limit?); other engines continue. Re-run later with --resume.`,
				);
				break;
			}
			if (OPT.batch > 0 && completed % OPT.batch === 0) {
				await page.waitForTimeout(Math.round(OPT.batchGapMs * (0.8 + Math.random() * 0.4)));
			} else {
				await page.waitForTimeout(gMin + Math.random() * Math.max(0, gMax - gMin));
			}
		}
		await page.close().catch(() => {});
	});

	await Promise.all(workers);
	// NOTE: never browser.close() here — this is a SHARED pilot over CDP;
	// close() would kill the whole browser (and the user's session with it).
	// Workers already closed their own pages; exiting drops our CDP connection.
	flush();
	console.error(`[harvest] done in ${((Date.now() - startedAt) / 60000).toFixed(1)} min → ${outFile}`);
	process.exit(0); // CDP connection would keep the loop alive otherwise
}

main().catch((err) => {
	console.error(`[harvest] fatal: ${err?.stack || err}`);
	process.exit(1);
});
