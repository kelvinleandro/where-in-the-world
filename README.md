# Where in the world? 🌍

An open-source, interactive geography guessing game inspired by GeoGuessr, built with modern web technologies. Drop yourself into a random Street View location anywhere in the world (or in a specific country) and test your geographical knowledge by guessing where you are on the map!

https://github.com/user-attachments/assets/735e475f-e2e1-4731-8def-5decf149e989

## 🚀 Features

- **Customizable Gameplay**: Choose to play globally, filter by continent, or select specific countries for your rounds.
- **Official Google Street View**: Utilizes the Google Maps JavaScript API and `StreetViewService` to find and display high-quality, official Street View panoramas.
- **Interactive Guessing Map**: Place your guess on a fully interactive global map.
- **Distance Calculation**: Accurately measures the real-world distance between your guess and the actual location using Turf.js.
- **Dynamic UI**: Beautiful, responsive, and dark-themed UI built with Tailwind CSS v4 and Lucide React icons.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Library**: [React](https://react.dev/) 19
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Shadcn UI](https://ui.shadcn.com/) / Base UI
- **Maps & Street View**: [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- **Geospatial Math**: [Turf.js](https://turfjs.org/) (Distance and Point in Polygon calculations)

## ⚙️ Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kelvinleandro/where-in-the-world.git
   cd where-in-the-world
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` or `.env.local` file in the root directory and add your Google Maps API Key:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```
   > **Note**: Your API key needs access to the Maps JavaScript API and Street View API. Ensure billing is enabled on your Google Cloud Console.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Play the game!**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗺️ Project Structure

- `src/app/` - Next.js App Router pages and API routes.
- `src/components/` - React components including the main `HomeScreen` and `GameScreen` UI.
- `src/lib/locations/` - Handlers for country data and generating random coordinates inside boundaries.
- `src/lib/street-view/` - Logic for loading the Google Maps script, querying panoramas (`findOfficialPanorama`), and boundary validations.
- `public/countries.geojson` - Geographic boundaries used to validate if a generated point actually lands inside a country.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
