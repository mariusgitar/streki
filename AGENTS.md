# AGENTS.md

## Prosjektoversikt
Illustrasjonsmaker — intern kommunal webapp.
Brukeren beskriver motiv og scene på norsk. En LLM oversetter og
utvider til et rikt engelsk bildeprompt. Flux genererer illustrasjonen.

## Stack
- React + Vite + Tailwind CSS (frontend)
- Netlify Functions (serverless API-funksjoner)
- OpenRouter API (både tekst og bilde)

## Modeller
- Tekstutvidelse: google/gemini-2.5-flash-lite
- Bildegenerering: black-forest-labs/flux.2-klein-4b

## API-nøkler
- OPENROUTER_API_KEY lagres som miljøvariabel i Netlify
- Skal aldri eksponeres i frontend-kode

## Filstruktur
src/
  components/    # React-komponenter
  utils/         # Hjelpefunksjoner
netlify/
  functions/     # Serverless functions (expand-prompt.js, generate-image.js)

## Konvensjoner
- Komponentfiler: PascalCase (f.eks. PromptForm.jsx)
- Functions: kebab-case (f.eks. expand-prompt.js)
- Utils: camelCase (f.eks. apiUtils.js)
- Norske brukervendte tekster, engelske variabelnavn og kommentarer
- Én komponent per fil

## Deploy
- Netlify, automatisk ved push til main
- Build-kommando: npm run build
- Output-mappe: dist
- Functions-mappe: netlify/functions
