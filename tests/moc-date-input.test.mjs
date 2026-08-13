import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const form = await readFile(new URL("../app/components/moc/NewMocCaseForm.tsx", import.meta.url), "utf8");
const process = await readFile(new URL("../app/components/moc/MocProcessWorkspace.tsx", import.meta.url), "utf8");

test("controlled date fields persist the browser input event immediately", () => {
  assert.match(form, /<input type=\{type\} value=\{value\} onInput=/);
  assert.doesNotMatch(process, /type="date"[^>]*onChange=/);
  assert.match(process, /type="date"[^>]*onInput=/);
});
