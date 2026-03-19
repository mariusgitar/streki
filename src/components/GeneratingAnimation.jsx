import React from 'react'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

function GeneratingAnimation() {
  return (
    <div className="mt-8 flex w-full max-w-xl flex-col items-center justify-center text-center">
      <div className="flex h-full min-h-[356px] w-full items-center justify-center">
        <DotLottieReact
          src={`${window.location.origin}/drawing.lottie`}
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
