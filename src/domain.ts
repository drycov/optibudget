export type Technology = "GPON" | "EPON" | "10G-EPON" | "XG-PON" | "XGS-PON" | "XPON";
export type ElementKind = "fiber" | "plc" | "fbt" | "splice" | "connector" | "other";
export type LineElement = {
  id: string;
  kind: ElementKind;
  label: string;
  quantity: number;
  lengthKm: number;
  attenuationDbPerKm: number;
  insertionLossDb: number;
};
export type OpticalProfile = {
  txDbm: number;
  rxSensitivityDbm: number;
  rxOverloadDbm: number;
  designMarginDb: number;
};
export const TECHNOLOGY_PRESETS: Record<Technology, OpticalProfile> = {
  GPON: { txDbm: 5, rxSensitivityDbm: -28, rxOverloadDbm: -8, designMarginDb: 3 },
  EPON: { txDbm: 4, rxSensitivityDbm: -27, rxOverloadDbm: -3, designMarginDb: 3 },
  "10G-EPON": { txDbm: 5, rxSensitivityDbm: -28, rxOverloadDbm: -8, designMarginDb: 3 },
  "XG-PON": { txDbm: 4, rxSensitivityDbm: -28, rxOverloadDbm: -8, designMarginDb: 3 },
  "XGS-PON": { txDbm: 4, rxSensitivityDbm: -28, rxOverloadDbm: -8, designMarginDb: 3 },
  XPON: { txDbm: 5, rxSensitivityDbm: -27, rxOverloadDbm: -8, designMarginDb: 3 }
};
export const VENDOR_CATALOG = [
  { vendor: "Huawei", category: "OLT / ONT", note: "Параметры зависят от модели и класса оптики" },
  { vendor: "ZTE", category: "OLT / ONT", note: "Проверять паспорт конкретного устройства" },
  { vendor: "Nokia", category: "OLT / ONT", note: "Проверять оптический класс и длину волны" },
  { vendor: "FiberHome", category: "OLT / ONT", note: "Проверять паспорт конкретного устройства" },
  { vendor: "BDCOM", category: "OLT / ONU", note: "Проверять паспорт конкретного устройства" },
  { vendor: "C-Data", category: "OLT / ONU", note: "Проверять паспорт конкретного устройства" },
  { vendor: "Corning", category: "Пассивная оптика", note: "Потери брать из паспорта компонента" },
  { vendor: "CommScope", category: "Пассивная оптика", note: "Потери брать из паспорта компонента" },
  { vendor: "Fujikura", category: "Сварочное оборудование", note: "Для расчёта задавать фактические потери сварки" },
  { vendor: "FS", category: "PLC / FBT", note: "Использовать значение insertion loss из паспорта" }
] as const;
export function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
export function makeElement(kind: ElementKind): LineElement {
  const defaults: Record<ElementKind, Omit<LineElement, "id" | "kind">> = {
    fiber: { label: "Оптическое волокно", quantity: 1, lengthKm: 1, attenuationDbPerKm: 0.35, insertionLossDb: 0 },
    plc: { label: "PLC сплиттер 1:N", quantity: 1, lengthKm: 0, attenuationDbPerKm: 0, insertionLossDb: 10.5 },
    fbt: { label: "FBT сплиттер", quantity: 1, lengthKm: 0, attenuationDbPerKm: 0, insertionLossDb: 7.2 },
    splice: { label: "Сварка", quantity: 1, lengthKm: 0, attenuationDbPerKm: 0, insertionLossDb: 0.1 },
    connector: { label: "Соединитель", quantity: 1, lengthKm: 0, attenuationDbPerKm: 0, insertionLossDb: 0.3 },
    other: { label: "Прочий компонент", quantity: 1, lengthKm: 0, attenuationDbPerKm: 0, insertionLossDb: 0 }
  };
  return { id: createId(), kind, ...defaults[kind] };
}
export function elementLoss(e: LineElement): number {
  if (e.kind === "fiber") return Math.max(0, e.lengthKm) * Math.max(0, e.attenuationDbPerKm);
  return Math.max(0, e.quantity) * Math.max(0, e.insertionLossDb);
}
export function calculateBudget(profile: OpticalProfile, elements: LineElement[]) {
  const totalLossDb = elements.reduce((sum, item) => sum + elementLoss(item), 0);
  const rxPowerDbm = profile.txDbm - totalLossDb;
  const marginDb = rxPowerDbm - profile.rxSensitivityDbm;
  const designMarginDb = marginDb - profile.designMarginDb;
  return {
    totalLossDb,
    rxPowerDbm,
    marginDb,
    designMarginDb,
    withinSensitivity: rxPowerDbm >= profile.rxSensitivityDbm,
    withinOverload: rxPowerDbm <= profile.rxOverloadDbm,
    status: rxPowerDbm < profile.rxSensitivityDbm
      ? "Ниже чувствительности"
      : rxPowerDbm > profile.rxOverloadDbm
        ? "Выше допустимого уровня"
        : designMarginDb < 0
          ? "Нет проектного запаса"
          : "В пределах заданных параметров"
  };
}