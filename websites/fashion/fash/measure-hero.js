const { chromium } = require("playwright");

const views = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
];

(async () => {
  const browser = await chromium.launch();
  for (const vp of views) {
    const page = await browser.newPage({ viewport: vp });
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    const data = await page.evaluate(() => {
      const rect = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), w: Math.round(b.width) };
      };
      const content = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const scale = Math.min(b.width / el.naturalWidth, b.height / el.naturalHeight);
        const ch = el.naturalHeight * scale;
        const cw = el.naturalWidth * scale;
        return {
          w: Math.round(cw),
          h: Math.round(ch),
          left: Math.round(b.left + (b.width - cw) / 2),
          right: Math.round(b.left + (b.width + cw) / 2),
          top: Math.round(b.bottom - ch),
          bottom: Math.round(b.bottom),
        };
      };
      const fig = content(".slide.is-active .slide__figure");
      const frm = content(".slide.is-active .slide__form");
      const overlapX = fig && frm ? Math.min(fig.right, frm.right) - Math.max(fig.left, frm.left) : 0;
      return {
        viewportH: innerHeight,
        hero: rect(".hero"),
        copy: rect(".hero__copy"),
        stage: rect(".hero__stage"),
        figure: fig,
        form: frm,
        overlapX,
        tagFig: rect(".slide.is-active .slide__tag--figure"),
        tagForm: rect(".slide.is-active .slide__tag--form"),
        statsBottom: rect(".hero__stats")?.bottom,
      };
    });
    const foldOk = data.hero.bottom <= vp.height;
    console.log(
      `${vp.width}x${vp.height}: hero=${data.hero.bottom}px ${foldOk ? "FITS" : "OVERFLOWS +" + (data.hero.bottom - vp.height)}`,
      JSON.stringify({
        copy: data.copy.h,
        stage: data.stage.h,
        figure: data.figure,
        form: data.form,
        statsBottom: data.statsBottom,
      }),
    );
    await page.close();
  }
  await browser.close();
})();
