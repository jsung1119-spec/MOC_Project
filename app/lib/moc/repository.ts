import type { Site } from "../sites.ts";
import { normalizeMocCasesV2 } from "./migration.ts";
import type { MocCaseV2 } from "./types.ts";

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface MocRepository {
  list(site: Site): Promise<MocCaseV2[]>;
  get(id: string): Promise<MocCaseV2 | undefined>;
  save(item: MocCaseV2): Promise<void>;
  remove(ids: string[]): Promise<void>;
}

const CASES_KEY = "safechange-cases";
const REMINDER_LOGS_KEY = "safechange-reminder-logs";

export class BrowserMocRepository implements MocRepository {
  private readonly storage: StorageLike;

  constructor(storage: StorageLike) {
    this.storage = storage;
  }

  private readAll(): MocCaseV2[] {
    const raw = this.storage.getItem(CASES_KEY);
    if (!raw) return [];
    try {
      return normalizeMocCasesV2(JSON.parse(raw));
    } catch (cause) {
      throw new Error("저장된 변경관리 이력을 읽을 수 없습니다. 원본 데이터는 유지되었습니다.", { cause });
    }
  }

  async list(site: Site) {
    return this.readAll().filter((item) => item.site === site);
  }

  async get(id: string) {
    return this.readAll().find((item) => item.id === id);
  }

  async save(item: MocCaseV2) {
    const cases = this.readAll();
    const index = cases.findIndex((candidate) => candidate.id === item.id);
    if (index >= 0) cases[index] = item;
    else cases.push(item);
    this.storage.setItem(CASES_KEY, JSON.stringify(cases));
  }

  async remove(ids: string[]) {
    const deleted = new Set(ids);
    this.storage.setItem(CASES_KEY, JSON.stringify(this.readAll().filter((item) => !deleted.has(item.id))));
    const rawLogs = this.storage.getItem(REMINDER_LOGS_KEY);
    if (!rawLogs) return;
    try {
      const logs = JSON.parse(rawLogs);
      if (Array.isArray(logs)) this.storage.setItem(REMINDER_LOGS_KEY, JSON.stringify(logs.filter((id) => typeof id === "string" && !deleted.has(id))));
    } catch {
      // Do not overwrite malformed reminder logs; cases have already been safely removed.
    }
  }
}
