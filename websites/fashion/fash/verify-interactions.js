const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  let fail = 0;
  const ok = (n, c, extra) => { if (!c) fail++; console.log((c ? "PASS " : "FAIL ") + n + (extra ? "  " + extra : "")); };

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on("pageerror", e => errs.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errs.push(m.text().slice(0,160)); });
  page.on("response", r => { if (r.status() >= 400) errs.push(r.status() + " " + r.url().slice(0,120)); });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);

  const idx = () => page.evaluate(() =>
    [...document.querySelectorAll(".hero .slide")].findIndex(s => s.classList.contains("is-active")));

  // 1. dot click
  await page.click(".hero__dots .dot:nth-child(3)");
  await page.waitForTimeout(2000);
  ok("dot click swaps to slide 3", (await idx()) === 2, "idx=" + await idx());

  // 2. keyboard
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(2000);
  ok("ArrowRight advances slide", (await idx()) === 3, "idx=" + await idx());
  await page.keyboard.press("ArrowLeft");
  await page.waitForTimeout(2000);
  ok("ArrowLeft goes back", (await idx()) === 2, "idx=" + await idx());

  // 3. parallax (mouse must physically enter stage)
  const st = await page.$eval(".hero__stage", el => { const b = el.getBoundingClientRect(); return {l:b.left,t:b.top,w:b.width,h:b.height}; });
  const tx = s => page.$eval(s, el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m41);
  await page.mouse.move(st.l + st.w*0.15, st.t + st.h*0.4, { steps: 4 });
  await page.waitForTimeout(900);
  const figL = await tx(".slide.is-active .slide__layer--figure");
  const frmL = await tx(".slide.is-active .slide__layer--form");
  await page.mouse.move(st.l + st.w*0.85, st.t + st.h*0.4, { steps: 8 });
  await page.waitForTimeout(1000);
  const figR = await tx(".slide.is-active .slide__layer--figure");
  const frmR = await tx(".slide.is-active .slide__layer--form");
  ok("figure parallax responds to pointer", Math.abs(figR - figL) > 3, `fig ${figL.toFixed(1)} -> ${figR.toFixed(1)}`);
  ok("form answers opposite direction", Math.sign(figR - figL) !== Math.sign(frmR - frmL), `form ${frmL.toFixed(1)} -> ${frmR.toFixed(1)}`);

  // 4. pin quick view
  const pin = await page.$eval(".slide.is-active .pin", el => { const b = el.getBoundingClientRect(); return {x:b.x+b.width/2, y:b.y+b.height/2}; });
  await page.mouse.click(pin.x, pin.y);
  await page.waitForTimeout(1000);
  const qv = await page.evaluate(() => {
    const o = document.querySelector(".overlay--center.is-open");
    if (!o) return null;
    const t = o.querySelector(".product__title, h2, h3, strong");
    return { title: (t?.textContent || "").trim() };
  });
  ok("pin opens quick view", !!qv, qv?.title);
  const pinProduct = await page.evaluate(() => {
    const s = document.querySelector(".slide.is-active");
    return s.getAttribute("aria-label");
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  ok("Escape closes quick view", !(await page.$(".overlay--center.is-open")));

  // 5. autoplay fill exists and gauge marker moves on swap
  const gaugeBefore = await page.$eval(".hero__gauge-marker", el => getComputedStyle(el).top);
  await page.click(".hero__dots .dot:nth-child(5)");
  await page.waitForTimeout(2000);
  ok("autoplay fill element present", await page.$(".hero__autoplay span") !== null);
  ok("slide 5 active after dot", (await idx()) === 4, "idx=" + await idx());

  ok("no page/console/network errors", errs.length === 0, errs.slice(0,2).join(" | "));
  await page.close();

  // 6. mobile swipe via pointer events (component listens to pointerdown/up)
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await m.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await m.waitForTimeout(5000);
  const mi0 = await m.evaluate(() => [...document.querySelectorAll(".hero .slide")].findIndex(s => s.classList.contains("is-active")));
  await m.evaluate(() => {
    const st = document.querySelector(".hero__stage");
    const b = st.getBoundingClientRect();
    const y = b.top + b.height * 0.5;
    const opt = { bubbles: true, pointerType: "touch", clientY: y, isPrimary: true };
    st.dispatchEvent(new PointerEvent("pointerdown", { ...opt, clientX: b.left + b.width * 0.85 }));
    st.dispatchEvent(new PointerEvent("pointerup", { ...opt, clientX: b.left + b.width * 0.15 }));
  });
  await m.waitForTimeout(2000);
  const mi1 = await m.evaluate(() => [...document.querySelectorAll(".hero .slide")].findIndex(s => s.classList.contains("is-active")));
  ok("mobile swipe advances slide", mi1 !== mi0, `${mi0} -> ${mi1}`);
  await m.close();

  await browser.close();
  process.exit(fail ? 1 : 0);
})();
