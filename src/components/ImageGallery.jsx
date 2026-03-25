import React, { useEffect, useRef, useState } from 'react'
import { removeWhiteBackground } from '../utils/backgroundUtils'

const getImageSrc = (imageUrl) => {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return ''
  }

  const trimmedImageUrl = imageUrl.trim()

  if (trimmedImageUrl.startsWith('https://')) {
    return trimmedImageUrl
  }

  return `data:image/png;base64,${trimmedImageUrl}`
}

const getBeskrivelse = (image) => String(image?.motiv ?? '').trim()

const isConvertedImage = (image) => getBeskrivelse(image).startsWith('Konvertert:')

const sanitizeFilename = (filename) =>
  filename
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)

const getDownloadFilename = (image) => {
  const beskrivelse = sanitizeFilename(getBeskrivelse(image))
  return `${beskrivelse || 'illustrasjon'}.png`
}

const downloadImage = async (image) => {
  const src = getImageSrc(image?.image_url)

  if (!src) {
    return
  }

  try {
    const response = await fetch(src)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = getDownloadFilename(image)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('Kunne ikke laste ned bilde', error)
  }
}

const matchesSearchQuery = (image, searchQuery) => {
  if (!searchQuery) {
    return true
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

  if (!normalizedSearchQuery) {
    return true
  }

  return getBeskrivelse(image).toLowerCase().includes(normalizedSearchQuery)
}

const matchesFilter = (image, filter = 'all') => {
  if (filter === 'converted') {
    return isConvertedImage(image)
  }

  if (filter === 'text') {
    return !isConvertedImage(image)
  }

  return true
}

const getResultLabel = (filteredCount, totalCount) => {
  if (filteredCount === totalCount) {
    return `${totalCount} bilder`
  }

  return `${filteredCount} av ${totalCount} bilder`
}

function ImageGallery({ images, searchQuery = '', filter = 'all', children = null }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [backgroundTolerance, setBackgroundTolerance] = useState(240)
  const [processedCanvas, setProcessedCanvas] = useState(null)
  const [isRemovingBackground, setIsRemovingBackground] = useState(false)
  const [lightboxErrorMessage, setLightboxErrorMessage] = useState('')
  const canvasContainerRef = useRef(null)
  const safeImages = Array.isArray(images) ? images : []
  const filteredImages = safeImages.filter(
    (image) => matchesSearchQuery(image, searchQuery) && matchesFilter(image, filter),
  )

  const processSelectedImage = async (tolerance) => {
    if (!selectedImage?.image_url) {
      return
    }

    setIsRemovingBackground(true)
    setLightboxErrorMessage('')

    try {
      const imageElement = await new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Kunne ikke laste bildet for bakgrunnsfjerning.'))
        img.src = selectedImage.image_url
      })
      const nextCanvas = removeWhiteBackground(imageElement, tolerance)
      setProcessedCanvas(nextCanvas)
    } catch (error) {
      setLightboxErrorMessage(error instanceof Error ? error.message : 'Noe gikk galt ved bakgrunnsfjerning.')
    } finally {
      setIsRemovingBackground(false)
    }
  }

  const handleOpenLightbox = (image) => {
    setSelectedImage(image)
    setProcessedCanvas(null)
    setBackgroundTolerance(240)
    setLightboxErrorMessage('')
  }

  const handleCloseLightbox = () => {
    setSelectedImage(null)
    setProcessedCanvas(null)
    setBackgroundTolerance(240)
    setLightboxErrorMessage('')
  }

  const handleDownloadFromLightbox = () => {
    if (!selectedImage) {
      return
    }

    if (processedCanvas) {
      const link = document.createElement('a')
      link.href = processedCanvas.toDataURL('image/png')
      link.download = getDownloadFilename(selectedImage)
      link.click()
      return
    }

    downloadImage(selectedImage)
  }

  useEffect(() => {
    if (!processedCanvas || !canvasContainerRef.current) {
      return
    }

    canvasContainerRef.current.innerHTML = ''
    canvasContainerRef.current.appendChild(processedCanvas)
  }, [processedCanvas])

  useEffect(() => {
    if (!processedCanvas) {
      return
    }

    processSelectedImage(backgroundTolerance)
  }, [backgroundTolerance])

  if (safeImages.length === 0) {
    return null
  }

  return (
    <section className="mt-10 text-left">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Bildegalleri</h2>
      {children}
      <p className="mb-4 mt-4 text-sm text-slate-500">{getResultLabel(filteredImages.length, safeImages.length)}</p>
      {filteredImages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          Ingen bilder matcher søket
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredImages.map((image) => {
            const beskrivelse = getBeskrivelse(image)

            return (
              <article
                key={image.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => handleOpenLightbox(image)}
                    className="w-full"
                    aria-label={`Åpne ${beskrivelse || 'illustrasjon'} i full størrelse`}
                  >
                    <img
                      src={getImageSrc(image.image_url)}
                      alt={beskrivelse || 'Lagret illustrasjon'}
                      className="aspect-square w-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadImage(image)}
                    className="absolute right-2 top-2 rounded-md bg-black/70 p-2 text-xs text-white opacity-100 transition hover:bg-black/85 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Last ned ${beskrivelse || 'illustrasjon'}`}
                    title="Last ned bilde"
                  >
                    ⬇
                  </button>
                </div>
                <p className="line-clamp-2 px-3 py-3 text-sm text-slate-700">{beskrivelse}</p>
              </article>
            )
          })}
        </div>
      )}
      {selectedImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Bilde i full størrelse"
        >
          <div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={handleCloseLightbox}
              className="absolute right-2 top-2 rounded-md bg-black/70 px-3 py-1 text-2xl leading-none text-white hover:bg-black/85"
              aria-label="Lukk bildevisning"
            >
              ×
            </button>
            <div
              className="flex min-h-[280px] min-w-[280px] max-w-[90vw] items-center justify-center rounded-lg p-3"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
              }}
            >
              {processedCanvas ? (
                <div ref={canvasContainerRef} className="max-h-[70vh] max-w-[90vw] overflow-auto" />
              ) : (
                <img
                  src={getImageSrc(selectedImage.image_url)}
                  alt={getBeskrivelse(selectedImage) || 'Lagret illustrasjon'}
                  className="max-h-[70vh] max-w-[90vw] rounded-lg object-contain"
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-slate-900/85 p-3 text-white">
              <button
                type="button"
                onClick={() => processSelectedImage(backgroundTolerance)}
                className="rounded-md bg-white/15 px-3 py-2 text-sm font-semibold transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRemovingBackground}
              >
                {isRemovingBackground ? 'Fjerner bakgrunn...' : 'Fjern hvit bakgrunn'}
              </button>
              {processedCanvas ? (
                <>
                  <label htmlFor="lightbox-background-tolerance" className="text-sm">
                    Styrke: {backgroundTolerance}
                  </label>
                  <input
                    id="lightbox-background-tolerance"
                    type="range"
                    min="200"
                    max="255"
                    value={backgroundTolerance}
                    onChange={(event) => setBackgroundTolerance(Number(event.target.value))}
                  />
                  <button
                    type="button"
                    onClick={() => setProcessedCanvas(null)}
                    className="rounded-md bg-white/15 px-3 py-2 text-sm font-semibold transition hover:bg-white/25"
                  >
                    Tilbakestill
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={handleDownloadFromLightbox}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Last ned
              </button>
            </div>
            {lightboxErrorMessage ? <p className="mt-2 text-sm text-red-300">{lightboxErrorMessage}</p> : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ImageGallery
