/**
 * Utvider brukerens motiv og scene til en rik bildegenereringsprompt.
 *
 * @param {{ motiv: string, scene: string }} params - Motivet og scenebeskrivelsen fra brukeren.
 * @returns {Promise<string>} Den utvidede prompten som tekst.
 * @throws {Error} Hvis forespørselen feiler eller serveren ikke returnerer en gyldig prompt.
 */
export async function expandPrompt({ motiv, scene }) {
  const response = await fetch('/.netlify/functions/expand-prompt', {
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
  const response = await fetch('/.netlify/functions/generate-image', {
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
