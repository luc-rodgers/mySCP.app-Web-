// Great-circle ("as the crow flies") distance between two lat/lng points
// using the Haversine formula. Returns km. Returns null if either coord is missing.
//
// Used by the transfer-kms allowance: pick from-project + to-project, multiply by the
// per-km rate. No external API call — all the math is local on stored lat/lng.

export type LatLng = {
  lat: number | null | undefined;
  lng: number | null | undefined;
};

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function distanceKm(a: LatLng, b: LatLng): number | null {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return null;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(h)));
  return EARTH_RADIUS_KM * c;
}
