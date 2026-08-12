import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { BrowserMocRepository } from "../app/lib/moc/repository.ts";
import { createEmptyMocCase } from "../app/lib/moc/defaults.ts";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

test("D1 migration adds versioned guideline data without dropping legacy tables", async () => {
  const sql = await readFile(new URL("../drizzle/0001_guideline_moc.sql", import.meta.url), "utf8");
  for (const column of ["site", "schema_version", "basic_info_json", "replacement_decision_json", "grade_decision_json", "workflow_json", "business_records_json"]) {
    assert.match(sql, new RegExp(column));
  }
  assert.doesNotMatch(sql, /DROP\s+(TABLE|COLUMN)/i);
});

test("browser repository round-trips cases and isolates sites", async () => {
  const storage = new MemoryStorage();
  const repository = new BrowserMocRepository(storage);
  const lime = createEmptyMocCase({ id: "lime", caseNumber: "MOC-1", title: "라임", workType: "기계 설비", site: "포항라임공장" });
  const chemical = createEmptyMocCase({ id: "chemical", caseNumber: "MOC-2", title: "화성", workType: "배관", site: "포항화성공장" });

  await repository.save(lime);
  await repository.save(chemical);

  assert.deepEqual((await repository.list("포항라임공장")).map((item) => item.id), ["lime"]);
  assert.equal((await repository.get("chemical"))?.title, "화성");
});

test("deleting a case removes its reminder log but preserves other cases", async () => {
  const storage = new MemoryStorage();
  const repository = new BrowserMocRepository(storage);
  await repository.save(createEmptyMocCase({ id: "a", caseNumber: "MOC-A", title: "A", workType: "기계 설비", site: "포항라임공장" }));
  await repository.save(createEmptyMocCase({ id: "b", caseNumber: "MOC-B", title: "B", workType: "배관", site: "포항라임공장" }));
  storage.setItem("safechange-reminder-logs", JSON.stringify(["a", "b"]));

  await repository.remove(["a"]);

  assert.deepEqual((await repository.list("포항라임공장")).map((item) => item.id), ["b"]);
  assert.deepEqual(JSON.parse(storage.getItem("safechange-reminder-logs")), ["b"]);
});

test("invalid stored JSON is not overwritten during failed load", async () => {
  const storage = new MemoryStorage();
  storage.setItem("safechange-cases", "{broken");
  const repository = new BrowserMocRepository(storage);
  await assert.rejects(() => repository.list("포항라임공장"), /저장된 변경관리 이력을 읽을 수 없습니다/);
  assert.equal(storage.getItem("safechange-cases"), "{broken");
});
