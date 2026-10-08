const { chromium } = require("playwright");

const views = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];

let failures = 0;
const log = (ok, label, extra) => {
  if (!ok) failures++;
  console.log(`  ${ok ? "OK  " : "FAIL"} ${label}${extra ? "  " + extra : ""}`);
};

(async () => {
  const browser = await chromium.launch();

  /* ---------- geometry + console, per viewport ---------- */
  for (const vp of views) {
    const page = await browser.newPage({ viewport: vp });
    const msgs = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") {
        msgs.push(`${m.type()}: ${m.text().slice(0, 200)}`);
      }
    });
    page.on("pageerror", (e) => msgs.push(`pageerror: ${String(e).slice(0, 200)}`));
    page.on("response", (r) => {
      if (r.status() >= 400) msgs.push(`${r.status()} ${r.url().slice(0, 120)}`);
    });

    await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
    await page.waitForTimeout(6500);

    const d = await page.evaluate(() => {
      const box = (sel) => {
        const e = document.querySelector(sel);
        return e ? e.getBoundingClientRect() : null;
      };
      const active = document.querySelector(".rw__look.is-active .rw__look-img");
      let fig = null;
      if (active && active.naturalWidth) {
        const b = active.getBoundingClientRect();
        const k = Math.min(b.width / active.naturalWidth, b.height / active.naturalHeight);
        const w = active.naturalWidth * k;
        const h = active.naturalHeight * k;
        fig = {
          left: b.left + (b.width - w) / 2,
          right: b.left + (b.width + w) / 2,
          top: b.bottom - h,
          bottom: b.bottom,
          w,
          h,
        };
      }
      const fill = box(".rw__track span");
      return {
        vh: innerHeight,
        hero: box(".hero"),
        frame: box(".rw__frame"),
        copy: box(".rw__copy"),
        stage: box(".rw__stage"),
        rail: box(".rw__rail"),
        controls: box(".rw__controls"),
        deckActive: box(".rw__deck-card.is-active"),
        fig,
        fill: fill ? fill.width : 0,
        time: document.querySelector(".rw__time")?.textContent || "",
        title: document.querySelector(".rw__title")?.textContent || "",
        playLabel: document.querySelector(".rw__play")?.getAttribute("aria-label"),
      };
    });

    console.log(`\n[${vp.width}x${vp.height}] fig=${d.fig ? Math.round(d.fig.w) + "x" + Math.round(d.fig.h) : "n/a"} top=${d.fig ? Math.round(d.fig.top) : "-"} time="${d.time}"`);
    const mobile = vp.width <= 650;
    const tol = 1.5;
    log(d.hero.bottom <= vp.height + tol, "hero fits fold", `bottom=${Math.round(d.hero.bottom)}`);
    log(d.frame.top >= -tol && d.frame.bottom <= vp.height + tol, "frame inside viewport");
    log(d.controls.bottom <= d.frame.bottom + tol, "controls inside frame");
    log(d.stage.top >= d.frame.top - tol && d.stage.bottom <= d.controls.bottom + tol, "stage inside frame");
    log(!!d.fig && d.fig.bottom <= d.frame.bottom + tol, "figure above frame bottom");
    log(!!d.fig && d.fig.top >= d.frame.top - tol, "figure below frame top");
    log(!!d.fig && d.fig.h >= (mobile ? 0.3 : 0.36) * vp.height, "figure large", d.fig ? `h=${Math.round(d.fig.h)} / ${vp.height}` : "");
    if (!mobile) {
      log(d.copy.right <= d.stage.left + 2, "copy clears stage", `copyR=${Math.round(d.copy.right)} stageL=${Math.round(d.stage.left)}`);
      log(d.rail.left >= d.stage.right - 2, "rail clears stage");
      log(d.rail.right <= d.frame.right + tol, "rail inside frame");
      log(!!d.deckActive && d.deckActive.width > 70 && d.deckActive.height > 90, "deck card visible", d.deckActive ? `${Math.round(d.deckActive.width)}x${Math.round(d.deckActive.height)}` : "");
    } else {
      log(d.copy.right < d.rail.left, "copy clears rail", `copyR=${Math.round(d.copy.right)} railL=${Math.round(d.rail.left)}`);
      log(d.rail.bottom <= d.controls.top + tol, "rail above controls");
      log(d.copy.right <= d.frame.right - 10 && d.copy.left >= d.frame.left, "copy inside frame");
    }
    const m = d.time.match(/0:(\d\d) \/ 0:10/);
    log(!!m && parseInt(m[1], 10) >= 1, "progress running + time advancing", `"${d.time}" fill=${Math.round(d.fill)}px`);
    log(/^Look 0\d/.test(d.title.trim()), "look title", `"${d.title.trim().slice(0, 20)}"`);
    log(d.playLabel === "Pause the runway", "play control state", d.playLabel);
    log(msgs.length === 0, "no console errors/warnings", msgs.length ? JSON.stringify(msgs.slice(0, 3)) : "");
    await page.close();
  }

  /* ---------- interactions, desktop ---------- */
  console.log("\n[interactions @1440x900]");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(6500);

  const title = () => page.locator(".rw__title").textContent();
  const bg = () => page.evaluate(() => getComputedStyle(document.querySelector(".rw__bg")).backgroundColor);

  const t0 = (await title()).trim();
  const bg0 = await bg();

  await page.click(".rw__controls .rw__next");
  await page.waitForTimeout(2300);
  const t1 = (await title()).trim();
  log(t1 !== t0, "controls next advances look", `${t0} -> ${t1}`);
  const bg1 = await bg();
  log(bg1 !== bg0, "backdrop colour changes", `${bg0} -> ${bg1}`);

  await page.click('.rw__rail-nav button[aria-label="Previous look"]');
  await page.waitForTimeout(2300);
  log((await title()).trim() === t0, "rail prev returns", (await title()).trim());

  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(2300);
  log((await title()).trim() !== t0, "ArrowRight advances", (await title()).trim());

  /* pause freezes the progress bar, play resumes it */
  const fillW = async () => page.evaluate(() => document.querySelector(".rw__track span").getBoundingClientRect().width);
  await page.click(".rw__play");
  const w1 = await fillW();
  await page.waitForTimeout(1800);
  const w2 = await fillW();
  log(Math.abs(w2 - w1) < 2, "pause freezes progress", `${w1.toFixed(1)} -> ${w2.toFixed(1)}`);
  const labelPaused = await page.locator(".rw__play").getAttribute("aria-label");
  log(labelPaused === "Play the runway", "play label swaps", labelPaused);
  await page.click(".rw__play");
  const w3 = await fillW();
  await page.waitForTimeout(1800);
  const w4 = await fillW();
  log(w4 - w3 > 2, "resume continues progress", `${w3.toFixed(1)} -> ${w4.toFixed(1)}`);

  /* quick view from the rail */
  await page.click(".rw__add");
  await page.waitForTimeout(700);
  const qvOpen = await page.evaluate(() => !!document.querySelector(".overlay--center.is-open"));
  log(qvOpen, "quick view opens from rail +");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const qvClosed = await page.evaluate(() => !document.querySelector(".overlay--center.is-open"));
  log(qvClosed, "Escape closes quick view");

  /* automatic 10 second progression (bar was mid-flight, so allow the tail) */
  const tAuto = (await title()).trim();
  await page.waitForTimeout(11000);
  const tAuto2 = (await title()).trim();
  log(tAuto2 !== tAuto, "auto-advances within ~10s", `${tAuto} -> ${tAuto2}`);

  await page.close();
  await browser.close();
  console.log(failures ? `\n${failures} FAILURES` : "\nALL PASS");
  process.exit(failures ? 1 : 0);
})();
