/**
 * Utvider brukerens motiv og scene til en rik bildegenereringsprompt.
 *
 * @param {{ motiv: string, scene: string }} params - Motivet og scenebeskrivelsen fra brukeren.
 * @returns {Promise<string>} Den utvidede prompten som tekst.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig prompt.
 */
export async function expandPrompt({ motiv, scene }) {
  const response = await fetch('/api/expand-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motiv, scene }),
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
 * @param {{ motiv: string, scene: string, expandedPrompt: string, imageData: string }} params - Feltene som skal lagres.
 * @returns {Promise<{ ok: boolean, id: string | number }>} Resultatet fra serveren.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig respons.
 */
export async function saveImage({ motiv, scene, expandedPrompt, imageData }) {
  const response = await fetch('/api/save-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ motiv, scene, expandedPrompt, imageData }),
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
 * @param {{ name: string, content: string }} params - Promptnavn og nytt innhold.
 * @returns {Promise<{ ok: boolean }>} Resultatet fra serveren.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig respons.
 */
export async function updatePrompt({ name, content }) {
  const response = await fetch('/api/update-prompt', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, content }),
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
