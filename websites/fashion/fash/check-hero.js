const { chromium } = require("playwright");
const views = [{width:1440,height:900},{width:1366,height:768},{width:1920,height:1080},{width:1280,height:720},{width:1024,height:768},{width:390,height:844}];
(async () => {
  const browser = await chromium.launch();
  let fail = 0;
  for (const vp of views) {
    const page = await browser.newPage({ viewport: vp });
    const errs = [];
    page.on("console", m => { if (m.type() === "error") errs.push(m.text().slice(0,160)); });
    page.on("pageerror", e => errs.push(String(e).slice(0,160)));
    page.on("response", r => { if (r.status() >= 400) errs.push(r.status() + " " + r.url().slice(0,120)); });
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(4200);
    const d = await page.evaluate(() => {
      const R = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
      const C = s => {
        const e = document.querySelector(s); if (!e) return null;
        const b = e.getBoundingClientRect();
        const k = Math.min(b.width/e.naturalWidth, b.height/e.naturalHeight);
        const w = e.naturalWidth*k, h = e.naturalHeight*k;
        return { left:b.left+(b.width-w)/2, right:b.left+(b.width+w)/2, top:b.bottom-h, bottom:b.bottom, w, h };
      };
      const fig = C(".slide.is-active .slide__figure");
      const frm = C(".slide.is-active .slide__form");
      const copy = R(".hero__copy");
      const hero = R(".hero");
      const tagF = R(".slide.is-active .slide__tag--figure");
      const tagM = R(".slide.is-active .slide__tag--form");
      const frame = R(".hero__frame");
      return {
        vh: innerHeight,
        heroBottom: hero.bottom, fig, frm, copy, frame, tagF, tagM,
        figVsCopy: fig && copy ? fig.left - copy.right : null,
        tagFigClear: tagF && fig ? tagF.bottom < fig.top : null,
        tagFormClear: tagM && frm ? tagM.right < tagM.left || tagM.bottom < frm.top : null,
        tagInFrame: tagF && frame ? tagF.left > frame.left && tagF.top > frame.top : null,
        ovlpX: fig && frm ? Math.min(fig.right,frm.right) - Math.max(fig.left,frm.left) : 0,
      };
    });
    const stacked = vp.width <= 1024;
    const checks = [];
    if (!stacked) {
      checks.push(["hero fits fold", d.heroBottom <= vp.height + 1]);
      checks.push(["figure fully above fold", d.fig.bottom <= vp.height && d.fig.top >= 0]);
      checks.push(["figure clears copy", d.figVsCopy > -5]);
      checks.push(["figure large", d.fig.w >= 0.42 * vp.height]);
      checks.push(["form visible", d.frm.w > 150]);
      checks.push(["no subject collision", d.ovlpX < d.frm.w * 0.45]);
    }
    checks.push(["tag-figure clear", d.tagFigClear !== false]);
    checks.push(["tag-form clear", d.tagFormClear !== false]);
    checks.push(["tags in frame", d.tagInFrame !== false]);
    checks.push(["no console/network errors", errs.length === 0]);
    const bad = checks.filter(([,ok]) => !ok);
    if (bad.length) fail++;
    console.log(`${vp.width}x${vp.height} fig=${d.fig&&Math.round(d.fig.w)}x${Math.round(d.fig.h)} top=${d.fig&&Math.round(d.fig.top)} ovl=${Math.round(d.ovlpX)} ${bad.length ? "FAIL: "+bad.map(b=>b[0]).join(", ") : "OK"}`, errs.slice(0,3));
    await page.close();
  }
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
