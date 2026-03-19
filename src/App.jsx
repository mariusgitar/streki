import React, { useEffect, useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import AdminPage from './components/AdminPage'
import ImageGallery from './components/ImageGallery'
import SearchBar from './components/SearchBar'
import PromptForm from './components/PromptForm'
import { expandPrompt, generateImage, getImages, saveImage } from './utils/apiUtils'

const getBase64ImageData = (imageUrl) => {
  if (typeof imageUrl !== 'string') {
    return ''
  }

  const dataUrlPrefix = 'base64,'
  const base64Index = imageUrl.indexOf(dataUrlPrefix)

  if (base64Index === -1) {
    return imageUrl
  }

  return imageUrl.slice(base64Index + dataUrlPrefix.length)
}

function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [motiv, setMotiv] = useState('')
  const [scene, setScene] = useState('')
  const [expandedPrompt, setExpandedPrompt] = useState('')
  const [imageData, setImageData] = useState('')
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

  const handleSubmit = async ({ motiv, scene, skipSave }) => {
    setIsLoading(true)
    setImageUrl('')
    setErrorMessage('')
    setMotiv(motiv)
    setScene(scene)
    setExpandedPrompt('')
    setImageData('')
    setIsSaving(false)
    setSaveErrorMessage('')
    setIsSaved(false)

    try {
      const nextExpandedPrompt = await expandPrompt({ motiv, scene })
      const nextImageUrl = await generateImage({ expandedPrompt: nextExpandedPrompt })
      const nextImageData = getBase64ImageData(nextImageUrl)

      setExpandedPrompt(nextExpandedPrompt)
      setImageUrl(nextImageUrl)
      setImageData(nextImageData)

      if (!skipSave) {
        setIsSaving(true)

        try {
          await saveImage({
            motiv,
            scene,
            expandedPrompt: nextExpandedPrompt,
            imageData: nextImageData,
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-slate-900">StreKI</h1>
        <p className="mt-3 text-lg text-slate-600">Beskriv hva du vil illustrere</p>
        <PromptForm onSubmit={handleSubmit} />

        {isLoading ? <p className="mt-6 text-slate-700">Lager illustrasjon...</p> : null}
        {errorMessage ? <p className="mt-6 text-red-600">{errorMessage}</p> : null}
        {imageUrl ? (
          <div className="mt-8">
            <img src={imageUrl} alt="Generert illustrasjon" className="mx-auto max-w-full" />
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
