import type { MapRoute } from "./geo";
import type { TopologyNode } from "./cascade";
import { makeTopologyNode } from "./cascade";

export function fiberNodesOrdered(nodes: TopologyNode[]): TopologyNode[] {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const depth = (n: TopologyNode) => {
    let d = 0;
    let cur: TopologyNode | undefined = n;
    const seen = new Set<string>();
    while (cur?.parentId && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.parentId);
      d++;
    }
    return d;
  };
  return nodes
    .filter(n => n.kind === "fiber")
    .sort((a, b) => depth(a) - depth(b) || a.name.localeCompare(b.name));
}

/** Auto-bind map routes to cascade fiber nodes; create missing; sum multi-segment. */
export function autoBindRoutesToCascade(
  routes: MapRoute[],
  nodes: TopologyNode[]
): { routes: MapRoute[]; nodes: TopologyNode[]; report: string } {
  let nextNodes = [...nodes];
  const fibers = fiberNodesOrdered(nextNodes);
  const usedFiberIds = new Set<string>();
  const nextRoutes: MapRoute[] = [];

  for (const r of routes) {
    if (r.nodeId && fibers.some(f => f.id === r.nodeId)) {
      usedFiberIds.add(r.nodeId);
      nextRoutes.push(r);
    } else {
      nextRoutes.push({ ...r, nodeId: undefined });
    }
  }

  const freeFibers = fibers.filter(f => !usedFiberIds.has(f.id));
  let freeIdx = 0;
  for (let i = 0; i < nextRoutes.length; i++) {
    if (nextRoutes[i].nodeId) continue;
    if (freeIdx < freeFibers.length) {
      const fid = freeFibers[freeIdx++].id;
      nextRoutes[i] = { ...nextRoutes[i], nodeId: fid };
      usedFiberIds.add(fid);
    }
  }

  const olt = nextNodes.find(n => n.kind === "olt");
  const parentId = olt?.id ?? null;
  let created = 0;
  for (let i = 0; i < nextRoutes.length; i++) {
    if (nextRoutes[i].nodeId) continue;
    const fiber = makeTopologyNode("fiber", parentId);
    fiber.name = nextRoutes[i].name || `Трасса ${i + 1}`;
    fiber.lengthKm = nextRoutes[i].effectiveKm;
    fiber.attenuationDbPerKm = nextRoutes[i].attenuationDbPerKm;
    nextNodes = [...nextNodes, fiber];
    nextRoutes[i] = { ...nextRoutes[i], nodeId: fiber.id };
    created++;
  }

  const lengthByNode = new Map<string, { km: number; att: number; names: string[] }>();
  for (const r of nextRoutes) {
    if (!r.nodeId) continue;
    const prev = lengthByNode.get(r.nodeId);
    if (prev) {
      lengthByNode.set(r.nodeId, {
        km: prev.km + r.effectiveKm,
        att: r.attenuationDbPerKm || prev.att,
        names: [...prev.names, r.name]
      });
    } else {
      lengthByNode.set(r.nodeId, {
        km: r.effectiveKm,
        att: r.attenuationDbPerKm,
        names: [r.name]
      });
    }
  }

  nextNodes = nextNodes.map(n => {
    const hit = lengthByNode.get(n.id);
    if (!hit || n.kind !== "fiber") return n;
    return { ...n, lengthKm: Number(hit.km.toFixed(4)), attenuationDbPerKm: hit.att };
  });

  const bound = nextRoutes.filter(r => r.nodeId).length;
  const multi = [...lengthByNode.values()].filter(v => v.names.length > 1).length;
  const report =
    `Привязано трасс: ${bound}/${nextRoutes.length}. ` +
    (created ? `Создано узлов волокна: ${created}. ` : "") +
    `С суммированием в один узел: ${multi}.`;

  return { routes: nextRoutes, nodes: nextNodes, report };
}
