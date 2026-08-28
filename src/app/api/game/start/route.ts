import { getAllCountries, randomPointInCountry } from "@/lib/locations";
import type { CountryFeature } from "@/lib/locations";

export const runtime = "nodejs";

type StartGameRequest = {
  countries?: unknown;
};

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function selectRandomCountry(countryNames: string[]): CountryFeature {
  const countries = getAllCountries();
  const countriesByName = new Map(
    countries.map((country) => [country.properties.name, country]),
  );
  const selectedCountries = countryNames.map((name) =>
    countriesByName.get(name),
  );

  if (selectedCountries.some((country) => !country)) {
    throw new Error("One or more country names are invalid.");
  }

  return selectedCountries[
    Math.floor(Math.random() * selectedCountries.length)
  ] as CountryFeature;
}

export async function POST(request: Request) {
  let body: StartGameRequest;

  try {
    body = (await request.json()) as StartGameRequest;
  } catch {
    return errorResponse("Request body must be valid JSON", 400);
  }

  if (
    body.countries !== undefined &&
    (!Array.isArray(body.countries) ||
      body.countries.some((country) => typeof country !== "string"))
  ) {
    return errorResponse("countries must be an array of country names", 400);
  }

  let countryNames = Array.isArray(body.countries)
    ? Array.from(new Set(body.countries.map((country) => country.trim())))
    : [];

  if (countryNames.length === 0) {
    countryNames = getAllCountries().map((country) => country.properties.name);
  }

  if (countryNames.some((country) => country.length === 0)) {
    return errorResponse("countries must contain non-empty country names", 400);
  }

  let country: CountryFeature;

  try {
    country = selectRandomCountry(countryNames);
  } catch {
    return errorResponse("One or more country names are invalid", 400);
  }

  return Response.json({
    country: {
      name: country.properties.name,
      iso2: country.properties.iso2,
      iso3: country.properties.iso3,
      continent: country.properties.continent,
    },
    generatedLocation: randomPointInCountry(country),
  });
}
