import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const geo = readFileSync(new URL("../src/geo.ts", import.meta.url), "utf8");
const mapUi = readFileSync(new URL("../src/MapPlanner.tsx", import.meta.url), "utf8");
const supabase = readFileSync(new URL("../src/supabase.ts", import.meta.url), "utf8");
const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");

test("geo module exports haversine and slack helpers", () => {
  assert.match(geo, /function haversineKm/);
  assert.match(geo, /function pathLengthKm/);
  assert.match(geo, /function applySlackFactor/);
  assert.match(geo, /DEFAULT_MAP_CENTER/);
});

test("map planner draws routes and binds length to cascade fiber nodes", () => {
  assert.match(mapUi, /MapContainer/);
  assert.match(mapUi, /optibudget\.map\.v1/);
  assert.match(mapUi, /applyLengthToNode/);
  assert.match(mapUi, /optibudget\.topology\.v1/);
  assert.match(mapUi, /GeoJSON/);
});

test("map auto-binds multiple routes to cascade fibers", () => {
  assert.match(mapUi, /autoBindRoutesToCascade/);
  assert.match(mapUi, /Автопривязка всех/);
  assert.match(mapUi, /makeTopologyNode\("fiber"/);
});

test("supabase client and project CRUD are present", () => {
  assert.match(supabase, /@supabase\/supabase-js/);
  assert.match(supabase, /saveProject/);
  assert.match(supabase, /listProjects/);
  assert.match(supabase, /VITE_SUPABASE_URL/);
});

test("SQL schema has RLS on projects and catalog", () => {
  assert.match(schema, /create table if not exists public\.projects/);
  assert.match(schema, /enable row level security/);
  assert.match(schema, /map_routes/);
  assert.match(schema, /topology_nodes/);
});

function haversineKm(a, b) {
  const R = 6371.0088;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

test("haversine: ~1 km near equator sanity", () => {
  const d = haversineKm({ lat: 0, lng: 0 }, { lat: 0.008983, lng: 0 });
  assert.ok(d > 0.95 && d < 1.05, `expected ~1km, got ${d}`);
});

test("haversine: Ust-Kamenogorsk short segment", () => {
  const a = { lat: 49.948, lng: 82.628 };
  const b = { lat: 49.955, lng: 82.640 };
  const d = haversineKm(a, b);
  assert.ok(d > 0.8 && d < 2.5, `segment length unexpected: ${d}`);
});
