export type CatalogItem = {
  id: string;
  vendor: string;
  model: string;
  category: "OLT" | "ONT/ONU" | "PLC" | "FBT" | "Optical module" | "Fiber";
  technology: string;
  txMinDbm: number | null;
  txMaxDbm: number | null;
  rxSensitivityDbm: number | null;
  rxOverloadDbm: number | null;
  insertionLossDb: number | null;
  attenuationDbPerKm: number | null;
  sourceUrl: string;
  verifiedAt: string;
  notes: string;
  dataStatus?: "datasheet" | "template";
};
const emptyOptics = {
  txMinDbm:null,txMaxDbm:null,rxSensitivityDbm:null,rxOverloadDbm:null,insertionLossDb:null,attenuationDbPerKm:null
};
const corningSource = "https://www.corning.com/catalog/coc/documents/product-specifications/CRR-1060-AEN.pdf";
export const STARTER_CATALOG: CatalogItem[] = [
  {id:"corning-plc-1x4",vendor:"Corning",model:"PLC 1x4 (CRR-1060)",category:"PLC",technology:"PLC splitter · 1×4 · 1260–1650 nm",...emptyOptics,insertionLossDb:7.2,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 7.2 dB по таблице PLC Specifications (1x4). Указано в datasheet; проверьте конкретное исполнение и разъёмы."},
  {id:"corning-plc-1x8",vendor:"Corning",model:"PLC 1x8 (CRR-1060)",category:"PLC",technology:"PLC splitter · 1×8 · 1260–1650 nm",...emptyOptics,insertionLossDb:10.5,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 10.5 dB по таблице PLC Specifications (1x8). Указано в datasheet; проверьте конкретное исполнение и разъёмы."},
  {id:"corning-plc-1x16",vendor:"Corning",model:"PLC 1x16 (CRR-1060)",category:"PLC",technology:"PLC splitter · 1×16 · 1260–1650 nm",...emptyOptics,insertionLossDb:13.8,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 13.8 dB по таблице PLC Specifications (1x16). Указано в datasheet; проверьте конкретное исполнение и разъёмы."},
  {id:"corning-plc-1x32",vendor:"Corning",model:"PLC 1x32 (CRR-1060)",category:"PLC",technology:"PLC splitter · 1×32 · 1260–1650 nm",...emptyOptics,insertionLossDb:17.1,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 17.1 dB по таблице PLC Specifications (1x32). Указано в datasheet; проверьте конкретное исполнение и разъёмы."},
  {id:"corning-plc-1x64-rack",vendor:"Corning",model:"PLC 1x64 Rack Mount (CAH-106)",category:"PLC",technology:"PLC splitter · 1×64 · 1260–1650 nm · rack",...emptyOptics,insertionLossDb:21,sourceUrl:"https://www.corning.com/catalog/coc/documents/product-specifications/CAH-106-AEN.pdf",verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Maximum insertion loss 21 dB для 1x64 rack-mount; не переносить это значение на другие корпуса/исполнения."},
  ...["Huawei","ZTE","Nokia","FiberHome","BDCOM","C-Data","VSOL","Dasan","Calix","Adtran","Zyxel","Raisecom","Eltex"].map((vendor,i)=>({
    id:`vendor-${i+1}`,vendor,model:"",category:"OLT" as const,technology:"GPON / EPON / зависит от модели",
    ...emptyOptics,txMinDbm:1.5,txMaxDbm:5,sourceUrl:"",verifiedAt:"",dataStatus:"template" as const,notes:"ШАБЛОН GPON B+ для предварительной оценки: TX диапазон 1.5…5 dBm. Это не паспорт конкретной модели; уточните класс, порт и трансивер."
  })),
  ...["Huawei","ZTE","Nokia","FiberHome","BDCOM","C-Data","VSOL","Dasan","Calix","Adtran","Zyxel","Raisecom","Eltex"].map((vendor,i)=>({
    id:`ont-${i+1}`,vendor,model:"",category:"ONT/ONU" as const,technology:"GPON / EPON / зависит от модели",
    ...emptyOptics,txMinDbm:0.5,txMaxDbm:5,rxSensitivityDbm:-27,rxOverloadDbm:-8,sourceUrl:"",verifiedAt:"",dataStatus:"template" as const,notes:"ШАБЛОН GPON B+ для предварительной оценки: TX 0.5…5 dBm, RX sensitivity −27 dBm, overload −8 dBm. Не паспорт модели; подтвердите по datasheet ONT и OLT."
  })),
  ...["CommScope","Fujikura","Sumitomo Electric","Furukawa","FS"].map((vendor,i)=>({
    id:`passive-${i+1}`,vendor,model:"",category:"PLC" as const,technology:"Пассивная оптика · шаблон",
    ...emptyOptics,sourceUrl:"",verifiedAt:"",dataStatus:"template" as const,notes:"ШАБЛОН: заполнить модель, коэффициент деления, insertion loss, диапазон длин волн и ссылку на datasheet."
  })),
  {id:"template-fiber-g652d",vendor:"Generic",model:"SMF G.652.D (template)",category:"Fiber",technology:"Одномодовое волокно · ориентир для предварительной оценки",...emptyOptics,attenuationDbPerKm:0.35,sourceUrl:"",verifiedAt:"",dataStatus:"template",notes:"Шаблон: 0.35 dB/km — примерное проектное значение, НЕ паспорт конкретного кабеля. Измените по паспорту и длине волны."},
  {id:"template-splice",vendor:"Generic",model:"Fusion splice (template)",category:"Optical module",technology:"Сварка волокна · шаблон",...emptyOptics,insertionLossDb:0.1,sourceUrl:"",verifiedAt:"",dataStatus:"template",notes:"Шаблонная оценка 0.1 dB на сварку; замените значением из норм проекта/измерений."},
  {id:"template-connector",vendor:"Generic",model:"Connector pair (template)",category:"Optical module",technology:"Пара оптических соединителей · шаблон",...emptyOptics,insertionLossDb:0.3,sourceUrl:"",verifiedAt:"",dataStatus:"template",notes:"Шаблонная оценка 0.3 dB на соединение; зависит от типа, чистоты и качества монтажа."}
];
