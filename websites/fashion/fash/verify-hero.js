const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(4500); // preloader + intro

  const box = async (sel) => {
    const el = page.locator(sel).first();
    if (!(await el.count())) return null;
    const b = await el.boundingBox();
    return b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
  };

  const report = async (label) => {
    const active = await page.locator(".slide.is-active .slide__figure").count();
    const data = {
      label,
      activeFigures: active,
      stage: await box(".hero__stage"),
      frame: await box(".hero__frame"),
      figure: await box(".slide.is-active .slide__figure"),
      form: await box(".slide.is-active .slide__form"),
      figTag: await box(".slide.is-active .slide__tag--figure"),
      formTag: await box(".slide.is-active .slide__tag--form"),
      pin: await box(".slide.is-active .pin"),
      ghost: await box(".slide.is-active .slide__ghost"),
      gauge: await box(".hero__gauge"),
      rail: await box(".hero__rail"),
      look: await (async () => {
        const t = await page.locator(".hero__look-title").innerText();
        return t;
      })(),
      figOpacity: await page
        .locator(".slide.is-active .slide__figure")
        .evaluate((el) => getComputedStyle(el).opacity),
      formOpacity: await page
        .locator(".slide.is-active .slide__form")
        .evaluate((el) => getComputedStyle(el).opacity),
    };
    console.log(JSON.stringify(data, null, 1));
  };

  await report("initial");

  // advance two slides via the next arrow
  await page.locator('.hero__arrows button[aria-label="Next look"]').click();
  await page.waitForTimeout(2000);
  await report("after next");

  await page.screenshot({ path: "hero-desktop.png", fullPage: false });

  // hover the stage for parallax, then check the layers moved
  const stage = await page.locator(".hero__stage").boundingBox();
  await page.mouse.move(stage.x + stage.width * 0.85, stage.y + stage.height * 0.2);
  await page.waitForTimeout(900);
  const parallax = await page.locator(".slide.is-active .slide__layer--figure").evaluate(
    (el) => getComputedStyle(el).transform,
  );
  console.log("figure layer transform after hover:", parallax);

  // pin opens quick view
  await page.locator(".slide.is-active .pin").click({ force: true });
  await page.waitForTimeout(900);
  console.log("quickview open:", await page.locator(".qv").count(), "| title:", await page.locator(".qv h2, .qv__title").first().innerText().catch(() => "none"));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // mobile pass
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  m.on("pageerror", (e) => errors.push("mobile pageerror: " + e.message));
  await m.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await m.waitForTimeout(4500);
  const mb = async (sel) => {
    const el = m.locator(sel).first();
    if (!(await el.count())) return null;
    const b = await el.boundingBox();
    return b && { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
  };
  console.log("MOBILE", JSON.stringify({
    stage: await mb(".hero__stage"),
    figure: await mb(".slide.is-active .slide__figure"),
    form: await mb(".slide.is-active .slide__form"),
    rail: await mb(".hero__rail"),
    frame: await mb(".hero__frame"),
  }));
  await m.screenshot({ path: "hero-mobile.png", fullPage: false });

  console.log("console errors:", errors.length ? errors : "none");
  await browser.close();
})();
