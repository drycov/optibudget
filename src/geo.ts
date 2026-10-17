/** Geospatial helpers for real fiber route length on the map. */

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371.0088;

/** Haversine distance between two WGS84 points, km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Total length of a polyline in km. */
export function pathLengthKm(points: LatLng[]): number {
  if (points.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversineKm(points[i - 1], points[i]);
  }
  return sum;
}

/**
 * Slack / routing factor: real fiber is rarely a straight line.
 * Typical aerial/duct routing uses 1.02–1.15 depending on micro-bends and spare loops.
 */
export function applySlackFactor(lengthKm: number, slackPercent = 5): number {
  return Math.max(0, lengthKm) * (1 + Math.max(0, slackPercent) / 100);
}

export type MapRoute = {
  id: string;
  name: string;
  /** Topology node id this route measures (usually a fiber segment). */
  nodeId?: string;
  points: LatLng[];
  measuredKm: number;
  slackPercent: number;
  effectiveKm: number;
  attenuationDbPerKm: number;
  color?: string;
};

export function recalcRoute(route: Omit<MapRoute, "measuredKm" | "effectiveKm"> & Partial<Pick<MapRoute, "measuredKm" | "effectiveKm">>): MapRoute {
  const measuredKm = pathLengthKm(route.points);
  const effectiveKm = applySlackFactor(measuredKm, route.slackPercent ?? 5);
  return {
    id: route.id,
    name: route.name,
    nodeId: route.nodeId,
    points: route.points,
    measuredKm,
    slackPercent: route.slackPercent ?? 5,
    effectiveKm,
    attenuationDbPerKm: route.attenuationDbPerKm ?? 0.35,
    color: route.color
  };
}

export function createId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `geo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Default map centre: Ust-Kamenogorsk (East Kazakhstan). */
export const DEFAULT_MAP_CENTER = { lat: 49.948, lng: 82.628, zoom: 13 };
