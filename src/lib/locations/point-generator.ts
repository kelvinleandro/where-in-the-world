import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { randomPoint } from "@turf/random";
import { getBoundingBox } from "./geometry";
import type { Coordinates, CountryFeature } from "./types";

const MAX_RANDOM_POINT_ATTEMPTS = 1000;

export function randomPointInCountry(country: CountryFeature): Coordinates {
  const [minLongitude, minLatitude, maxLongitude, maxLatitude] =
    getBoundingBox(country);

  for (let attempt = 0; attempt < MAX_RANDOM_POINT_ATTEMPTS; attempt++) {
    const random = randomPoint(1, {
      bbox: [minLongitude, minLatitude, maxLongitude, maxLatitude],
    });
    const candidate = random.features[0];

    if (booleanPointInPolygon(candidate, country)) {
      return {
        lat: candidate.geometry.coordinates[1],
        lng: candidate.geometry.coordinates[0],
      };
    }
  }

  throw new Error(`Could not generate point inside ${country.properties.name}`);
}
