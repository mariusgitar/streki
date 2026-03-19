import React, { useState } from 'react'
import PromptForm from './components/PromptForm'
import { expandPrompt, generateImage } from './utils/apiUtils'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async ({ motiv, scene }) => {
    setIsLoading(true)
    setImageUrl('')
    setErrorMessage('')

    try {
      const expandedPrompt = await expandPrompt({ motiv, scene })
      const nextImageUrl = await generateImage({ expandedPrompt })
      setImageUrl(nextImageUrl)
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
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default App
