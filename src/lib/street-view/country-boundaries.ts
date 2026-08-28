import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { CountryBoundary } from "./panorama-service";

export type CountryBoundaryCollection = FeatureCollection<
  Polygon | MultiPolygon,
  { name: string }
>;

export async function loadCountryBoundaries(): Promise<CountryBoundary[]> {
  const response = await fetch("/countries.geojson", {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error("Country boundaries could not be loaded");
  }

  const collection = (await response.json()) as CountryBoundaryCollection;
  return collection.features;
}
