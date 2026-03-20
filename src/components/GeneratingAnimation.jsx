import React from 'react'
import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react'

const localDotLottieWasmUrl = new URL(
  '../../node_modules/@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm',
  import.meta.url,
).href

setWasmUrl(localDotLottieWasmUrl)

function GeneratingAnimation() {
  return (
    <div className="mt-8 flex w-full max-w-xl flex-col items-center justify-center text-center">
      <div className="flex h-full min-h-[356px] w-full items-center justify-center">
        <DotLottieReact
          src="/drawing.lottie"
          loop
          autoplay
          className="h-full w-full"
        />
      </div>
      <p className="mt-4 text-slate-700">Skisser og tegner og tenker på fregner...</p>
    </div>
  )
}

export default GeneratingAnimation
