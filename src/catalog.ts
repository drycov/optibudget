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
  sourceUrl: string;
  verifiedAt: string;
  notes: string;
};
export const STARTER_CATALOG: CatalogItem[] = [
  ...["Huawei","ZTE","Nokia","FiberHome","BDCOM","C-Data","VSOL","Dasan","Calix","Adtran","Zyxel","Raisecom","Eltex"].map((vendor,i)=>({
    id:`vendor-${i+1}`,vendor,model:"",category:"OLT" as const,technology:"GPON / EPON / зависит от модели",
    txMinDbm:null,txMaxDbm:null,rxSensitivityDbm:null,rxOverloadDbm:null,insertionLossDb:null,
    sourceUrl:"",verifiedAt:"",notes:"Заполнить по официальному datasheet точной модели."
  })),
  ...["Corning","CommScope","Fujikura","Sumitomo Electric","Furukawa","FS"].map((vendor,i)=>({
    id:`passive-${i+1}`,vendor,model:"",category:"PLC" as const,technology:"Пассивная оптика",
    txMinDbm:null,txMaxDbm:null,rxSensitivityDbm:null,rxOverloadDbm:null,insertionLossDb:null,
    sourceUrl:"",verifiedAt:"",notes:"Указать тип, коэффициент деления и паспортные insertion loss."
  }))
];
