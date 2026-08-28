import type { Coordinates } from "../locations/types";

export type StreetViewPanorama = {
  panoId: string;
  location: Coordinates;
  date?: string;
};

export type StreetViewResult = StreetViewPanorama | null;
