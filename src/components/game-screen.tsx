"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Map, Rotate3D } from "lucide-react";
import { Button } from "@/components/ui/button";


type Coordinates = {
  lat: number;
  lng: number;
};

type Panorama = {
  panoId: string;
  location: Coordinates;
  date?: string;
};

type StartGameResponse = {
  panorama: Panorama;
  country: {
    name: string;
    continent: string;
  };
};

type GoogleMap = {
  setCenter: (center: Coordinates) => void;
  setZoom: (zoom: number) => void;
};

type StreetViewPanorama = {
  setPano: (panoId: string) => void;
  setPov: (pov: { heading: number; pitch: number }) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMaps = {
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => GoogleMap;
  StreetViewPanorama: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => StreetViewPanorama;
};

declare global {
  interface Window {
    google?: { maps?: GoogleMaps };
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const GLOBAL_MAP_CENTER = { lat: 20, lng: 0 };

function loadGoogleMapsScript(): Promise<GoogleMaps> {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured"),
    );
  }

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps) resolve(window.google.maps);
        else reject(new Error("Google Maps failed to initialize"));
      });
      existingScript.addEventListener("error", () =>
        reject(new Error("Google Maps script failed to load")),
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps failed to initialize"));
    };
    script.onerror = () =>
      reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(script);
  });
}

export function GameScreen() {
  const streetViewElement = useRef<HTMLDivElement>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("Loading your location");
  const [error, setError] = useState<string | null>(null);
  const [game, setGame] = useState<StartGameResponse | null>(null);

  useEffect(() => {
    let isActive = true;

    async function startGame() {
      try {
        const [maps, response] = await Promise.all([
          loadGoogleMapsScript(),
          fetch("/api/game/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              countries: JSON.parse(
                sessionStorage.getItem("geo-game-countries") || "[]",
              ),
            }),
          }),
        ]);

        if (!response.ok) {
          const result = (await response.json()) as { error?: string };
          throw new Error(result.error ?? "Could not start the game");
        }

        const result = (await response.json()) as StartGameResponse;
        if (!isActive || !streetViewElement.current || !mapElement.current)
          return;

        new maps.StreetViewPanorama(streetViewElement.current, {
          pano: result.panorama.panoId,
          pov: { heading: 0, pitch: 0 },
          zoom: 1,
          addressControl: false,
          fullscreenControl: true,
          motionTracking: false,
          showRoadLabels: false,
          linksControl: true,
          panControl: true,
        });

        new maps.Map(mapElement.current, {
          center: GLOBAL_MAP_CENTER,
          zoom: 2,
          minZoom: 2,
          streetViewControl: false,
          fullscreenControl: true,
          mapTypeControl: false,
          zoomControl: true,
          restriction: {
            latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
            strictBounds: true,
          },
        });

        setGame(result);
        setStatus("");
      } catch (startError) {
        if (isActive) {
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
  }, []);

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

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#10251f] text-[#f5f1e8]">
      <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-[#395448] bg-[#10251f] px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#c9db59] text-[#10251f]">
            <span className="size-2.5 rounded-full bg-[#10251f]" />
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.22em]">
            Open Geo
          </span>
        </div>
      </header>

      <section className="relative flex min-h-0 flex-1 flex-col md:flex-row">
        <div className="relative min-h-[52vh] flex-1 border-b border-[#395448] md:min-h-0 md:border-b-0 md:border-r">
          <div
            ref={streetViewElement}
            className="absolute inset-0 bg-[#162d26]"
          />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#10251f]/85 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#d7e4d2] backdrop-blur-sm">
            <Rotate3D className="size-3.5 text-[#c9db59]" /> Street View
          </div>
        </div>
        <div className="relative min-h-[42vh] flex-1 md:min-h-0">
          <div ref={mapElement} className="absolute inset-0 bg-[#d8ded5]" />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-[#f5f1e8]/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#23352d] shadow-sm">
            <Map className="size-3.5 text-[#e56b42]" /> World map
          </div>
        </div>
      </section>

      {status && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#10251f]/95">
          <div className="flex flex-col items-center gap-4 text-center">
            <LoaderCircle className="size-8 animate-spin text-[#c9db59]" />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#b7c2b3]">
              {status}
            </p>
            <p className="max-w-xs text-sm text-[#718174]">
              Finding a Street View panorama and preparing the world map...
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
