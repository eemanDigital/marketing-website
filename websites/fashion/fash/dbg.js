const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(4000);
  const idx = () => page.evaluate(() => [...document.querySelectorAll(".hero .slide")].findIndex(s => s.classList.contains("is-active")));

  console.log("start idx", await idx());
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(1900);
  console.log("after ArrowRight", await idx());

  // parallax probe
  const st = await page.$eval(".hero__stage", el => { const b = el.getBoundingClientRect(); return {l:b.left, t:b.top, w:b.width, h:b.height}; });
  console.log("stage rect", st);
  await page.mouse.move(st.l + st.w*0.2, st.t + st.h*0.5, { steps: 5 });
  await page.waitForTimeout(900);
  const t1 = await page.$eval(".slide.is-active .slide__layer--figure", el => getComputedStyle(el).transform);
  await page.mouse.move(st.l + st.w*0.9, st.t + st.h*0.5, { steps: 5 });
  await page.waitForTimeout(900);
  const t2 = await page.$eval(".slide.is-active .slide__layer--figure", el => getComputedStyle(el).transform);
  const t2f = await page.$eval(".slide.is-active .slide__layer--form", el => getComputedStyle(el).transform);
  console.log("fig transform near:", t1, "\nfig far:", t2, "\nform far:", t2f);

  // pin
  const pinBox = await page.$eval(".slide.is-active .pin", el => { const b = el.getBoundingClientRect(); return {x:b.x+b.width/2, y:b.y+b.height/2, w:b.width}; });
  console.log("pin box", pinBox);
  await page.mouse.click(pinBox.x, pinBox.y);
  await page.waitForTimeout(900);
  console.log("qv open:", await page.evaluate(() => {
    const o = document.querySelector(".overlay--center.is-open");
    return o ? o.className + " | " + (o.querySelector("h2,h3,.qv__title")?.textContent||"").trim().slice(0,60) : "closed";
  }));
  await browser.close();
})();
