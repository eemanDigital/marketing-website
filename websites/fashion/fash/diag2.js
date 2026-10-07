const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: {width:1440,height:900} });
  page.on("console", async m => {
    if (m.type() !== "error") return;
    const parts = [];
    for (const a of m.args()) { try { parts.push(await a.jsonValue()); } catch { parts.push("[obj]"); } }
    const t = parts.map(p => typeof p === "string" ? p : JSON.stringify(p)).join(" ");
    if (t.includes("hydrat")) console.log("HYDRATION:\n" + t.slice(0, 3000));
  });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);
  await browser.close();
})();
