import { chromium } from "playwright-core";

const PORT = process.argv[2];
const b = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
const ctx = b.contexts()[0];

const ENGINES = {
	chatgpt: {
		url: "https://chatgpt.com/",
		composers: ["#prompt-textarea", "[data-test-id='composer-input'] [contenteditable]", "textarea#textbox"],
		containers: ["[data-message-author-role]", "article", "[data-turn-id]"],
		signedOut: ["Log in", "Get the app", "Sign up"],
		answerEnd: "ChatGPT can make mistakes",
	},
	gemini: {
		url: "https://gemini.google.com/app",
		composers: ["div.ql-editor[contenteditable=true]", "textarea[aria-label]", "[role='textbox']"],
		containers: ["model-response", "[data-test-id='conversation']", ".model-response-text"],
		signedOut: ["Sign in", "Try Gemini"],
	},
	grok: {
		url: "https://grok.com/",
		composers: ["div[contenteditable=true]", "textarea"],
		containers: ["[data-testid='message']", "article"],
		signedOut: ["Sign in", "Sign up"],
	},
	claude: {
		url: "https://claude.ai/new",
		composers: ["div[contenteditable=true]", "[role='textbox']"],
		containers: ["[data-message-author-role='assistant']", ".message-container", "div[dir]"],
		signedOut: ["Sign in", "Log in"],
	},
};

for (const [name, cfg] of Object.entries(ENGINES)) {
	const p = await ctx.newPage();
	await p.setViewportSize({ width: 1440, height: 900 });
	try {
		await p.goto(cfg.url, { waitUntil: "domcontentloaded", timeout: 45000 });
		await p.waitForTimeout(6000);
		const info = await p.evaluate((cfg) => {
			const vis = (el) => el && el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0;
			const composerHits = cfg.composers.map((s) => {
				try { return s + " => " + [...document.querySelectorAll(s)].filter(vis).length; } catch { return s + " => BADSEL"; }
			});
			const containerHits = cfg.containers.map((s) => {
				try { return s + " => " + document.querySelectorAll(s).length; } catch { return s + " => BADSEL"; }
			});
			const body = document.body?.innerText || "";
			const loginWall = cfg.signedOut.some((m) => body.length < 6000 && body.toLowerCase().includes(m.toLowerCase()));
			return {
				url: location.href.slice(0, 80),
				title: document.title.slice(0, 60),
				bodyLen: body.length,
				loginWall: loginWall ? "SUSPECT" : "ok",
				composerHits,
				containerHits,
			};
		}, cfg);
		console.log(name.toUpperCase());
		console.log(JSON.stringify(info, null, 1));
	} catch (err) {
		console.log(name.toUpperCase() + " FAIL: " + String(err.message).slice(0, 120));
	}
	await p.close();
	console.log("---");
}
await b.close();
