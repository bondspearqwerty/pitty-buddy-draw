export type CheckStatus = "Не Проверено" | "Проверено" | "Требует Внимания";
export type ModuleState = "Канонично" | "Забагован" | "В разработке" | "Устарело";
export type UnderstandingLevel =
  | "Полное понимание"
  | "Выше среднего"
  | "Среднее"
  | "Ниже Среднего"
  | "Нет понимания";

export interface Question {
  id: string;
  title: string;
  topic: string;
}

export interface Section {
  id: string;
  label: string;
  description: string;
  understanding: UnderstandingLevel;
  status: ModuleState;
}

export interface Subform {
  id: string;
  label: string;
  description: string;
}



export interface FieldProcess {
  id: string;
  name: string;
}

export interface Field {
  id: string;
  label: string;
  description: string;
  sectionId: string | null;
  processes: FieldProcess[];
  checkStatus: CheckStatus;
  checkTime: string;
}

export interface Process {
  id: string;
  label: string;
  description: string;
  understanding: UnderstandingLevel;
  status: ModuleState;
}

export interface DeepCheckModule {
  id: string;
  label: string;
  description: string;
  state: ModuleState;
  understanding: UnderstandingLevel;
  questions: Question[];
  sections: Section[];
  fields: Field[];
  processes: Process[];
  createdAt: number;
}

export const STORAGE_KEY = "deep-check:modules:v1";
export const OPEN_TABS_KEY = "deep-check:open-tabs:v1";
export const ACTIVE_TAB_KEY = "deep-check:active-tab:v1";

export const MODULE_STATES: ModuleState[] = [
  "Канонично",
  "В разработке",
  "Забагован",
  "Устарело",
];

export const UNDERSTANDING_LEVELS: UnderstandingLevel[] = [
  "Полное понимание",
  "Выше среднего",
  "Среднее",
  "Ниже Среднего",
  "Нет понимания",
];

export const CHECK_STATUSES: CheckStatus[] = [
  "Не Проверено",
  "Проверено",
  "Требует Внимания",
];
