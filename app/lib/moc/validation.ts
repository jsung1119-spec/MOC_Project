import type { MocBasicInfo } from "./types.ts";

export interface ValidationError {
  field: keyof MocBasicInfo;
  code: string;
  message: string;
  action: string;
}

const required: Array<[keyof MocBasicInfo, string]> = [
  ["title", "변경 제목"], ["reason", "변경 사유"], ["description", "변경 내용"],
  ["targetEquipment", "대상 설비/공정"], ["workType", "변경 대상 분야"],
  ["beforeState", "변경 전 상태"], ["afterState", "변경 후 상태"],
  ["changeKind", "변경 종류"], ["duration", "변경 구분"],
];

function dateOnly(value?: string) {
  if (!value) return Number.NaN;
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function validateBasicInfo(info: Partial<MocBasicInfo>): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const [field, label] of required) {
    const value = info[field];
    if (typeof value !== "string" || !value.trim()) {
      errors.push({ field, code: "REQUIRED", message: `${label}을(를) 입력해 주세요.`, action: `${label}을(를) 입력한 뒤 다음 단계로 진행하세요.` });
    }
  }

  if (info.duration === "TEMPORARY") {
    if (!info.temporaryStartDate || !info.temporaryEndDate) {
      errors.push({ field: "temporaryStartDate", code: "TEMPORARY_DATES_REQUIRED", message: "임시변경 사용기간을 입력해 주세요.", action: "시작일과 종료일을 모두 지정하세요." });
      return errors;
    }
    const start = dateOnly(info.temporaryStartDate);
    const end = dateOnly(info.temporaryEndDate);
    if (end < start) {
      errors.push({ field: "temporaryEndDate", code: "TEMPORARY_DATE_ORDER", message: "임시변경 종료일이 시작일보다 빠릅니다.", action: "종료일을 시작일 이후로 변경하세요." });
    } else {
      const inclusiveDays = Math.floor((end - start) / 86_400_000) + 1;
      if (inclusiveDays > 30) {
        errors.push({ field: "temporaryEndDate", code: "TEMPORARY_PERIOD_EXCEEDED", message: `임시변경 기간은 30일 이내여야 합니다. 현재 ${inclusiveDays}일입니다.`, action: "종료일을 조정하거나 영구변경으로 등록하세요." });
      }
    }
  }
  return errors;
}
