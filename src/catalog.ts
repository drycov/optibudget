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
  {id:"corning-plc-1x2",vendor:"Corning",model:"PLC 1x2 (CRR-1060 family)",category:"PLC",technology:"PLC splitter · 1×2 · 1260–1650 nm",...emptyOptics,insertionLossDb:3.7,sourceUrl:"https://ecatalog.corning.com/optical-communications/EMEA/en_GB/Fibre-Optic-Hardware/Splitters/Splitter-Minimodule/p/SPT0N006C1102L1501509",verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Максимальные потери 3.7 dB для Corning Splitter Minimodule 1×2 SC/APC. В PDF CRR-1060 таблица 1×2 отсутствует, поэтому значение подтверждено отдельной официальной карточкой Corning, а не таблицей CRR-1060."},
  {id:"template-fbt-1x2-50-50",vendor:"Generic",model:"FBT 1x2 50/50 (template)",category:"FBT",technology:"FBT fused coupler · 1×2 · ratio 50/50 · 1260–1630 nm",...emptyOptics,insertionLossDb:3.8,sourceUrl:"https://www.opelink.com/article/fbt-splitter-selection-guide-configurations-specifications-and-deployment-scenarios-i01445i1.html",verifiedAt:"",dataStatus:"template",notes:"Ориентировочная потеря 3.8 dB для FBT 1×2 с делением 50/50. Это не паспорт конкретного изделия; уточнить по datasheet."},
  {id:"corning-plc-1x4",vendor:"Corning",model:"PLC 1x4 (CRR-1060)",category:"PLC",technology:"PLC splitter · 1×4 · 1260–1650 nm",...emptyOptics,insertionLossDb:7.2,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 7.2 dB по таблице PLC Specifications (1x4). Указано в datasheet; проверьте конкретное исполнение и разъёмы."},
  {id:"corning-plc-1x8",vendor:"Corning",model:"PLC 1x8 (CRR-1060)",category:"PLC",technology:"PLC splitter · 1×8 · 1260–1650 nm",...emptyOptics,insertionLossDb:10.5,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 10.5 dB по таблице PLC Specifications (1x8). Указано в datasheet; проверьте конкретное исполнение и разъёмы."},
  {id:"corning-plc-1x16",vendor:"Corning",model:"PLC 1x16 (CRR-1060)",category:"PLC",technology:"PLC splitter · 1×16 · 1260–1650 nm",...emptyOptics,insertionLossDb:13.8,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 13.8 dB по таблице PLC Specifications (1x16). Указано в datasheet; проверьте конкретное исполнение и разъёмы."},
  {id:"corning-plc-1x32",vendor:"Corning",model:"PLC 1x32 (CRR-1060)",category:"PLC",technology:"PLC splitter · 1×32 · 1260–1650 nm",...emptyOptics,insertionLossDb:17.1,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 17.1 dB по таблице PLC Specifications (1x32). Указано в datasheet; проверьте конкретное исполнение и разъёмы."},
  {id:"corning-plc-1x64-bare",vendor:"Corning",model:"PLC 1x64 bare (product bulletin)",category:"PLC",technology:"PLC splitter · 1×64 · bare module · 1260–1650 nm",...emptyOptics,insertionLossDb:20.3,sourceUrl:"https://www.mdfmarketing.co.th/uploads/5277/files/Product/corning%20PLC%20Product%20Bulletin_03_04_2014.pdf",verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Максимальные потери 20.3 dB по таблице Corning PLC Product Bulletin; это bare splitter, не rack-mount."},
  {id:"corning-plc-2x2",vendor:"Corning",model:"PLC 2x2 (product bulletin)",category:"PLC",technology:"PLC splitter · 2×2 · bare module",...emptyOptics,insertionLossDb:4.0,sourceUrl:"https://www.mdfmarketing.co.th/uploads/5277/files/Product/corning%20PLC%20Product%20Bulletin_03_04_2014.pdf",verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Максимальные потери 4.0 dB по таблице Corning PLC Product Bulletin; сверить конкретную версию изделия."},
  {id:"corning-plc-2x4",vendor:"Corning",model:"PLC 2x4 (product bulletin)",category:"PLC",technology:"PLC splitter · 2×4 · bare module",...emptyOptics,insertionLossDb:7.3,sourceUrl:"https://www.mdfmarketing.co.th/uploads/5277/files/Product/corning%20PLC%20Product%20Bulletin_03_04_2014.pdf",verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Максимальные потери 7.3 dB по таблице Corning PLC Product Bulletin; сверить конкретную версию изделия."},
  {id:"corning-plc-2x8",vendor:"Corning",model:"PLC 2x8 (CRR-1060)",category:"PLC",technology:"PLC splitter · 2×8 · 1260–1650 nm",...emptyOptics,insertionLossDb:10.8,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 10.8 dB по таблице PLC Specifications (2x8)."},
  {id:"corning-plc-2x16",vendor:"Corning",model:"PLC 2x16 (CRR-1060)",category:"PLC",technology:"PLC splitter · 2×16 · 1260–1650 nm",...emptyOptics,insertionLossDb:14.1,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 14.1 dB по таблице PLC Specifications (2x16)."},
  {id:"corning-plc-2x32",vendor:"Corning",model:"PLC 2x32 (CRR-1060)",category:"PLC",technology:"PLC splitter · 2×32 · 1260–1650 nm",...emptyOptics,insertionLossDb:17.4,sourceUrl:corningSource,verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Insertion loss 17.4 dB по таблице PLC Specifications (2x32)."},
  {id:"corning-plc-2x64",vendor:"Corning",model:"PLC 2x64 (product bulletin)",category:"PLC",technology:"PLC splitter · 2×64 · bare module",...emptyOptics,insertionLossDb:20.5,sourceUrl:"https://www.mdfmarketing.co.th/uploads/5277/files/Product/corning%20PLC%20Product%20Bulletin_03_04_2014.pdf",verifiedAt:"2026-10-16",dataStatus:"datasheet",notes:"Максимальные потери 20.5 dB по таблице Corning PLC Product Bulletin; сверить конкретную версию изделия."},
  ...[
    {ratio:"1x3",ports:"1×3",loss:5.3},
    {ratio:"1x4",ports:"1×4",loss:6.8},
    {ratio:"1x8",ports:"1×8",loss:10.0},
    {ratio:"1x16",ports:"1×16",loss:13.5},
    {ratio:"1x32",ports:"1×32",loss:17.2},
    {ratio:"1x64",ports:"1×64",loss:20.5},
    {ratio:"2x2",ports:"2×2",loss:4.0},
    {ratio:"2x4",ports:"2×4",loss:7.3},
    {ratio:"2x8",ports:"2×8",loss:10.3},
    {ratio:"2x16",ports:"2×16",loss:13.8},
    {ratio:"2x32",ports:"2×32",loss:17.2},
    {ratio:"2x64",ports:"2×64",loss:20.5}
  ].map(({ratio,ports,loss})=>({id:`template-fbt-${ratio}-50-50`,vendor:"Generic",model:`FBT ${ratio} 50/50 (template)`,category:"FBT" as const,technology:`FBT fused coupler · ${ports} · ratio 50/50 · wavelength/model dependent`,...emptyOptics,insertionLossDb:loss,sourceUrl:"https://www.opelink.com/article/fbt-splitter-selection-guide-configurations-specifications-and-deployment-scenarios-i01445i1.html",verifiedAt:"",dataStatus:"template" as const,notes:`Ориентировочная потеря ${loss} dB для FBT ${ports} с симметричным делением. Это расчётный шаблон, не паспорт изделия; FBT больших коэффициентов часто каскадный и может иметь дополнительные потери. Уточнить по datasheet конкретной модели.`})),
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
