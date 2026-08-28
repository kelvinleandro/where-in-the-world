import type { Coordinates } from "../locations/types";

export type GameSettings = {
  continents: string[];
  countries: string[];
};

export type Round = {
  realLocation: Coordinates;
  guess: Coordinates;
  distance: number;
};
