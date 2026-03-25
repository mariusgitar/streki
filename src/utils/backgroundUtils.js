export const removeWhiteBackground = (imageElement, tolerance) => {
  const canvas = document.createElement('canvas')
  canvas.width = imageElement.width
  canvas.height = imageElement.height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Kunne ikke opprette canvas-kontekst.')
  }

  context.drawImage(imageElement, 0, 0)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const { data } = imageData

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index]
    const green = data[index + 1]
    const blue = data[index + 2]

    if (red > tolerance && green > tolerance && blue > tolerance) {
      data[index + 3] = 0
    }
  }

  context.putImageData(imageData, 0, 0)

  return canvas
}
