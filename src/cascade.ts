export type NodeKind = "olt" | "fiber" | "plc" | "fbt" | "splice" | "connector" | "ont";
export type TopologyNode = {
  id: string;
  parentId: string | null;
  kind: NodeKind;
  name: string;
  lengthKm: number;
  attenuationDbPerKm: number;
  insertionLossDb: number;
  txDbm?: number;
  rxSensitivityDbm?: number;
  rxOverloadDbm?: number;
};
export type PathResult = { node: TopologyNode; lossDb: number; rxDbm: number; path: TopologyNode[]; marginDb: number | null; status: string };
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
      output.push({node:terminal,lossDb:0,rxDbm:NaN,path,marginDb:null,status:"Нет корректного пути от OLT"});
      continue;
    }
    const tx = root.txDbm ?? 5;
    const lossDb = path.reduce((sum,n) => sum + nodeLoss(n),0);
    const rxDbm = tx - lossDb;
    const sensitivity = terminal.rxSensitivityDbm ?? -28;
    const overload = terminal.rxOverloadDbm ?? -8;
    const marginDb = rxDbm - sensitivity;
    const status = rxDbm < sensitivity ? "Ниже чувствительности" : rxDbm > overload ? "Выше допустимого уровня" : marginDb < 3 ? "Недостаточный запас" : "В пределах заданных параметров";
    output.push({node:terminal,lossDb,rxDbm,path,marginDb,status});
  }
  return output;
}
export function makeTopologyNode(kind: NodeKind, parentId: string | null): TopologyNode {
  const id = globalThis.crypto?.randomUUID?.() ?? `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const base: Record<NodeKind,Omit<TopologyNode,"id"|"parentId"|"kind">> = {
    olt:{name:"OLT",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:0,txDbm:5},
    fiber:{name:"Волокно 1 км",lengthKm:1,attenuationDbPerKm:0.35,insertionLossDb:0},
    plc:{name:"PLC 1:8",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:10.5},
    fbt:{name:"FBT 1:4",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:7.2},
    splice:{name:"Сварка",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:0.1},
    connector:{name:"Коннектор",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:0.3},
    ont:{name:"ONT / ONU",lengthKm:0,attenuationDbPerKm:0,insertionLossDb:0,rxSensitivityDbm:-28,rxOverloadDbm:-8}
  };
  return {id,parentId,kind,...base[kind]};
}
