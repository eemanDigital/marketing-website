const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: {width:1440,height:900} });
  const bad = [];
  page.on("response", r => { if (r.status() >= 400) bad.push(r.status() + " " + r.url()); });
  page.on("console", async m => {
    if (m.type() === "error") {
      const parts = [];
      for (const a of m.args()) { try { parts.push(await a.jsonValue()); } catch { parts.push("[obj]"); } }
      console.log("CONSOLE:", JSON.stringify(parts).slice(0, 600));
    }
  });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);
  console.log("BAD RESPONSES:", bad);
  await browser.close();
})();
