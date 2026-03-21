import React from 'react'

const getImageSrc = (imageData) => {
  if (typeof imageData !== 'string' || !imageData.trim()) {
    return ''
  }

  if (imageData.startsWith('data:')) {
    return imageData
  }

  return `data:image/png;base64,${imageData}`
}

const getBeskrivelse = (image) => String(image?.motiv ?? '').trim()

const isConvertedImage = (image) => getBeskrivelse(image).startsWith('Konvertert:')

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
              <article key={image.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <img
                  src={getImageSrc(image.image_data)}
                  alt={beskrivelse || 'Lagret illustrasjon'}
                  className="aspect-square w-full object-cover"
                />
                <p className="line-clamp-2 px-3 py-3 text-sm text-slate-700">{beskrivelse}</p>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ImageGallery
