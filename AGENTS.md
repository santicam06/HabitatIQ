# AGENTS.md

## Commands
- **Start server**: `npm start` (runs `node server.js` on `http://localhost:3000`)
- No build, lint, typecheck, or test scripts are configured. Verify syntax with `node --check server.js`.

## Architecture
- **`server.js`**: Zero-framework Node ESM HTTP server (`"type": "module"`).
  - Serves `habitatIQ.html` at `/` and static assets from the repo root (blocks dotfiles and `..` traversal).
  - `GET /api/model`: Returns `{ model: process.env.GEMINI_MODEL }`.
  - `POST /api/chat`: Proxies Gemini `generateContent` requests to `generativelanguage.googleapis.com/v1beta` using `GEMINI_MODEL` and `GEMINI_API_KEY` from `.env`.
- **`habitatIQ.html`**: Single-file frontend containing all HTML, CSS, mock datasets (`neighborhoodData`, `rawListings`), Chart.js analytics, calculator logic, and chat UI across four tabs (`dashboard`, `calculator`, `discovery`, `ai-navigator`).

## Environment & Quirks
- **Environment variables**: Loaded from `.env` via `dotenv` (`GEMINI_API_KEY` and `GEMINI_MODEL`). Do not expose `GEMINI_API_KEY` in client code.
- **Chat fallback & origin resolution**: `habitatIQ.html` routes `/api/chat` requests to `http://localhost:3000` automatically when opened via `file://` or a non-`3000` localhost port, and falls back to `generateFallbackResponse()` if the backend or Gemini API is unreachable.
- **Styling & Dark Mode**:
  - Uses Tailwind CDN (`cdn.tailwindcss.com`) plus an inline pre-generated `<style>` block (line 84).
  - Dark mode is controlled by toggling `html.dark` (`habitatiq_theme` in `localStorage`) and relies on explicit selector overrides in `<style id="dark-mode-styles">` rather than Tailwind `dark:` variants alone. When introducing new light-mode color classes on cards, text, or borders, verify they are covered in `#dark-mode-styles` and `updateChartsTheme()`.
