import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteImage, getImages, getPrompts, updatePrompt } from '../utils/apiUtils'

const getImageSrc = (imageData) => {
  if (typeof imageData !== 'string' || !imageData.trim()) {
    return ''
  }

  if (imageData.startsWith('data:')) {
    return imageData
  }

  return `data:image/png;base64,${imageData}`
}

const promptSections = [
  {
    title: 'Tekstprompts (Gemini)',
    promptNames: ['system_prompt', 'system_prompt_expand'],
  },
  {
    title: 'Konverteringsmoduser (Flux)',
    promptNames: ['convert_expand', 'convert_image', 'convert_inspire', 'style_prompt'],
  },
]

const promptMetadata = {
  system_prompt: {
    label: 'Systemprompt for beskrivelser',
    description: 'Brukes når brukeren beskriver et motiv i tekstfeltet',
  },
  system_prompt_expand: {
    label: 'Systemprompt for skisseutvidelse',
    description: 'Brukes når brukeren vil fullføre eller utvide en skisse',
  },
  convert_expand: {
    label: 'Fullfør skissen',
  },
  convert_image: {
    label: 'Detaljert illustrasjon',
  },
  convert_inspire: {
    label: 'Enkel illustrasjon',
  },
  style_prompt: {
    label: 'Global stilprompt',
    description: 'Legges til alle bildegenereringer',
  },
}

function AdminPage() {
  const [prompts, setPrompts] = useState([])
  const [images, setImages] = useState([])
  const [promptContents, setPromptContents] = useState({})
  const [promptStrengths, setPromptStrengths] = useState({})
  const [promptStatus, setPromptStatus] = useState({})
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(true)
  const [isLoadingImages, setIsLoadingImages] = useState(true)
  const [promptErrorMessage, setPromptErrorMessage] = useState('')
  const [imageErrorMessage, setImageErrorMessage] = useState('')
  const [deletingImageId, setDeletingImageId] = useState(null)

  const promptsBySection = useMemo(
    () =>
      promptSections.map((section) => ({
        ...section,
        prompts: section.promptNames
          .map((promptName) => prompts.find((prompt) => prompt.name === promptName))
          .filter(Boolean),
      })),
    [prompts],
  )

  const loadPrompts = async () => {
    setIsLoadingPrompts(true)

    try {
      const nextPrompts = await getPrompts()
      setPrompts(nextPrompts)
      setPromptContents(
        nextPrompts.reduce((accumulator, prompt) => {
          accumulator[prompt.name] = prompt.content ?? ''
          return accumulator
        }, {}),
      )
      setPromptStrengths(
        nextPrompts.reduce((accumulator, prompt) => {
          accumulator[prompt.name] = prompt.strength ?? ''
          return accumulator
        }, {}),
      )
      setPromptErrorMessage('')
    } catch (error) {
      setPromptErrorMessage(error instanceof Error ? error.message : 'Kunne ikke hente prompts.')
    } finally {
      setIsLoadingPrompts(false)
    }
  }

  const loadImages = async () => {
    setIsLoadingImages(true)

    try {
      const nextImages = await getImages()
      setImages(nextImages)
      setImageErrorMessage('')
    } catch (error) {
      setImageErrorMessage(error instanceof Error ? error.message : 'Kunne ikke hente bilder.')
    } finally {
      setIsLoadingImages(false)
    }
  }

  useEffect(() => {
    loadPrompts()
    loadImages()
  }, [])

  const handlePromptChange = (name, content) => {
    setPromptContents((currentContents) => ({
      ...currentContents,
      [name]: content,
    }))
    setPromptStatus((currentStatus) => ({
      ...currentStatus,
      [name]: '',
    }))
  }

  const handlePromptStrengthChange = (name, strength) => {
    setPromptStrengths((currentStrengths) => ({
      ...currentStrengths,
      [name]: strength,
    }))
    setPromptStatus((currentStatus) => ({
      ...currentStatus,
      [name]: '',
    }))
  }

  const handlePromptSave = async (name) => {
    setPromptStatus((currentStatus) => ({
      ...currentStatus,
      [name]: 'saving',
    }))

    try {
      await updatePrompt({
        name,
        content: promptContents[name] ?? '',
        strength: name.startsWith('convert_') ? Number(promptStrengths[name]) : null,
      })

      setPromptStatus((currentStatus) => ({
        ...currentStatus,
        [name]: 'saved',
      }))
    } catch (error) {
      setPromptStatus((currentStatus) => ({
        ...currentStatus,
        [name]: error instanceof Error ? error.message : 'Kunne ikke lagre prompt.',
      }))
    }
  }

  const handleDeleteImage = async (id) => {
    if (!window.confirm('Er du sikker?')) {
      return
    }

    setDeletingImageId(id)

    try {
      await deleteImage({ id })
      await loadImages()
    } catch (error) {
      setImageErrorMessage(error instanceof Error ? error.message : 'Kunne ikke slette bildet.')
    } finally {
      setDeletingImageId(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin</h1>
            <p className="mt-2 text-slate-600">Rediger prompts og administrer bilder i bildebanken.</p>
          </div>
          <Link to="/" className="text-sm text-slate-600 underline underline-offset-4 hover:text-slate-900">
            Tilbake til hovedsiden
          </Link>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Promptredigering</h2>
          {isLoadingPrompts ? <p className="mt-4 text-slate-600">Henter prompts...</p> : null}
          {promptErrorMessage ? <p className="mt-4 text-red-600">{promptErrorMessage}</p> : null}
          <div className="mt-6 space-y-8">
            {promptsBySection.map((section) => (
              <div key={section.title}>
                <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  {section.prompts.map((prompt) => {
                    const status = promptStatus[prompt.name]
                    const isConvertPrompt = prompt.name.startsWith('convert_')
                    const isSaving = status === 'saving'
                    const isSaved = status === 'saved'
                    const isError = status && !isSaving && !isSaved
                    const metadata = promptMetadata[prompt.name] ?? { label: prompt.name }

                    return (
                      <article key={prompt.name} className="rounded-xl border border-slate-200 p-4">
                        <label className="block text-sm font-medium text-slate-900" htmlFor={`prompt-${prompt.name}`}>
                          {metadata.label}
                        </label>
                        {metadata.description ? <p className="mt-1 text-sm text-slate-600">{metadata.description}</p> : null}
                        <textarea
                          id={`prompt-${prompt.name}`}
                          value={promptContents[prompt.name] ?? ''}
                          onChange={(event) => handlePromptChange(prompt.name, event.target.value)}
                          className="mt-3 min-h-64 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        />
                        {isConvertPrompt ? (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-slate-900" htmlFor={`prompt-strength-${prompt.name}`}>
                              Strength
                            </label>
                            <input
                              id={`prompt-strength-${prompt.name}`}
                              type="number"
                              min="0.1"
                              max="1.0"
                              step="0.05"
                              value={promptStrengths[prompt.name] ?? ''}
                              onChange={(event) => handlePromptStrengthChange(prompt.name, event.target.value)}
                              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                          </div>
                        ) : null}
                        <div className="mt-3 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handlePromptSave(prompt.name)}
                            disabled={isSaving}
                            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            {isSaving ? 'Lagrer...' : 'Lagre'}
                          </button>
                          {isSaved ? <p className="text-sm text-emerald-600">Lagret.</p> : null}
                          {isError ? <p className="text-sm text-red-600">{status}</p> : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Slett bilder</h2>
          {isLoadingImages ? <p className="mt-4 text-slate-600">Henter bilder...</p> : null}
          {imageErrorMessage ? <p className="mt-4 text-red-600">{imageErrorMessage}</p> : null}
          {!isLoadingImages && images.length === 0 ? (
            <p className="mt-4 text-slate-600">Ingen bilder å vise.</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((image) => (
                <article key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <img
                    src={getImageSrc(image.image_data)}
                    alt={`${image.motiv} - ${image.scene}`}
                    className="h-56 w-full object-cover"
                  />
                  <div className="space-y-2 p-4">
                    <p className="font-medium text-slate-900">{image.motiv}</p>
                    <p className="text-sm text-slate-600">{image.scene}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image.id)}
                      disabled={deletingImageId === image.id}
                      className="inline-flex rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingImageId === image.id ? 'Sletter...' : 'Slett'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default AdminPage
