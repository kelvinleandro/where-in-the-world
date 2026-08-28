import type { Feature, MultiPolygon, Polygon } from "geojson";

export type CountryProperties = {
  name: string;
  iso2: string;
  iso3: string;
  continent: string;
};

export type CountryFeature = Feature<Polygon | MultiPolygon, CountryProperties>;

export type Coordinates = {
  lat: number;
  lng: number;
};
