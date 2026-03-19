import React from 'react'

export function DotLottieReact({ src, className = '', loop = false, autoplay = false }) {
  const loopValue = loop ? '1' : '0'
  const autoplayValue = autoplay ? '1' : '0'
  const iframeSource = `https://lottie.host/embed/${encodeURIComponent(src)}?loop=${loopValue}&autoplay=${autoplayValue}`

  return (
    <iframe
      title="Lottie-animasjon"
      src={iframeSource}
      className={className}
      style={{ border: 0 }}
      allow="autoplay"
    />
  )
}
