import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("mobile navigation can be opened and closed from the compact header", async () => {
  const page = await read("../app/page.tsx");

  assert.match(page, /const \[mobileNavOpen, setMobileNavOpen\] = useState\(false\)/);
  assert.match(page, /className=\{cn\("sidebar", mobileNavOpen && "mobile-open"\)\}/);
  assert.match(page, /className="mobile-menu-toggle"/);
  assert.match(page, /onOpenMobileNav=\{\(\) => setMobileNavOpen\(true\)\}/);
  assert.match(page, /onClick=\{\(\) => setMobileNavOpen\(false\)\}/);
});

test("mobile CSS uses a drawer navigation and keeps wide tables scrollable", async () => {
  const css = await read("../app/globals.css");

  assert.match(css, /@media\(max-width:820px\)\{[\s\S]*?\.sidebar\{[\s\S]*?transform:translateX\(-100%\)/);
  assert.match(css, /\.sidebar\.mobile-open\{transform:translateX\(0\)\}/);
  assert.match(css, /\.mobile-menu-toggle\{display:inline-flex/);
  assert.match(css, /\.table-wrap,[\s\S]*?\.process-table-wrap\{overflow-x:auto/);
  assert.match(css, /\.stats-grid,[\s\S]*?\.chart-grid\{grid-template-columns:1fr/);
});

test("mobile drawer keeps menu labels together and exposes all navigation items", async () => {
  const css = await read("../app/globals.css");

  assert.match(css, /width:min\(340px,calc\(100vw - 32px\)\);[\s\S]*?flex-direction:column;[\s\S]*?align-items:stretch/);
  assert.match(css, /\.mobile-nav-head b\{[\s\S]*?white-space:nowrap/);
  assert.match(css, /\.sidebar nav\{[\s\S]*?display:block/);
  assert.match(css, /\.sidebar nav button,[\s\S]*?font-size:14px[\s\S]*?white-space:nowrap/);
  assert.match(css, /\.sidebar nav button span\{[\s\S]*?flex:0 0 23px/);
});
