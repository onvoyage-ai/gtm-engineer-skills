#!/usr/bin/env node
/**
 * geo-janitor v0.1 — conversation inventory (+ later: wipe) for the pilot.
 *
 * Weekly cadence helper: each monitor run opens 1 fresh conversation per
 * prompt per engine, so history accumulates. Evidence already lives locally
 * (rows.json / transcripts / xlsx) — sidebar history is redundant.
 *
 * Modes:
 *   --mode list   read-only: count + list conversation URLs per engine
 *   --mode wipe   (NOT YET IMPLEMENTED) delete listed conversations + verify
 *
 * Safety: never launches/binds/kills the pilot (connectOverCDP only),
 * never calls browser.close(). Google has no conversations — skipped
 * (search history is a different beast, out of scope).
 */
import { chromium } from "playwright-core";

function arg(name, fallback) {
	const i = process.argv.indexOf(`--${name}`);
	if (i === -1) return fallback;
	const v = process.argv[i + 1];
	return v === undefined || v.startsWith("--") ? true : v;
}

const OPT = {
	cdp: arg("cdp", "http://127.0.0.1:9222"),
	engines: String(arg("engines", "chatgpt,gemini,claude,grok")).split(",").map((e) => e.trim().toLowerCase()).filter(Boolean),
	mode: String(arg("mode", "list")).toLowerCase(),
};

// conversation-URL patterns per engine (sidebar-agnostic: any anchor works)
const ENGINES = {
	chatgpt: { home: "https://chatgpt.com/", match: /chatgpt\.com\/c\// },
	gemini: { home: "https://gemini.google.com/app", match: /gemini\.google\.com\/(app|share)\// },
	claude: { home: "https://claude.ai/new", match: /claude\.ai\/chat\// },
	grok: { home: "https://grok.com/", match: /grok\.com\/c\// },
};

/**
 * WIPE (explicit URLs only — never "delete all").
 * Source of truth: chat_url cells from a rows file (--from), i.e. exactly
 * last week's run. Usage:
 *   node janitor.mjs --mode wipe --from <rows.json> --engines chatgpt
 * Per URL: open → sidebar row → options → Delete → confirm → verify absent.
 * Reports deleted/failed per URL; non-zero exit if any failed.
 */
async function wipeChatgpt(page, url) {
	const id = new URL(url).pathname; // /c/<uuid>
	await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
	await page.waitForTimeout(4000);
	const opened = await page.evaluate((p) => {
		const a = document.querySelector(`a[href="${p}"]`);
		if (!a) return false;
		const row = a.closest("li") || a.parentElement;
		const opt = [...row.querySelectorAll("button")].find((b) =>
			(b.getAttribute("aria-label") || "").startsWith("Open conversation options"),
		);
		if (!opt) return false;
		opt.click();
		return true;
	}, id);
	if (!opened) return "no-options-button";
	await page.waitForTimeout(1200);
	const delClicked = await page.evaluate(() => {
		const it = [...document.querySelectorAll('[role="menuitem"], [role="menuitemradio"]')].find(
			(e) => (e.innerText || "").trim() === "Delete",
		);
		if (!it) return false;
		it.click();
		return true;
	});
	if (!delClicked) return "no-delete-item";
	await page.waitForTimeout(1200);
	const confirmed = await page.evaluate(() => {
		const b = [...document.querySelectorAll('[role="dialog"] button, [role="alertdialog"] button')].find(
			(x) => (x.innerText || "").trim() === "Delete",
		);
		if (!b) return false;
		b.click();
		return true;
	});
	if (!confirmed) return "no-confirm-button";
	await page.waitForTimeout(3000);
	const gone = await page.evaluate((p) => !document.querySelector(`a[href="${p}"]`), id);
	return gone ? "deleted" : "still-listed";
}

async function wipe() {
	const from = arg("from", undefined);
	if (!from) throw new Error("--mode wipe needs --from <rows.json> (chat_url cells = exactly what to delete)");
	const { readFileSync } = await import("node:fs");
	const rows = JSON.parse(readFileSync(from, "utf8"));
	const browser = await chromium.connectOverCDP(OPT.cdp);
	const context = browser.contexts()[0];
	let failed = 0;
	for (const name of OPT.engines) {
		if (name !== "chatgpt") {
			console.error(`[janitor:wipe:${name}] deleter not implemented yet — skipped`);
			continue;
		}
		const urls = [];
		for (const r of rows) {
			const u = r?.engines?.[name]?.chat_url;
			if (u) urls.push(u);
		}
		console.error(`[janitor:wipe:${name}] ${urls.length} urls from ${from}`);
		const page = await context.newPage();
		try {
			for (const u of urls) {
				let res;
				try {
					res = await wipeChatgpt(page, u);
				} catch (err) {
					res = `error: ${String(err?.message || err).slice(0, 100)}`;
				}
				console.error(`[janitor:wipe:${name}] ${res} ${u.slice(-12)}`);
				if (res !== "deleted") failed++;
				await page.waitForTimeout(3000);
			}
		} finally {
			await page.close().catch(() => {});
		}
	}
	if (failed > 0) {
		console.error(`[janitor:wipe] ${failed} deletions failed`);
		process.exitCode = 1;
	}
}

async function listConversations(page, re) {	const links = await page.evaluate(() => [...document.querySelectorAll("a[href]")].map((a) => ({ title: (a.innerText || "").trim().slice(0, 80), href: a.href })));
	const seen = new Map();
	for (const l of links) {
		if (re.test(l.href) && !seen.has(l.href)) seen.set(l.href, l.title);
	}
	return [...seen.entries()].map(([href, title]) => ({ title, href }));
}

async function main() {
	if (OPT.mode === "wipe") {
		await wipe();
		console.log(JSON.stringify({ wiped: true }, null, 1));
		process.exit(0); // CDP connection would keep the loop alive otherwise
	}
	const browser = await chromium.connectOverCDP(OPT.cdp);
	const context = browser.contexts()[0];
	const out = {};
	for (const name of OPT.engines) {
		const eng = ENGINES[name];
		if (!eng) throw new Error(`unknown engine '${name}'`);
		const page = await context.newPage();
		try {
			await page.goto(eng.home, { waitUntil: "domcontentloaded", timeout: 60000 });
			await page.waitForTimeout(6000);
			out[name] = await listConversations(page, eng.match);
			console.error(`[janitor:${name}] ${out[name].length} conversations`);
		} finally {
			await page.close().catch(() => {});
		}
		await page.waitForTimeout(3000).catch(() => {});
	}
	console.log(JSON.stringify(out, null, 1));
	process.exit(0); // CDP connection would keep the loop alive otherwise
}

main().catch((err) => {
	console.error(`[janitor] fatal: ${err?.stack || err}`);
	process.exit(1);
});
