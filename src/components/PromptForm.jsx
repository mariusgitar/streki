import React, { useState } from 'react'

function PromptForm({ onSubmit }) {
  const [motiv, setMotiv] = useState('')
  const [scene, setScene] = useState('')
  const [errors, setErrors] = useState({})

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!motiv.trim()) {
      nextErrors.motiv = 'Fyll inn motiv.'
    }

    if (!scene.trim()) {
      nextErrors.scene = 'Fyll inn scene.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({ motiv: motiv.trim(), scene: scene.trim() })
  }

  return (
    <form className="mt-8 w-full max-w-xl space-y-5 text-left" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-900" htmlFor="motiv">
          Motiv
        </label>
        <input
          id="motiv"
          type="text"
          value={motiv}
          onChange={(event) => setMotiv(event.target.value)}
          placeholder="For eksempel en lærer, en hund eller et rådhus"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
        {errors.motiv ? <p className="mt-2 text-sm text-red-600">{errors.motiv}</p> : null}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-900" htmlFor="scene">
          Scene
        </label>
        <textarea
          id="scene"
          value={scene}
          onChange={(event) => setScene(event.target.value)}
          placeholder="Beskriv hva som skjer, hvor motivet er, og hvilken stemning illustrasjonen skal ha"
          className="min-h-32 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
        {errors.scene ? <p className="mt-2 text-sm text-red-600">{errors.scene}</p> : null}
      </div>

      <button
        type="submit"
        className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Lag illustrasjon
      </button>
    </form>
  )
}

export default PromptForm
