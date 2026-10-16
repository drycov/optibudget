export type NodeKind = "olt" | "fiber" | "plc" | "fbt" | "splice" | "connector" | "ont";
export type OpticalClass = "Custom" | "GPON B+" | "GPON C+" | "GPON C++" | "XGS-PON N1" | "XGS-PON N2" | "XGS-PON E1" | "XGS-PON E2";
export const OPTICAL_CLASS_BUDGET_DB: Record<OpticalClass,number> = {
  "Custom": 28, "GPON B+": 28, "GPON C+": 32, "GPON C++": 35,
  "XGS-PON N1": 29, "XGS-PON N2": 31, "XGS-PON E1": 33, "XGS-PON E2": 35
};
export const WAVELENGTHS_NM = [1270,1310,1490,1550,1577] as const;
export type TopologyNode = {
  id: string;
  parentId: string | null;
  kind: NodeKind;
  name: string;
  lengthKm: number;
  attenuationDbPerKm: number;
  insertionLossDb: number;
  wavelengthNm?: number;
  opticalClass?: OpticalClass;
  opticalBudgetDb?: number;
  catalogItemId?: string;
  txDbm?: number;
  rxSensitivityDbm?: number;
  rxOverloadDbm?: number;
};
export type PathResult = { node: TopologyNode; lossDb: number; rxDbm: number; path: TopologyNode[]; marginDb: number | null; designMarginDb: number | null; opticalBudgetDb: number | null; status: string };
export const NODE_LABELS: Record<NodeKind,string> = {
  olt:"OLT / источник", fiber:"Оптическое волокно", plc:"PLC сплиттер", fbt:"FBT сплиттер",
  splice:"Сварка", connector:"Соединитель", ont:"ONT / ONU"
};
export function nodeLoss(n: TopologyNode): number {
  if (n.kind === "fiber") return Math.max(0,n.lengthKm) * Math.max(0,n.attenuationDbPerKm);
  if (n.kind === "olt" || n.kind === "ont") return 0;
  return Math.max(0,n.insertionLossDb);
}
export function calculateTopology(nodes: TopologyNode[]): PathResult[] {
  const byId = new Map(nodes.map(n => [n.id,n]));
  const roots = nodes.filter(n => n.kind === "olt");
  const output: PathResult[] = [];
  for (const terminal of nodes.filter(n => n.kind === "ont")) {
    const reversePath: TopologyNode[] = [];
    const visited = new Set<string>();
    let current: TopologyNode | undefined = terminal;
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      reversePath.push(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    const path = reversePath.reverse();
    const root = path[0];
    if (!root || root.kind !== "olt" || !roots.some(r => r.id === root.id) || path[path.length-1]?.id !== terminal.id) {
      output.push({node:terminal,lossDb:0,rxDbm:NaN,path,marginDb:null,designMarginDb:null,opticalBudgetDb:null,status:"Нет корректного пути от OLT"});
      continue;
    }
    const tx = root.txDbm ?? 5;
    const lossDb = path.reduce((sum,n) => sum + nodeLoss(n),0);
    const rxDbm = tx - lossDb;
    const sensitivity = terminal.rxSensitivityDbm ?? -28;
    const overload = terminal.rxOverloadDbm ?? -8;
    const marginDb = rxDbm - sensitivity;
    const opticalBudgetDb = root.opticalBudgetDb ?? OPTICAL_CLASS_BUDGET_DB[root.opticalClass ?? "Custom"];
    const designMarginDb = opticalBudgetDb - lossDb;
    const status = rxDbm < sensitivity ? "Ниже чувствительности" : rxDbm > overload ? "Выше допустимого уровня" : designMarginDb < 3 ? "Недостаточный запас по бюджету" : "В пределах заданных параметров";
    output.push({node:terminal,lossDb,rxDbm,path,marginDb,designMarginDb,opticalBudgetDb,status});
  }
  return output;
}
export function makeTopologyNode(kind: NodeKind, parentId: string | null): TopologyNode {
  const id = globalThis.crypto?.randomUUID?.() ?? `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const base: Record<NodeKind,Omit<TopologyNode,"id"|"parentId"|"kind">> = {
    olt:{name:"OLT",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:0,txDbm:5,wavelengthNm:1490,opticalClass:"GPON B+",opticalBudgetDb:28},
    fiber:{name:"Волокно 1 км",lengthKm:1,attenuationDbPerKm:0.35,insertionLossDb:0,wavelengthNm:1490},
    plc:{name:"PLC 1:8",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:10.5,wavelengthNm:1490},
    fbt:{name:"FBT 1:4",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:7.2,wavelengthNm:1490},
    splice:{name:"Сварка",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:0.1,wavelengthNm:1490},
    connector:{name:"Коннектор",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:0.3,wavelengthNm:1490},
    ont:{name:"ONT / ONU",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:0,rxSensitivityDbm:-28,rxOverloadDbm:-8,wavelengthNm:1490,opticalClass:"GPON B+"}
  };
  return {id,parentId,kind,...base[kind]};
}
