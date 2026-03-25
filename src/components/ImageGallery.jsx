import React, { useState } from 'react'

const getImageSrc = (imageUrl) => {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return ''
  }

  return imageUrl
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

  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  const filteredImages = images.filter(
    (image) => matchesSearchQuery(image, searchQuery) && matchesFilter(image, filter),
  )

  return (
    <section className="mt-10 text-left">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Bildegalleri</h2>
      {children}
      <p className="mb-4 mt-4 text-sm text-slate-500">{getResultLabel(filteredImages.length, images.length)}</p>
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
                    onClick={() => setSelectedImage(image)}
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
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Bilde i full størrelse"
        >
          <div className="relative max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-2 top-2 rounded-md bg-black/70 px-3 py-1 text-2xl leading-none text-white hover:bg-black/85"
              aria-label="Lukk bildevisning"
            >
              ×
            </button>
            <button
              type="button"
              onClick={() => downloadImage(selectedImage)}
              className="absolute right-14 top-2 rounded-md bg-black/70 p-2 text-xs text-white hover:bg-black/85"
              aria-label="Last ned bilde"
              title="Last ned bilde"
            >
              ⬇
            </button>
            <img
              src={getImageSrc(selectedImage.image_url)}
              alt={getBeskrivelse(selectedImage) || 'Lagret illustrasjon'}
              className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default ImageGallery
