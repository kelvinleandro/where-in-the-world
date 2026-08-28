import fs from "node:fs";
import path from "node:path";
import type { CountryFeature } from "./types";

const EXCLUDED_CONTINENTS = new Set(["Antarctica", "Seven seas (open ocean)"]);

function loadCountries(): CountryFeature[] {
  const filePath = path.join(process.cwd(), "public", "countries.geojson");
  const file = fs.readFileSync(filePath, "utf-8");

  return JSON.parse(file).features as CountryFeature[];
}

const COUNTRIES = loadCountries();

export function getAllCountries(): CountryFeature[] {
  return COUNTRIES.filter(
    (country) => !EXCLUDED_CONTINENTS.has(country.properties.continent),
  ).sort((a, b) => a.properties.name.localeCompare(b.properties.name));
}

export function getContinents(): string[] {
  return Array.from(
    new Set(
      COUNTRIES.filter(
        (country) => !EXCLUDED_CONTINENTS.has(country.properties.continent),
      ).map((country) => country.properties.continent),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function getCountriesInContinent(continent: string): CountryFeature[] {
  return COUNTRIES.filter(
    (country) => country.properties.continent === continent,
  );
}
