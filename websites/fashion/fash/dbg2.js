const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("console", m => console.log("[pg]", m.text().slice(0,200)));
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);
  console.log(await page.evaluate(() => ({
    hoverFine: matchMedia("(hover: hover) and (pointer: fine)").matches,
    reduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
    revealed: document.documentElement.dataset.revealed,
  })));
  // manually dispatch pointermove over stage and see
  await page.evaluate(() => {
    const st = document.querySelector(".hero__stage");
    const b = st.getBoundingClientRect();
    st.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: b.left + b.width*0.9, clientY: b.top + b.height*0.5, pointerType: "mouse" }));
  });
  await page.waitForTimeout(900);
  console.log("after synthetic dispatch:", await page.$eval(".slide.is-active .slide__layer--figure", el => getComputedStyle(el).transform));
  // real mouse move with steps
  const st = await page.$eval(".hero__stage", el => { const b = el.getBoundingClientRect(); return {l:b.left,t:b.top,w:b.width,h:b.height}; });
  await page.mouse.move(st.l + st.w*0.1, st.t + st.h*0.5);
  await page.waitForTimeout(300);
  await page.mouse.move(st.l + st.w*0.9, st.t + st.h*0.5, { steps: 10 });
  await page.waitForTimeout(1000);
  console.log("after real mouse:", await page.$eval(".slide.is-active .slide__layer--figure", el => getComputedStyle(el).transform));
  await browser.close();
})();
