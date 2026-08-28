import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import type { Feature, MultiPolygon, Point, Polygon } from "geojson";
import type { GoogleMaps, GoogleStreetViewService } from "./google-maps";
import type { Coordinates } from "../locations/types";

export type CountryBoundary = Feature<Polygon | MultiPolygon, { name: string }>;

export type PanoramaSelection = {
  panoId: string;
  location: Coordinates;
};

export const SEARCH_RADIUS_METERS = 50_000;

function createPoint(location: Coordinates): Feature<Point> {
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Point",
      coordinates: [location.lng, location.lat],
    },
  };
}

export function isInsideSelectedCountry(
  location: Coordinates,
  countries: CountryBoundary[],
): boolean {
  const point = createPoint(location);
  return countries.some((country) => booleanPointInPolygon(point, country));
}

export function findOfficialPanorama(
  service: GoogleStreetViewService,
  location: Coordinates,
  maps: GoogleMaps,
): Promise<PanoramaSelection | null> {
  return new Promise((resolve) => {
    service.getPanorama(
      {
        location,
        radius: SEARCH_RADIUS_METERS,
        sources: [maps.StreetViewSource.GOOGLE],
        preference: maps.StreetViewPreference.BEST,
      },
      (data, status) => {
        if (status !== "OK" || !data?.location?.pano || !data.location.latLng) {
          resolve(null);
          return;
        }

        resolve({
          panoId: data.location.pano,
          location: {
            lat: data.location.latLng.lat(),
            lng: data.location.latLng.lng(),
          },
        });
      },
    );
  });
}
