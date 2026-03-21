import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getConvertModes } from '../utils/apiUtils'

function ImageConverter({ onSubmit }) {
  const [modes, setModes] = useState([])
  const [selectedModeName, setSelectedModeName] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoadingModes, setIsLoadingModes] = useState(true)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const loadModes = async () => {
      setIsLoadingModes(true)

      try {
        const nextModes = await getConvertModes()
        setModes(nextModes)
        setSelectedModeName(nextModes[0]?.name ?? '')
        setErrorMessage('')
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Kunne ikke hente konverteringsmoduser.')
      } finally {
        setIsLoadingModes(false)
      }
    }

    loadModes()
  }, [])

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const selectedMode = useMemo(
    () => modes.find((mode) => mode.name === selectedModeName) ?? null,
    [modes, selectedModeName],
  )

  const handleFileSelection = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMessage('Velg en bildefil for å fortsette.')
      return
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setErrorMessage('')
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    handleFileSelection(event.dataTransfer.files?.[0])
  }

  const handleSubmit = () => {
    if (!selectedFile || !selectedMode) {
      setErrorMessage('Velg både et bilde og en modus før du fortsetter.')
      return
    }

    onSubmit({
      file: selectedFile,
      modeName: selectedMode.name,
      modeContent: selectedMode.content,
      modeStrength: selectedMode.strength,
    })
  }

  return (
    <section className="mt-8 w-full max-w-xl text-left">
      {isLoadingModes ? <p className="text-sm text-slate-500">Henter konverteringsmoduser...</p> : null}
      {errorMessage ? <p className="mb-4 text-sm text-red-600">{errorMessage}</p> : null}

      {!selectedFile ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              fileInputRef.current?.click()
            }
          }}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
            isDragging ? 'border-slate-900 bg-slate-100' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleFileSelection(event.target.files?.[0])}
          />
          <p className="text-lg font-medium text-slate-900">Last opp et bilde</p>
          <p className="mt-2 text-sm text-slate-600">Klikk for å velge fil, eller dra og slipp bildet her.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-[160px_minmax(0,1fr)] md:items-start">
            <img src={previewUrl} alt="Forhåndsvisning av opplastet bilde" className="h-40 w-40 rounded-xl object-cover" />
            <div className="space-y-4">
              <div>
                <label htmlFor="convert-mode" className="mb-2 block text-sm font-medium text-slate-900">
                  Velg konverteringsmodus
                </label>
                <select
                  id="convert-mode"
                  value={selectedModeName}
                  onChange={(event) => setSelectedModeName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                >
                  {modes.slice(0, 3).map((mode) => (
                    <option key={mode.name} value={mode.name}>
                      {mode.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!selectedMode || isLoadingModes}
                  className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Lag tegning
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl)
                    }
                    setSelectedFile(null)
                    setPreviewUrl('')
                    setErrorMessage('')
                  }}
                  className="inline-flex rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Velg et annet bilde
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default ImageConverter
