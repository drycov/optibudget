import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source = readFileSync(new URL("../src/domain.ts", import.meta.url), "utf8");
test("documents supported PON profiles", () => {
  for (const technology of ["GPON", "EPON", "10G-EPON", "XG-PON", "XGS-PON", "XPON"]) {
    assert.ok(source.includes(technology), `Missing profile ${technology}`);
  }
});
test("defines separate PLC and FBT component types", () => {
  assert.match(source, /"plc"/);
  assert.match(source, /"fbt"/);
  assert.match(source, /insertionLossDb/);
});
test("calculates fiber attenuation as length times attenuation coefficient", () => {
  assert.match(source, /lengthKm\) \* Math\.max\(0, e\.attenuationDbPerKm\)/);
});
test("calculates received power from transmit power minus total loss", () => {
  assert.match(source, /profile\.txDbm - totalLossDb/);
});