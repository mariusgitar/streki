import React, { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import AdminPage from './components/AdminPage'
import ImageGallery from './components/ImageGallery'
import SearchBar from './components/SearchBar'
import PromptForm from './components/PromptForm'
import GeneratingAnimation from './components/GeneratingAnimation'
import PasswordGate from './components/PasswordGate'
import ImageConverter from './components/ImageConverter'
import { convertImage, expandPrompt, generateImage, getImages, saveImage } from './utils/apiUtils'

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Kunne ikke lese bildefilen.'))
    }

    reader.onerror = () => reject(new Error('Kunne ikke lese bildefilen.'))
    reader.readAsDataURL(file)
  })

function HomePage() {
  const [activeTab, setActiveTab] = useState('describe')
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [beskrivelse, setBeskrivelse] = useState('')
  const [expandedPrompt, setExpandedPrompt] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [images, setImages] = useState([])
  const [galleryErrorMessage, setGalleryErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadImages = async () => {
    try {
      const nextImages = await getImages()
      setImages(nextImages)
      setGalleryErrorMessage('')
    } catch (error) {
      setGalleryErrorMessage(error instanceof Error ? error.message : 'Kunne ikke hente bildegalleriet.')
    }
  }

  useEffect(() => {
    loadImages()
  }, [])

  const resetResultState = () => {
    setImageUrl('')
    setErrorMessage('')
    setExpandedPrompt('')
    setIsSaving(false)
    setSaveErrorMessage('')
    setIsSaved(false)
  }

  const handleSubmit = async ({ beskrivelse, skipSave }) => {
    setIsLoading(true)
    resetResultState()
    setBeskrivelse(beskrivelse)

    try {
      const nextExpandedPrompt = await expandPrompt({ beskrivelse })
      const nextImageUrl = await generateImage({ expandedPrompt: nextExpandedPrompt })
      setExpandedPrompt(nextExpandedPrompt)
      setImageUrl(nextImageUrl)
      if (!skipSave) {
        setIsSaving(true)

        try {
          await saveImage({
            beskrivelse,
            expandedPrompt: nextExpandedPrompt,
            imageUrl: nextImageUrl,
          })

          setIsSaved(true)
          await loadImages()
        } catch (error) {
          setSaveErrorMessage(error instanceof Error ? error.message : 'Noe gikk galt ved lagring. Prøv igjen.')
        } finally {
          setIsSaving(false)
        }
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Noe gikk galt. Prøv igjen.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConvertSubmit = async ({ file, modeName, modeContent, modeStrength }) => {
    setIsLoading(true)
    resetResultState()
    const nextBeskrivelse = `Konvertert: ${modeName}`
    setBeskrivelse(nextBeskrivelse)

    try {
      const imageBase64 = await fileToDataUrl(file)
      const nextImageUrl = await convertImage({
        imageBase64,
        modeContent,
        modeStrength,
      })
      const nextExpandedPrompt = `${modeContent}`

      setExpandedPrompt(nextExpandedPrompt)
      setImageUrl(nextImageUrl)
      setIsSaving(true)

      try {
        await saveImage({
          beskrivelse: nextBeskrivelse,
          expandedPrompt: nextExpandedPrompt,
          imageUrl: nextImageUrl,
        })

        setIsSaved(true)
        await loadImages()
      } catch (error) {
        setSaveErrorMessage(error instanceof Error ? error.message : 'Noe gikk galt ved lagring. Prøv igjen.')
      } finally {
        setIsSaving(false)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Noe gikk galt. Prøv igjen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-slate-900">StreKI</h1>
        <p className="mt-3 text-lg text-slate-600">Lag illustrasjon fra tekst eller konverter et opplastet bilde</p>

        <div className="mt-8 inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('describe')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'describe' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Beskriv
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last opp bilde
          </button>
        </div>

        {isLoading ? (
          <GeneratingAnimation />
        ) : activeTab === 'describe' ? (
          <PromptForm onSubmit={handleSubmit} />
        ) : (
          <ImageConverter onSubmit={handleConvertSubmit} />
        )}

        {errorMessage ? <p className="mt-6 text-red-600">{errorMessage}</p> : null}
        {imageUrl ? (
          <div className="mt-8">
            <img src={imageUrl} alt={beskrivelse || 'Generert illustrasjon'} className="mx-auto max-w-full" />
            {isSaving ? <p className="mt-4 text-sm text-slate-500">Lagrer i bildebanken...</p> : null}
            {isSaved ? <p className="mt-4 text-sm text-slate-500">Lagret i bildebanken</p> : null}
            {saveErrorMessage ? <p className="mt-4 text-red-600">{saveErrorMessage}</p> : null}
          </div>
        ) : null}

        {galleryErrorMessage ? <p className="mt-8 text-red-600">{galleryErrorMessage}</p> : null}
        <SearchBar query={searchQuery} onSearch={setSearchQuery} />
        <ImageGallery images={images} searchQuery={searchQuery} />
        <div className="mt-10 text-center">
          <Link
            to="/admin"
            className="text-sm text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700"
          >
            Admin
          </Link>
        </div>
      </div>
    </main>
  )
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasCheckedSession, setHasCheckedSession] = useState(false)

  useEffect(() => {
    setIsAuthenticated(sessionStorage.getItem('authenticated') === 'authenticated')
    setHasCheckedSession(true)
  }, [])

  if (!hasCheckedSession) {
    return null
  }

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
