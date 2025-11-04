# AI or Real?

Ein kleines SvelteKit‑Spiel: Erkennst du, ob ein Bild echt fotografiert ("real") oder KI‑generiert ("ai") ist?

## Tech‑Stack
- SvelteKit (Svelte 5 Runes)
- Tailwind CSS (Custom Styles in `src/app.css`)
- TypScript

## Entwicklung
> Der Projektworkflow verwendet pnpm.

```sh
pnpm install
pnpm dev
# Optional: automatisch im Browser öffnen
pnpm dev -- --open
```

## Produktion / Build
```sh
pnpm build
pnpm preview
```

## Bilder hinzufügen
Lege deine Bilder in diese Ordner ab – sie werden automatisch erkannt (via `import.meta.glob`):
- `src/lib/assets/real`  → echte Fotos
- `src/lib/assets/ai`    → KI‑Bilder

Unterstützte Formate: png, jpg, jpeg, gif, webp, avif.

Die Quellen werden in `src/lib/data/images.ts` zu einem Pool zusammengeführt und im Spiel zufällig verwendet.

## Spielregeln kurz
- Starte über die Startseite den Spielmodus
- Pro Runde wählst du zwischen „Echt“ oder „KI‑generiert“
- Punkte = Anzahl richtiger Antworten
- Am Ende kannst du dich (optional) in die Bestenliste eintragen

## Persistenz
- Aktuelle Runde: `sessionStorage` (`ai-or-real:game`)
- Bestenliste (Top 5): `localStorage` (`ai-or-real:highscores`)

## Projektstruktur (Auszug)
```
src/
  lib/
    assets/
      ai/   # KI‑Bilder
      real/ # echte Bilder
    data/images.ts      # Bildquellen‑Discovery
    stores/game.ts      # Spiellogik & State
    stores/highscore.ts # Highscores (Top 5)
  routes/
    +page.svelte        # Startseite (Hero + Bestenliste)
    game/+page.svelte   # Spielansicht
    result/+page.svelte # Ergebnis, Eintrag in Bestenliste
```

## Hinweise
- Styles sind bewusst minimalistisch‑modern gehalten und responsive.
- Wenn keine Bilder vorhanden sind, zeigt das Spiel einen Hinweis, wo Bilder abgelegt werden müssen.
