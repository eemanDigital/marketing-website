const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  for (const vp of [{width:1440,height:900},{width:1366,height:768},{width:390,height:844}]) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(4500);
    await page.screenshot({ path: `shot-${vp.width}x${vp.height}.png` });
    await page.close();
  }
  await browser.close();
})();
