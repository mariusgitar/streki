# AGENTS.md

## Prosjektoversikt
Illustrasjonsmaker — intern kommunal webapp.
Brukeren beskriver motiv og scene på norsk. En LLM oversetter og
utvider til et rikt engelsk bildeprompt. Flux genererer illustrasjonen.

## Stack
- React + Vite + Tailwind CSS (frontend)
- Vercel serverless functions (API routes)
- OpenRouter API (både tekst og bilde)

## Modeller
- Tekstutvidelse: google/gemini-2.5-flash-lite
- Bildegenerering: black-forest-labs/flux.2-klein-4b

## API-nøkler
- OPENROUTER_API_KEY lagres som miljøvariabel i Vercel
- Skal aldri eksponeres i frontend-kode

## Database
- Neon Postgres (serverless)
- Tilkobling via miljøvariabelen NEON_DATABASE_URL
- Tabeller:
  - images (id, motiv, scene, expanded_prompt, image_url, created_at)
  - prompts (id, name, content, updated_at)
- Kun image_url (string) lagres i Neon, ikke base64

## Miljøvariabler
- STREKI_OPEN_ROUTER_KEY — OpenRouter API-nøkkel
- NEON_DATABASE_URL — Neon connection string

## Bildelagring
- Bilder lagres i Cloudflare R2 object storage
- Kun image_url (string) lagres i Neon, ikke base64
- R2-tilkobling via miljøvariabler:
  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
- AWS S3-kompatibelt API brukes for opplasting (@aws-sdk/client-s3)

## Filstruktur
src/
  components/    # React-komponenter
  utils/         # Hjelpefunksjoner
api/          # Vercel serverless functions (expand-prompt.js, generate-image.js)

## Konvensjoner
- Komponentfiler: PascalCase (f.eks. PromptForm.jsx)
- Functions: kebab-case (f.eks. expand-prompt.js)
- Utils: camelCase (f.eks. apiUtils.js)
- Norske brukervendte tekster, engelske variabelnavn og kommentarer
- Én komponent per fil

## Deploy
- Vercel, automatisk ved push til main
- Build-kommando: npm run build
- Output-mappe: dist
- Functions-mappe: api/
