"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Settings, Play, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { GameSettings } from "@/lib/game";
import type { CountryFeature } from "@/lib/locations";

type HomeScreenProps = {
  continents: string[];
  countries: CountryFeature[];
};

export function HomeScreen({ continents, countries }: HomeScreenProps) {
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    continents: [],
    countries: [],
  });

  const selectedCountries = new Set(settings.countries);

  function startGame() {
    sessionStorage.setItem("geo-game-countries", JSON.stringify(settings.countries));
    router.push(`/game`);
  }

  function toggleContinent(continent: string) {
    const continentCountries = countries
      .filter((country) => country.properties.continent === continent)
      .map((country) => country.properties.name);
    const isSelected = settings.continents.includes(continent);

    setSettings((current) => ({
      continents: isSelected
        ? current.continents.filter((item) => item !== continent)
        : [...current.continents, continent],
      countries: isSelected
        ? current.countries.filter(
            (country) => !continentCountries.includes(country),
          )
        : Array.from(new Set([...current.countries, ...continentCountries])),
    }));
  }

  function toggleCountry(countryName: string) {
    setSettings((current) => ({
      ...current,
      countries: current.countries.includes(countryName)
        ? current.countries.filter((country) => country !== countryName)
        : [...current.countries, countryName],
    }));
  }

  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-[#10251f] text-[#f5f1e8]">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,241,232,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,232,0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="pointer-events-none absolute -right-32 -top-40 size-130 rounded-full border border-[#c9db59]/20" />
      <div className="pointer-events-none absolute -bottom-56 -left-32 size-155 rounded-full border border-[#e56b42]/20" />

      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-[#c9db59] text-[#10251f]">
            <span className="size-3 rounded-full bg-[#10251f]" />
          </span>
          <span className="font-mono text-sm font-semibold uppercase tracking-[0.24em]">
            Open Geo
          </span>
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-[#aab9a9]">
          Explore the world
        </span>
      </header>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.32em] text-[#c9db59]">
          A location guessing game
        </p>
        <h1 className="max-w-3xl text-6xl font-semibold leading-[0.92] tracking-tighter sm:text-8xl">
          Where in the world?
        </h1>
        <p className="mt-7 max-w-md text-base leading-7 text-[#b7c2b3] sm:text-lg">
          Drop into a random corner of the planet and trust your instincts.
        </p>
        <div className="mt-12 flex items-center gap-4">
          <Button
            size="lg"
            className="h-14 rounded-full bg-[#e56b42] px-8 text-base text-[#201b18] shadow-[0_10px_30px_rgba(229,107,66,0.2)] hover:bg-[#f07c52]"
            aria-label="Play game"
            onClick={startGame}
          >
            <Play className="fill-current" />
            Play
          </Button>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-lg"
                  className="h-14 w-14 rounded-full border-[#718174] bg-transparent text-[#f5f1e8] hover:border-[#c9db59] hover:bg-[#c9db59] hover:text-[#10251f]"
                  aria-label="Open settings"
                />
              }
            >
              <Settings />
            </DialogTrigger>
            <SettingsDialog
              settings={settings}
              continents={continents}
              countries={countries}
              selectedCountries={selectedCountries}
              onClose={() => setIsSettingsOpen(false)}
              onContinentToggle={toggleContinent}
              onCountryToggle={toggleCountry}
            />
          </Dialog>
        </div>
      </section>
    </main>
  );
}

type SettingsDialogProps = HomeScreenProps & {
  settings: GameSettings;
  selectedCountries: Set<string>;
  onClose: () => void;
  onContinentToggle: (continent: string) => void;
  onCountryToggle: (countryName: string) => void;
};

function SettingsDialog({
  settings,
  continents,
  countries,
  selectedCountries,
  onClose,
  onContinentToggle,
  onCountryToggle,
}: SettingsDialogProps) {
  return (
    <DialogContent
      showCloseButton={false}
      className="flex max-h-[min(760px,calc(100vh-2rem))] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border-[#395448] bg-[#142c24] p-0 text-[#f5f1e8] shadow-2xl"
    >
      <header className="flex items-start justify-between border-b border-[#395448] px-6 py-5 sm:px-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#c9db59]">
            Game setup
          </p>
          <DialogTitle className="mt-1 text-2xl font-semibold tracking-tight">
            Choose your map
          </DialogTitle>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-[#b7c2b3] hover:bg-[#203d31] hover:text-white"
          onClick={onClose}
          aria-label="Close settings"
        >
          <X />
        </Button>
      </header>

      <div className="grid flex-1 min-h-0 divide-y divide-[#395448] md:grid-cols-2 md:divide-x md:divide-y-0">
        <SelectionSection
          title="Continents"
          hint={
            settings.continents.length === 0
              ? "All continents"
              : `${settings.continents.length} selected`
          }
        >
          <div className="grid content-start gap-1 sm:grid-cols-2 md:grid-cols-1">
            {continents.map((continent) => (
              <SelectionRow
                key={continent}
                label={continent}
                checked={settings.continents.includes(continent)}
                onChange={() => onContinentToggle(continent)}
              />
            ))}
          </div>
        </SelectionSection>
        <SelectionSection
          title="Countries"
          hint={
            settings.countries.length === 0
              ? "None selected"
              : `${settings.countries.length} selected`
          }
        >
          <div className="grid content-start gap-1 sm:grid-cols-2 md:grid-cols-1">
            {countries.map((country) => (
              <SelectionRow
                key={country.properties.name}
                label={country.properties.name}
                checked={selectedCountries.has(country.properties.name)}
                onChange={() => onCountryToggle(country.properties.name)}
              />
            ))}
          </div>
        </SelectionSection>
      </div>
      <footer className="flex items-center justify-between gap-4 border-t border-[#395448] px-6 py-4 sm:px-8">
        <span className="text-xs text-[#9caf9f]">
          {settings.countries.length === 0
            ? "No countries selected"
            : `${settings.countries.length} countries ready to play`}
        </span>
        <Button
          onClick={onClose}
          className="rounded-full bg-[#c9db59] px-5 text-[#10251f] hover:bg-[#d8e875]"
        >
          Done
        </Button>
      </footer>
    </DialogContent>
  );
}

type SelectionSectionProps = {
  title: string;
  hint: string;
  children: ReactNode;
};

function SelectionSection({ title, hint, children }: SelectionSectionProps) {
  return (
    <div className="flex min-h-0 flex-col px-6 py-5 sm:px-8">
      <div className="mb-4 flex items-end justify-between gap-3">
        <h3 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[#f5f1e8]">
          {title}
        </h3>
        <span className="text-xs text-[#9caf9f]">{hint}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto pr-2">{children}</div>
    </div>
  );
}

type SelectionRowProps = {
  label: string;
  checked: boolean;
  onChange: () => void;
};

function SelectionRow({ label, checked, onChange }: SelectionRowProps) {
  return (
    <label className="relative group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#c5d0c4] transition-colors hover:bg-[#203d31] hover:text-white">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="flex size-4 shrink-0 items-center justify-center rounded border border-[#718174] text-[#10251f] transition-colors peer-checked:border-[#c9db59] peer-checked:bg-[#c9db59]">
        {checked && <Check className="size-3" />}
      </span>
      <span>{label}</span>
    </label>
  );
}
