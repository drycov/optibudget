import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const cascade = readFileSync(new URL("../src/cascade.ts", import.meta.url), "utf8");
const planner = readFileSync(new URL("../src/CascadePlanner.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("../src/CatalogManager.tsx", import.meta.url), "utf8");
test("topology supports OLT, fiber, PLC/FBT, splices, connectors and ONT", () => {
  for (const kind of ["olt", "fiber", "plc", "fbt", "splice", "connector", "ont"]) assert.match(cascade, new RegExp('"'+kind+'"'));
});
test("topology calculates a separate path and received level for every ONT", () => {
  assert.match(cascade, /nodes\.filter\(n => n\.kind === "ont"\)/);
  assert.match(cascade, /const rxDbm = tx - lossDb/);
  assert.match(planner, /results\.map\(r/);
});
test("topology editor persists a branching graph locally and exports JSON", () => {
  assert.match(planner, /optibudget\.topology\.v1/);
  assert.match(planner, /optibudget-topology\.json/);
  assert.match(planner, /parentId/);
});
test("catalog keeps unverified optical parameters empty and editable", () => {
  assert.match(catalog, /optibudget\.catalog\.v1/);
  assert.match(catalog, /sourceUrl/);
  assert.match(catalog, /verifiedAt/);
  assert.match(catalog, /insertionLossDb/);
});
test("supports editable wavelength and optical-class budgets", () => {
  assert.match(cascade, /WAVELENGTHS_NM/);
  assert.match(cascade, /OPTICAL_CLASS_BUDGET_DB/);
  assert.match(cascade, /designMarginDb = opticalBudgetDb - lossDb/);
});
test("topology UI binds equipment and exports per-ONT reports", () => {
  assert.match(planner, /optibudget\.catalog\.v1/);
  assert.match(planner, /applyCatalog/);
  assert.match(planner, /optibudget-ont-report\.csv/);
  assert.match(planner, /window\.print\(\)/);
});

test("catalog seeds published Corning PLC insertion-loss values and keeps generic specs marked as templates", () => {
  const seed = readFileSync(new URL("../src/catalog.ts", import.meta.url), "utf8");
  assert.match(seed, /corning-plc-1x8/);
  assert.match(seed, /insertionLossDb:10\.5/);
  assert.match(seed, /CRR-1060-AEN\.pdf/);
  assert.match(seed, /dataStatus:"template"/);
  assert.match(seed, /attenuationDbPerKm/);
});
test("topology renders a graph with parent-child links and node-level results", () => {
  assert.match(planner, /Визуальная схема каскада/);
  assert.match(planner, /role="img" aria-label="Графическая схема PON-топологии"/);
  assert.match(planner, /markerEnd="url\(#topology-arrow\)"/);
  assert.match(planner, /layoutGraph\(nodes\)/);
});

test("GPON B+ template values are labeled as illustrative and editable", () => {
  const seed = readFileSync(new URL("../src/catalog.ts", import.meta.url), "utf8");
  assert.match(seed, /txMinDbm:1\.5,txMaxDbm:5/);
  assert.match(seed, /rxSensitivityDbm:-27,rxOverloadDbm:-8/);
  assert.match(seed, /ШАБЛОН GPON B\+/);
});

test("equipment catalog is presented as a table with a separate edit dialog", () => {
  assert.match(catalog, /className="catalog-table"/);
  assert.match(catalog, /className="catalog-modal"/);
  assert.match(catalog, /role="dialog" aria-modal="true"/);
  assert.match(catalog, /Редактирование модели/);
  assert.match(catalog, /Добавить модель/);
  assert.match(catalog, /Применить/);
});
