import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import type { Feature, Point } from "geojson";
import type { Coordinates, CountryFeature } from "../locations/types";
import type { StreetViewPanorama, StreetViewResult } from "./types";

const STREET_VIEW_METADATA_URL =
  "https://maps.googleapis.com/maps/api/streetview/metadata";
const SEARCH_RADIUS_METERS = 100_000;

type MetadataResponse = {
  status: "OK" | "ZERO_RESULTS" | string;
  pano_id?: string;
  location?: {
    lat: number;
    lng: number;
  };
  date?: string;
  copyright?: string;
};

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

function isInsideCountry(
  location: Coordinates,
  country: CountryFeature,
): boolean {
  return booleanPointInPolygon(createPoint(location), country);
}

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured");
  }

  return apiKey;
}

export async function getNearbyStreetViewPanorama(
  location: Coordinates,
  country: CountryFeature,
): Promise<StreetViewResult> {
  const params = new URLSearchParams({
    location: `${location.lat},${location.lng}`,
    radius: String(SEARCH_RADIUS_METERS),
    source: "outdoor",
    key: getApiKey(),
  });
  const response = await fetch(`${STREET_VIEW_METADATA_URL}?${params}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Street View request failed with HTTP ${response.status}`);
  }

  const metadata = (await response.json()) as MetadataResponse;

  console.log("Inside getNearbyStreetViewPanorama");
  console.log("Status: ", metadata.status);
  console.log("Pano ID: ", metadata.pano_id);
  console.log("Location: ", metadata.location);
  console.log("Copyright: ", metadata.copyright);

  if (metadata.status === "ZERO_RESULTS") {
    return null;
  }

  if (metadata.status !== "OK") {
    throw new Error(`Street View metadata request failed: ${metadata.status}`);
  }

  if (!metadata.pano_id || !metadata.location) {
    throw new Error("Street View returned incomplete panorama metadata");
  }

  const panoramaLocation = {
    lat: metadata.location.lat,
    lng: metadata.location.lng,
  } satisfies Coordinates;

  console.log("Inside isInsideCountry: ", isInsideCountry(panoramaLocation, country));

  if (!isInsideCountry(panoramaLocation, country)) {
    return null;
  }

  return {
    panoId: metadata.pano_id,
    location: panoramaLocation,
    date: metadata.date,
  } satisfies StreetViewPanorama;
}
