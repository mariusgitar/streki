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

function ImageGallery({ images }) {
  if (!Array.isArray(images) || images.length === 0) {
    return null
  }

  return (
    <section className="mt-10 text-left">
      <h2 className="mb-4 text-2xl font-semibold text-slate-900">Bildegalleri</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image) => (
          <article key={image.id}>
            <img src={getImageSrc(image.image_data)} alt={`${image.motiv} - ${image.scene}`} className="w-full" />
            <p>{image.motiv}</p>
            <p>{image.scene}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ImageGallery
