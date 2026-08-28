import type { CountryFeature } from "./types";

function flattenCoordinates(coordinates: unknown): [number, number][] {
  if (!Array.isArray(coordinates)) {
    return [];
  }

  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    return [[coordinates[0], coordinates[1]]];
  }

  return coordinates.flatMap((coordinate) => flattenCoordinates(coordinate));
}

export function getBoundingBox(
  country: CountryFeature,
): [number, number, number, number] {
  const coordinates = flattenCoordinates(country.geometry.coordinates);

  if (coordinates.length === 0) {
    throw new Error(`Country ${country.properties.name} has no coordinates`);
  }

  const longitudes = coordinates.map(([longitude]) => longitude);
  const latitudes = coordinates.map(([, latitude]) => latitude);

  return [
    Math.min(...longitudes),
    Math.min(...latitudes),
    Math.max(...longitudes),
    Math.max(...latitudes),
  ];
}
