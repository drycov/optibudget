import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { Download, MapPin, Plus, Trash2, Link2, Navigation, Layers } from "lucide-react";
import { DEFAULT_MAP_CENTER, MapRoute, LatLng, createId, recalcRoute, pathLengthKm, applySlackFactor } from "./geo";
import type { TopologyNode } from "./cascade";
import { makeTopologyNode } from "./cascade";
import { autoBindRoutesToCascade, fiberNodesOrdered } from "./mapAutoBind";
import "./map.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const STORAGE_KEY = "optibudget.map.v1";
const TOPOLOGY_KEY = "optibudget.topology.v1";
type MapState = { center: { lat: number; lng: number; zoom: number }; routes: MapRoute[]; draftPoints: LatLng[] };

function loadState(): MapState {
  try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw) as MapState; } catch {}
  return { center: { ...DEFAULT_MAP_CENTER }, routes: [], draftPoints: [] };
}
function loadTopologyNodes(): TopologyNode[] {
  try { const raw = localStorage.getItem(TOPOLOGY_KEY); if (raw) return JSON.parse(raw) as TopologyNode[]; } catch {}
  return [];
}
function saveTopologyNodes(nodes: TopologyNode[]) { localStorage.setItem(TOPOLOGY_KEY, JSON.stringify(nodes)); }

function ClickCapture({ enabled, onClick }: { enabled: boolean; onClick: (p: LatLng) => void }) {
  useMapEvents({ click(e) { if (enabled) onClick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}
function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number])), { padding: [40, 40] });
  }, [points, map]);
  return null;
}

const COLORS = ["#2563eb", "#059669", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];

export default function MapPlanner() {
  const [state, setState] = useState<MapState>(loadState);
  const [drawing, setDrawing] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [fiberNodes, setFiberNodes] = useState<TopologyNode[]>([]);
  const [bindNodeId, setBindNodeId] = useState("");
  const [slackPercent, setSlackPercent] = useState(5);
  const [attenuation, setAttenuation] = useState(0.35);

  const refreshFibers = useCallback(() => setFiberNodes(fiberNodesOrdered(loadTopologyNodes())), []);
  useEffect(() => { refreshFibers(); }, [refreshFibers]);
  const persist = useCallback((next: MapState) => { setState(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }, []);
  const draftLength = useMemo(() => pathLengthKm(state.draftPoints), [state.draftPoints]);
  const draftEffective = useMemo(() => applySlackFactor(draftLength, slackPercent), [draftLength, slackPercent]);

  function applyLengthToNode(nodeId: string, lengthKm: number, attenuationDbPerKm: number) {
    try {
      saveTopologyNodes(loadTopologyNodes().map(n => n.id === nodeId && n.kind === "fiber" ? { ...n, lengthKm, attenuationDbPerKm } : n));
      refreshFibers();
      setMessage(m => (m ? m + " " : "") + "Длина записана в узел каскада.");
    } catch { setMessage("Не удалось записать длину в топологию."); }
  }

  function finishRoute() {
    if (state.draftPoints.length < 2) { setMessage("Нужно минимум 2 точки."); return; }
    let nodeId = bindNodeId || undefined;
    if (!nodeId) {
      const used = new Set(state.routes.map(r => r.nodeId).filter(Boolean));
      const free = fiberNodesOrdered(loadTopologyNodes()).find(f => !used.has(f.id));
      if (free) nodeId = free.id;
    }
    const route = recalcRoute({
      id: createId(), name: `Трасса ${state.routes.length + 1}`, nodeId, points: state.draftPoints,
      slackPercent, attenuationDbPerKm: attenuation, color: COLORS[state.routes.length % COLORS.length]
    });
    persist({ ...state, routes: [...state.routes, route], draftPoints: [] });
    setDrawing(false); setSelectedId(route.id);
    setMessage(`Трасса: ${route.measuredKm.toFixed(3)} → ${route.effectiveKm.toFixed(3)} км.` + (nodeId ? " Привязана." : " Нажмите «Автопривязка всех»."));
    if (route.nodeId) applyLengthToNode(route.nodeId, route.effectiveKm, route.attenuationDbPerKm);
  }

  function autoBindAll() {
    let nodes = loadTopologyNodes();
    if (!nodes.some(n => n.kind === "olt") && state.routes.length) nodes = [...nodes, makeTopologyNode("olt", null)];
    const { routes, nodes: next, report } = autoBindRoutesToCascade(state.routes, nodes);
    saveTopologyNodes(next); persist({ ...state, routes }); refreshFibers();
    setMessage(report + " Откройте «Каскад».");
  }

  function exportGeoJson() {
    const geo = { type: "FeatureCollection", features: state.routes.map(r => ({
      type: "Feature",
      properties: { id: r.id, name: r.name, nodeId: r.nodeId ?? null, measuredKm: r.measuredKm, effectiveKm: r.effectiveKm },
      geometry: { type: "LineString", coordinates: r.points.map(p => [p.lng, p.lat]) }
    }))};
    const url = URL.createObjectURL(new Blob([JSON.stringify(geo, null, 2)], { type: "application/geo+json" }));
    const a = document.createElement("a"); a.href = url; a.download = "optibudget-routes.geojson"; a.click(); URL.revokeObjectURL(url);
  }

  const allPoints = useMemo(() => [...state.routes.flatMap(r => r.points), ...state.draftPoints], [state.routes, state.draftPoints]);
  const unbound = state.routes.filter(r => !r.nodeId).length;

  return (
    <div className="map-workspace">
      <div className="map-intro">
        <div className="map-icon"><MapPin size={20} /></div>
        <div>
          <h2>Карта трасс волокна</h2>
          <p>Несколько сегментов → «Автопривязка всех» к fiber в каскаде (создание недостающих, сумма длин).</p>
        </div>
        <div className="map-actions">
          <button className="btn primary" onClick={autoBindAll} disabled={!state.routes.length}>
            <Layers size={15} /> Автопривязка всех{unbound ? ` (${unbound})` : ""}
          </button>
          <button className="btn" onClick={() => navigator.geolocation?.getCurrentPosition(
            pos => persist({ ...state, center: { lat: pos.coords.latitude, lng: pos.coords.longitude, zoom: 15 } })
          )}><Navigation size={15} /> Моё место</button>
          <button className="btn" onClick={exportGeoJson}><Download size={15} /> GeoJSON</button>
        </div>
      </div>
      <div className="map-layout">
        <section className="panel map-canvas-panel">
          <div className="map-toolbar">
            {!drawing ? (
              <button className="btn primary" onClick={() => setDrawing(true)}><Plus size={14} /> Новая трасса</button>
            ) : (
              <>
                <button className="btn primary" onClick={finishRoute}>Завершить</button>
                <button className="btn" onClick={() => persist({ ...state, draftPoints: state.draftPoints.slice(0, -1) })}>Отменить точку</button>
                <button className="btn" onClick={() => { setDrawing(false); persist({ ...state, draftPoints: [] }); }}>Сброс</button>
                <span className="map-draft-info">{state.draftPoints.length} pts · {draftLength.toFixed(3)} → {draftEffective.toFixed(3)} км</span>
              </>
            )}
            <label className="map-inline-field">Запас %<input type="number" min={0} max={50} value={slackPercent} onChange={e => setSlackPercent(+e.target.value)} /></label>
            <label className="map-inline-field">dB/км<input type="number" min={0} step={0.01} value={attenuation} onChange={e => setAttenuation(+e.target.value)} /></label>
            <label className="map-inline-field grow">Волокно
              <select value={bindNodeId} onChange={e => setBindNodeId(e.target.value)}>
                <option value="">Авто</option>
                {fiberNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
            </label>
          </div>
          <div className="map-frame">
            <MapContainer key={`${state.center.lat}-${state.center.lng}`} center={[state.center.lat, state.center.lng]} zoom={state.center.zoom} className="leaflet-host" scrollWheelZoom>
              <TileLayer attribution="&copy; OSM" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickCapture enabled={drawing} onClick={p => persist({ ...state, draftPoints: [...state.draftPoints, p] })} />
              {allPoints.length >= 2 && <FitBounds points={allPoints} />}
              {state.routes.map(r => (
                <Polyline key={r.id} positions={r.points.map(p => [p.lat, p.lng] as [number, number])}
                  pathOptions={{ color: r.color || "#2563eb", weight: r.id === selectedId ? 5 : 3 }}
                  eventHandlers={{ click: () => setSelectedId(r.id) }} />
              ))}
              {state.draftPoints.length > 0 && <Polyline positions={state.draftPoints.map(p => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#f59e0b", dashArray: "6 6" }} />}
              {state.draftPoints.map((p, i) => <Marker key={i} position={[p.lat, p.lng]} />)}
            </MapContainer>
          </div>
          {message && <p className="footnote" role="status">{message}</p>}
        </section>
        <aside className="panel map-sidebar">
          <div className="panel-heading"><div><h2>Трассы</h2></div><span className="step">{state.routes.length}</span></div>
          {!state.routes.length && <div className="empty">Нарисуйте трассы, затем автопривязка.</div>}
          {state.routes.map(r => (
            <article key={r.id} className={"map-route-card" + (r.id === selectedId ? " active" : "")} onClick={() => setSelectedId(r.id)}>
              <div className="map-route-title">
                <i style={{ background: r.color || "#2563eb" }} /><strong>{r.name}</strong>
                <button className="icon-btn" onClick={e => { e.stopPropagation(); persist({ ...state, routes: state.routes.filter(x => x.id !== r.id) }); }}><Trash2 size={14} /></button>
              </div>
              <div className="map-route-metrics">
                <span>{r.measuredKm.toFixed(3)} км</span>
                <span>→ {r.effectiveKm.toFixed(3)} км</span>
                <span>{(r.effectiveKm * r.attenuationDbPerKm).toFixed(2)} dB</span>
              </div>
              <label>Узел
                <select value={r.nodeId ?? ""} onChange={e => persist({ ...state, routes: state.routes.map(x => x.id === r.id ? recalcRoute({ ...x, nodeId: e.target.value || undefined }) : x) })} onClick={e => e.stopPropagation()}>
                  <option value="">—</option>
                  {fiberNodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </label>
              <button className="btn" onClick={e => { e.stopPropagation(); if (r.nodeId) applyLengthToNode(r.nodeId, r.effectiveKm, r.attenuationDbPerKm); }}>
                <Link2 size={14} /> В каскад
              </button>
            </article>
          ))}
          <p className="footnote">Автопривязка: free fiber по глубине → новые fiber под OLT → сумма длин.</p>
        </aside>
      </div>
    </div>
  );
}
