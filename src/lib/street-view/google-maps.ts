import type { Coordinates } from "../locations/types";

export type GoogleLatLng = {
  lat: () => number;
  lng: () => number;
};

export type GooglePanoramaData = {
  location?: {
    pano?: string;
    latLng?: GoogleLatLng;
  };
};

export type GoogleStreetViewService = {
  getPanorama: (
    request: {
      location: Coordinates;
      radius: number;
      sources: string[];
      preference: string;
    },
    callback: (data: GooglePanoramaData | null, status: string) => void,
  ) => void;
};

export type GoogleStreetViewPanorama = {
  getPosition: () => GoogleLatLng | null;
  addListener: (eventName: "position_changed", handler: () => void) => object;
};

export type GoogleMap = {
  addListener: (
    eventName: "click",
    handler: (event: GoogleMapClickEvent) => void,
  ) => object;
};

export type GoogleMapClickEvent = {
  latLng?: GoogleLatLng;
};

export type GoogleMarker = {
  map?: GoogleMap | null;
  position?: Coordinates;
};
export type GooglePolyline = object;

export type GoogleMaps = {
  StreetViewService: new () => GoogleStreetViewService;
  StreetViewPanorama: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => GoogleStreetViewPanorama;
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => GoogleMap;
  marker: {
    AdvancedMarkerElement: new (
      options: Record<string, unknown>,
    ) => GoogleMarker;
  };
  Polyline: new (options: Record<string, unknown>) => GooglePolyline;
  StreetViewSource: { GOOGLE: string };
  StreetViewPreference: { BEST: string };
};

declare global {
  interface Window {
    google?: { maps?: GoogleMaps };
    __openGeoGoogleMapsReady?: () => void;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

export function loadGoogleMapsScript(): Promise<GoogleMaps> {
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(
      new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured"),
    );
  }

  return new Promise((resolve, reject) => {
    const onLoad = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps failed to initialize"));
    };
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);

    window.__openGeoGoogleMapsReady = onLoad;
    if (existingScript) {
      existingScript.addEventListener("error", () =>
        reject(new Error("Google Maps script failed to load")),
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&libraries=marker&callback=__openGeoGoogleMapsReady`;
    script.async = true;
    script.defer = true;
    script.onerror = () =>
      reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(script);
  });
}
