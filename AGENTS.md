Esse projeto é uma recriação do Geoguessr/Openguessr com Nextjs, tailwind e shadcn ui.

Utilizará o google maps api tanto para o minimap quanto para o street view.
Na pagina inicial terá um botão de play e um de configuracoes, para poder filtrar continente ou país.

Há um arquivo public/countries.geojson que possui, cada propriedade possui as chaves "iso2", "iso3", "name" e "continent", alem da geometria.

Durante uma rodada, depois de selecionado o possivel local, mostrara um ponteiro com o verdadeiro, o predito, uma linha entre eles, e distancia em km.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
