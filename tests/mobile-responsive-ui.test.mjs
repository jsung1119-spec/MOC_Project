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
