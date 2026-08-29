"use client";

import { distance as turfDistance } from "@turf/distance";
import { LoaderCircle, Map, MapPin, Rotate3D } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Coordinates } from "@/lib/locations";
import {
  findOfficialPanorama,
  isInsideSelectedCountry,
  loadCountryBoundaries,
  loadGoogleMapsScript,
  type CountryBoundary,
  type GoogleMap,
  type GoogleMapClickEvent,
  type GoogleMaps,
} from "@/lib/street-view";

const MAX_ATTEMPTS = 5;
const GLOBAL_MAP_CENTER = { lat: 20, lng: 0 };

type StartGameResponse = { generatedLocation: Coordinates };

type GameViewProps = {
  streetViewElement: React.RefObject<HTMLDivElement | null>;
  mapElement: React.RefObject<HTMLDivElement | null>;
  loading: boolean;
  attempt: number;
};

async function requestGeneratedLocation(countryNames: string[]) {
  const response = await fetch("/api/game/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ countries: countryNames }),
  });

  if (!response.ok) {
    const result = (await response.json()) as { error?: string };
    throw new Error(result.error ?? "Could not generate a location");
  }

  return (await response.json()) as StartGameResponse;
}

function createStreetView(
  maps: GoogleMaps,
  element: HTMLDivElement,
  panoId: string,
  onLocationChange: (location: Coordinates) => void,
) {
  const streetView = new maps.StreetViewPanorama(element, {
    pano: panoId,
    pov: { heading: 0, pitch: 0 },
    zoom: 1,
    addressControl: false,
    fullscreenControl: true,
    motionTracking: false,
    showRoadLabels: false,
    linksControl: true,
    panControl: true,
  });
  const updateLocation = () => {
    const position = streetView.getPosition();
    if (position) {
      onLocationChange({ lat: position.lat(), lng: position.lng() });
      console.log(`Coord: ${position.lat()} ${position.lng()}`);
    }
  };

  streetView.addListener("position_changed", updateLocation);
  updateLocation();
}

function createGlobalMap(
  maps: GoogleMaps,
  element: HTMLDivElement,
  onGuess: (guess: Coordinates) => boolean,
): GoogleMap {
  const map = new maps.Map(element, {
    center: GLOBAL_MAP_CENTER,
    zoom: 2,
    minZoom: 1,
    mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID",
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeControl: false,
    restriction: {
      latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
      strictBounds: true,
    },
  });
  let guessMarker: InstanceType<
    GoogleMaps["marker"]["AdvancedMarkerElement"]
  > | null = null;
  map.addListener("click", (event: GoogleMapClickEvent) => {
    if (event.latLng) {
      const location = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      if (!onGuess(location)) return;
      if (guessMarker) guessMarker.map = null;
      guessMarker = new maps.marker.AdvancedMarkerElement({
        map,
        position: location,
        title: "Your guess",
      });
    }
  });
  return map;
}

export function GameScreen() {
  const streetViewElement = useRef<HTMLDivElement>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<GoogleMap | null>(null);
  const mapsInstance = useRef<GoogleMaps | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [guess, setGuess] = useState<Coordinates | null>(null);
  const [streetViewLocation, setStreetViewLocation] =
    useState<Coordinates | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const [roundKey, setRoundKey] = useState(0);

  useEffect(() => {
    let isActive = true;

    async function startGame() {
      try {
        const countryNames = JSON.parse(
          sessionStorage.getItem("geo-game-countries") || "[]",
        ) as string[];
        const [maps, boundaries] = await Promise.all([
          loadGoogleMapsScript(),
          loadCountryBoundaries(),
        ]);
        const selectedCountries = getSelectedCountries(
          countryNames,
          boundaries,
        );
        if (selectedCountries.length === 0)
          throw new Error("No valid countries were selected");

        const service = new maps.StreetViewService();
        let panorama = null;
        for (
          let currentAttempt = 1;
          currentAttempt <= MAX_ATTEMPTS && !panorama;
          currentAttempt++
        ) {
          if (isActive) setAttempt(currentAttempt);
          const { generatedLocation } =
            await requestGeneratedLocation(countryNames);
          const candidate = await findOfficialPanorama(
            service,
            generatedLocation,
            maps,
          );
          if (
            candidate &&
            isInsideSelectedCountry(candidate.location, selectedCountries)
          )
            panorama = candidate;
        }

        if (!panorama)
          throw new Error(
            "No official Street View was found after five attempts",
          );
        if (!isActive || !streetViewElement.current || !mapElement.current)
          return;
        createStreetView(
          maps,
          streetViewElement.current,
          panorama.panoId,
          setStreetViewLocation,
        );
        mapsInstance.current = maps;
        mapInstance.current = createGlobalMap(
          maps,
          mapElement.current,
          (location) => {
            if (submittedRef.current) return false;
            setGuess(location);
            return true;
          },
        );
        setLoading(false);
      } catch (startError) {
        if (isActive) {
          setLoading(false);
          setError(
            startError instanceof Error
              ? startError.message
              : "Could not load the game",
          );
        }
      }
    }

    void startGame();
    return () => {
      isActive = false;
    };
  }, [roundKey]);

  useEffect(() => {
    if (
      !submitted ||
      !guess ||
      !streetViewLocation ||
      !mapInstance.current ||
      !mapsInstance.current
    )
      return;

    const maps = mapsInstance.current;
    const map = mapInstance.current;
    new maps.marker.AdvancedMarkerElement({
      map,
      position: streetViewLocation,
      title: "Correct location",
    });
    new maps.Polyline({
      map,
      path: [guess, streetViewLocation],
      geodesic: true,
      strokeColor: "#e56b42",
      strokeOpacity: 0.9,
      strokeWeight: 3,
    });
  }, [submitted, guess, streetViewLocation]);

  return (
    <GameView
      streetViewElement={streetViewElement}
      mapElement={mapElement}
      loading={loading}
      attempt={attempt}
      error={error}
      guess={guess}
      streetViewLocation={streetViewLocation}
      submitted={submitted}
      onGuess={() => {
        setSubmitted(true);
        submittedRef.current = true;
      }}
      onNewRound={() => {
        setGuess(null);
        setStreetViewLocation(null);
        setSubmitted(false);
        submittedRef.current = false;
        setLoading(true);
        setError(null);
        setRoundKey((key) => key + 1);
      }}
    />
  );
}

function getSelectedCountries(
  countryNames: string[],
  boundaries: CountryBoundary[],
) {
  return countryNames.length > 0
    ? boundaries.filter((country) =>
        countryNames.includes(country.properties.name),
      )
    : boundaries;
}

function GameView({
  streetViewElement,
  mapElement,
  loading,
  attempt,
  error,
  guess,
  streetViewLocation,
  submitted,
  onGuess,
  onNewRound,
}: GameViewProps & {
  error: string | null;
  guess: Coordinates | null;
  streetViewLocation: Coordinates | null;
  submitted: boolean;
  onGuess: () => void;
  onNewRound: () => void;
}) {
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#10251f] px-6 text-center text-[#f5f1e8]">
        <div className="max-w-md">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#e56b42]">
            Game unavailable
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            We could not load this round.
          </h1>
          <p className="mt-4 text-[#b7c2b3]">{error}</p>
          <Button
            className="mt-7 rounded-full bg-[#c9db59] text-[#10251f] hover:bg-[#d8e875]"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
      </main>
    );
  }

  const distance =
    guess && streetViewLocation
      ? turfDistance(
          [guess.lng, guess.lat],
          [streetViewLocation.lng, streetViewLocation.lat],
          { units: "kilometers" },
        )
      : null;

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#10251f] text-[#f5f1e8]">
      <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 border-b border-[#395448] bg-[#10251f] px-5 sm:px-8">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#c9db59] text-[#10251f]">
          <MapPin className="size-4 fill-current" />
        </span>
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.22em]">
          Where in the world?
        </span>
      </header>

      <section className="relative min-h-0 flex-1">
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${submitted ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
          <div
            ref={streetViewElement}
            className="absolute inset-0 bg-[#162d26]"
          />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#10251f]/85 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7e4d2] backdrop-blur-sm">
            <Rotate3D className="size-3.5 text-[#c9db59]" /> Street View
          </div>
        </div>

        <div
          className={`absolute z-10 overflow-hidden shadow-2xl transition-[width,height] duration-500 ease-out ${submitted ? "inset-0 h-full w-full rounded-none border-0" : "bottom-5 left-5 h-[38vh] w-[30vw] min-w-64 max-w-[50vw] rounded-xl border border-[#395448] hover:w-[50vw] hover:h-[50vh]"}`}
        >
          <div ref={mapElement} className="absolute inset-0 bg-[#d8ded5]" />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#f5f1e8]/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#23352d] shadow-sm">
            <Map className="size-3.5 text-[#e56b42]" /> World map
          </div>
          {submitted && distance !== null && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-[#10251f]/95 px-6 py-4 text-center shadow-xl backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#9caf9f]">
                Distance
              </p>
              <p className="mt-1 text-3xl font-semibold text-[#c9db59]">
                {distance.toFixed(3)} km
              </p>
            </div>
          )}
        </div>
      </section>
      {!submitted && (
        <Button
          disabled={!guess}
          onClick={onGuess}
          className="absolute bottom-6 right-6 z-10 rounded-full bg-[#e56b42] px-6 text-[#201b18] hover:bg-[#f07c52]"
        >
          Guess
        </Button>
      )}
      {submitted && (
        <Button
          onClick={onNewRound}
          className="absolute bottom-6 right-6 z-10 rounded-full bg-[#c9db59] px-6 text-[#10251f] hover:bg-[#d8e875]"
        >
          Play another round
        </Button>
      )}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#10251f]/95">
          <div className="flex flex-col items-center gap-4 text-center">
            <LoaderCircle className="size-8 animate-spin text-[#c9db59]" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#b7c2b3]">
              Finding your view
            </p>
            <p className="max-w-xs text-sm text-[#718174]">
              Searching official Street View. Attempt {attempt} of{" "}
              {MAX_ATTEMPTS}.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
