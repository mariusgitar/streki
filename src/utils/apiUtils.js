/**
 * Utvider brukerens beskrivelse til en rik bildegenereringsprompt.
 *
 * @param {{ beskrivelse: string, mode?: string }} params - Beskrivelsen fra brukeren.
 * @returns {Promise<string>} Den utvidede prompten som tekst.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig prompt.
 */
export async function expandPrompt({ beskrivelse, mode }) {
  const response = await fetch('/api/expand-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ beskrivelse, mode }),
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error('Kunne ikke utvide prompten på grunn av en ugyldig serverrespons.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Kunne ikke utvide prompten. Prøv igjen.')
  }

  if (!data?.expandedPrompt || typeof data.expandedPrompt !== 'string') {
    throw new Error('Serveren returnerte ingen gyldig utvidet prompt.')
  }

  return data.expandedPrompt
}

/**
 * Genererer en illustrasjon basert på en utvidet bildeprompt.
 *
 * @param {{ expandedPrompt: string }} params - Den utvidede prompten som skal brukes til bildeoppretting.
 * @returns {Promise<string>} URL-en til det genererte bildet.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig bilde-URL.
 */
export async function generateImage({ expandedPrompt }) {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expandedPrompt }),
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error('Kunne ikke generere bildet på grunn av en ugyldig serverrespons.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Kunne ikke generere bildet. Prøv igjen.')
  }

  if (!data?.imageUrl || typeof data.imageUrl !== 'string') {
    throw new Error('Serveren returnerte ingen gyldig bildeadresse.')
  }

  return data.imageUrl
}

/**
 * Lagrer et generert bilde i bildebanken.
 *
 * @param {{ beskrivelse: string, expandedPrompt: string, imageUrl: string }} params - Feltene som skal lagres.
 * @returns {Promise<{ ok: boolean, id: string | number }>} Resultatet fra serveren.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig respons.
 */
export async function saveImage({ beskrivelse, expandedPrompt, imageUrl }) {
  const response = await fetch('/api/save-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ beskrivelse, expandedPrompt, imageUrl }),
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error('Kunne ikke lagre bildet på grunn av en ugyldig serverrespons.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Kunne ikke lagre bildet. Prøv igjen.')
  }

  if (data?.ok !== true || (!data?.id && data?.id !== 0)) {
    throw new Error('Serveren returnerte ikke en gyldig lagringsbekreftelse.')
  }

  return {
    ok: data.ok,
    id: data.id,
  }
}

/**
 * Henter lagrede bilder fra bildebanken.
 *
 * @returns {Promise<Array>} Liste over lagrede bildeobjekter.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig bildeliste.
 */
export async function getImages() {
  const response = await fetch('/api/get-images', {
    method: 'GET',
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error('Kunne ikke hente bilder på grunn av en ugyldig serverrespons.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Kunne ikke hente bilder. Prøv igjen.')
  }

  if (!Array.isArray(data?.images)) {
    throw new Error('Serveren returnerte ingen gyldig bildeliste.')
  }

  return data.images
}


/**
 * Henter konverteringsmoduser for bildeopplasting.
 *
 * @returns {Promise<Array>} Liste over konverteringsmoduser.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig respons.
 */
export async function getConvertModes() {
  const response = await fetch('/api/get-convert-modes', {
    method: 'GET',
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error('Kunne ikke hente konverteringsmoduser på grunn av en ugyldig serverrespons.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Kunne ikke hente konverteringsmoduser. Prøv igjen.')
  }

  if (!Array.isArray(data?.modes)) {
    throw new Error('Serveren returnerte ingen gyldig liste med konverteringsmoduser.')
  }

  return data.modes
}

/**
 * Konverterer et opplastet bilde til en tegning.
 *
 * @param {{ imageBase64: string, modeContent: string, modeStrength: number, ekstraInstruksjon?: string }} params - Data for konverteringen.
 * @returns {Promise<string>} URL-en til det konverterte bildet.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig bilde-URL.
 */
export async function convertImage({ imageBase64, modeContent, modeStrength, ekstraInstruksjon }) {
  const response = await fetch('/api/convert-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imageBase64, modeContent, modeStrength, ekstraInstruksjon }),
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error('Kunne ikke konvertere bildet på grunn av en ugyldig serverrespons.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Kunne ikke konvertere bildet. Prøv igjen.')
  }

  if (!data?.imageUrl || typeof data.imageUrl !== 'string') {
    throw new Error('Serveren returnerte ingen gyldig bildeadresse.')
  }

  return data.imageUrl
}

/**
 * Henter alle lagrede prompts.
 *
 * @returns {Promise<Array>} Liste over prompt-objekter.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig promptliste.
 */
export async function getPrompts() {
  const response = await fetch('/api/get-prompts', {
    method: 'GET',
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error('Kunne ikke hente prompts på grunn av en ugyldig serverrespons.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Kunne ikke hente prompts. Prøv igjen.')
  }

  if (!Array.isArray(data?.prompts)) {
    throw new Error('Serveren returnerte ingen gyldig promptliste.')
  }

  return data.prompts
}

/**
 * Oppdaterer en navngitt prompt.
 *
 * @param {{ name: string, content: string, strength?: number | null }} params - Promptnavn, nytt innhold og eventuelt strength.
 * @returns {Promise<{ ok: boolean }>} Resultatet fra serveren.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig respons.
 */
export async function updatePrompt({ name, content, strength = null }) {
  const response = await fetch('/api/update-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, content, strength }),
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error('Kunne ikke lagre prompten på grunn av en ugyldig serverrespons.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Kunne ikke lagre prompten. Prøv igjen.')
  }

  if (data?.ok !== true) {
    throw new Error('Serveren returnerte ikke en gyldig lagringsbekreftelse.')
  }

  return { ok: data.ok }
}

/**
 * Sletter et lagret bilde.
 *
 * @param {{ id: string | number }} params - ID-en til bildet som skal slettes.
 * @returns {Promise<{ ok: boolean }>} Resultatet fra serveren.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig respons.
 */
export async function deleteImage({ id }) {
  const response = await fetch('/api/delete-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  })

  let data = null

  try {
    data = await response.json()
  } catch {
    if (!response.ok) {
      throw new Error('Kunne ikke slette bildet på grunn av en ugyldig serverrespons.')
    }
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Kunne ikke slette bildet. Prøv igjen.')
  }

  if (data?.ok !== true) {
    throw new Error('Serveren returnerte ikke en gyldig slettebekreftelse.')
  }

  return { ok: data.ok }
}
