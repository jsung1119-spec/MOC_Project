export type AssetType =
  | "VALVE" | "PIPING" | "FLANGE" | "PUMP" | "COMPRESSOR" | "TURBINE"
  | "RECIPROCATING_DEVICE" | "DRIVE_DEVICE" | "MOTOR" | "CONTROL_EQUIPMENT" | "CHEMICAL"
  | "MAINTENANCE" | "OPERATION" | "AUXILIARY_PROCESS";

export interface ReplacementCriterion {
  id: string;
  label: string;
  assetTypes: AssetType[];
  guidelineSection: "붙임 2 변경판정 기준";
}

const guidelineSection = "붙임 2 변경판정 기준" as const;

const equipment = (id: string, label: string, assetTypes: AssetType[]): ReplacementCriterion => ({
  id, label, assetTypes, guidelineSection,
});

const procedure = (id: string, label: string, assetType: AssetType): ReplacementCriterion => ({
  id, label, assetTypes: [assetType], guidelineSection,
});

const rotatingAssets: AssetType[] = ["PUMP", "COMPRESSOR", "TURBINE", "RECIPROCATING_DEVICE", "DRIVE_DEVICE", "MOTOR"];

export const replacementCriteria: ReplacementCriterion[] = [
  equipment("type", "형식", ["VALVE", "PIPING", "FLANGE", ...rotatingAssets]),
  equipment("material", "재료", ["VALVE", "PIPING", "FLANGE", ...rotatingAssets]),
  equipment("internalMaterial", "내부재료", ["PUMP", "COMPRESSOR", "TURBINE", "RECIPROCATING_DEVICE", "DRIVE_DEVICE", "MOTOR"]),
  equipment("nominalDiameter", "호칭경", ["VALVE", "PIPING"]),
  equipment("nominalRating", "호칭등급", ["VALVE"]),
  equipment("pipeThickness", "배관두께", ["PIPING"]),
  equipment("flangeSize", "플랜지 크기", ["PIPING", "FLANGE", ...rotatingAssets]),
  equipment("flangeRating", "플랜지 등급", ["PIPING", "FLANGE", ...rotatingAssets]),
  equipment("flangeFace", "플랜지 접합면", ["PIPING", "FLANGE", ...rotatingAssets]),
  equipment("capacity", "용량", ["PUMP", "COMPRESSOR", "TURBINE", "RECIPROCATING_DEVICE", "DRIVE_DEVICE", "MOTOR"]),
  equipment("sealType", "씰(Seal) 형식", ["PUMP", "COMPRESSOR", "TURBINE", "RECIPROCATING_DEVICE", "DRIVE_DEVICE", "MOTOR"]),
  equipment("electricalRating", "전기정격용량", ["DRIVE_DEVICE", "MOTOR"]),
  equipment("lubricationSystem", "윤활시스템", ["TURBINE", "RECIPROCATING_DEVICE", "DRIVE_DEVICE"]),
  equipment("measurementRange", "계측범위", ["CONTROL_EQUIPMENT"]),
  equipment("measurementUnit", "계측단위", ["CONTROL_EQUIPMENT"]),
  equipment("sensingElement", "감지부", ["CONTROL_EQUIPMENT"]),
  equipment("composition", "성분", ["CHEMICAL"]),
  equipment("handlingMethod", "취급방법", ["CHEMICAL"]),
  procedure("weldingProcedure", "용접절차", "MAINTENANCE"),
  procedure("heavyLiftingProcedure", "중량물취급 절차", "MAINTENANCE"),
  procedure("testOperationProcedure", "시운전 절차", "OPERATION"),
  procedure("shutdownProcedure", "가동중지 절차", "OPERATION"),
  procedure("emergencyOperationProcedure", "비상운전 절차", "OPERATION"),
  procedure("normalOperationProcedure", "정상운전 절차", "OPERATION"),
  procedure("alarmReset", "경보치 재설정", "OPERATION"),
  procedure("controlValueReset", "제어값 재설정", "OPERATION"),
  procedure("newBypass", "새로운 바이패스(By-pass) 설치", "OPERATION"),
  procedure("exchangerTubePlugging", "열교환기 Tube 막음", "OPERATION"),
  procedure("operationControlMethod", "운전제어방법", "OPERATION"),
  procedure("materialPurchaseProcedure", "자재 구매절차", "AUXILIARY_PROCESS"),
  procedure("equipmentRelocation", "설비 재배치", "AUXILIARY_PROCESS"),
  procedure("breatherVent", "Breather 밸브 또는 Vent 신설", "AUXILIARY_PROCESS"),
  procedure("newPipeConnection", "신설배관 연결", "AUXILIARY_PROCESS"),
  procedure("flarePiping", "Flare 배관", "AUXILIARY_PROCESS"),
  procedure("tankInletOutletPiping", "Tank 인입/토출 배관", "AUXILIARY_PROCESS"),
  procedure("pumpSuctionDischargePiping", "Pump 흡입/토출 배관", "AUXILIARY_PROCESS"),
  procedure("utilityOrConduit", "물 또는 증기배관, 전선관", "AUXILIARY_PROCESS"),
  procedure("temporaryProcessPiping", "임시 공정배관 연결", "AUXILIARY_PROCESS"),
  procedure("transferPiping", "다른 Tank로 옮기기 위한 배관", "AUXILIARY_PROCESS"),
  procedure("alternatePumpPiping", "다른 Pump를 사용하기 위한 배관", "AUXILIARY_PROCESS"),
  procedure("temporaryPipeRepair", "배관 고정·누출 임시수리", "MAINTENANCE"),
  procedure("hotTapping", "핫탭핑(Hot Tapping) 작업", "MAINTENANCE"),
  procedure("testOperation", "시운전(Test Operation)", "OPERATION"),
  procedure("lightingChange", "조명 변경(수량, 색, 배열)", "AUXILIARY_PROCESS"),
  procedure("safetyValveChange", "안전밸브 변경(설정압력, Orifice 크기, 형식)", "AUXILIARY_PROCESS"),
  procedure("documentDrawingProcedure", "서류 및 도면관리 절차(배포, 승인, 번호 부여)", "AUXILIARY_PROCESS"),
  procedure("technicalManagementProcedure", "기술관리 절차(배관명세, 작업지시절차)", "AUXILIARY_PROCESS"),
];

export function criteriaForAsset(assetType: string): ReplacementCriterion[] {
  return replacementCriteria.filter((criterion) => criterion.assetTypes.includes(assetType as AssetType));
}
