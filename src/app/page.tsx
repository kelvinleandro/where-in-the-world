import { HomeScreen } from "@/components/home-screen";
import { getAllCountries, getContinents } from "@/lib/locations";

export default function Home() {
  return (
    <HomeScreen continents={getContinents()} countries={getAllCountries()} />
  );
}
