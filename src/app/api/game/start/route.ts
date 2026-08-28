import { getAllCountries, randomPointInCountry } from "@/lib/locations";
import { getNearbyStreetViewPanorama } from "@/lib/street-view";
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
    return errorResponse(
      "countries must be an array of country names",
      400,
    );
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

  console.log("Selected country: ", country.properties.name);

  let panorama = null;
  let generatedLocation = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (!panorama && attempts < maxAttempts) {
    attempts++;
    generatedLocation = randomPointInCountry(country);
    console.log(`Generated location (Attempt ${attempts}): `, generatedLocation);

    try {
      panorama = await getNearbyStreetViewPanorama(generatedLocation, country);
      if (panorama) {
        console.log("Street View panorama found: ", panorama);
      }
    } catch (error) {
      console.error(`Attempt ${attempts}: Could not start game with Street View`, error);
    }
  }

  if (!panorama) {
    return errorResponse(
      "No Street View panorama was found inside the selected country after several attempts. Please try again.",
      404,
    );
  }

  return Response.json({
    country: {
      name: country.properties.name,
      iso3: country.properties.iso3,
      continent: country.properties.continent,
    },
    generatedLocation,
    panorama,
  });
}
