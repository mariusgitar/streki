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

const matchesSearchQuery = (image, searchQuery) => {
  if (!searchQuery) {
    return true
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()

  if (!normalizedSearchQuery) {
    return true
  }

  return [image.motiv, image.scene].some((value) =>
    String(value ?? '').toLowerCase().includes(normalizedSearchQuery)
  )
}

const getResultLabel = (filteredCount, totalCount) => {
  if (filteredCount === totalCount) {
    return `${totalCount} bilder`
  }

  return `${filteredCount} av ${totalCount} bilder`
}

function ImageGallery({ images, searchQuery = '' }) {
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  const filteredImages = images.filter((image) => matchesSearchQuery(image, searchQuery))

  return (
    <section className="mt-10 text-left">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Bildegalleri</h2>
      <p className="mb-4 text-sm text-slate-500">{getResultLabel(filteredImages.length, images.length)}</p>
      {filteredImages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
          Ingen bilder matcher søket
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredImages.map((image) => (
            <article key={image.id}>
              <img src={getImageSrc(image.image_data)} alt={`${image.motiv} - ${image.scene}`} className="w-full" />
              <p>{image.motiv}</p>
              <p>{image.scene}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default ImageGallery
