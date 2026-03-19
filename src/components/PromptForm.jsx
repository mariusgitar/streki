import React, { useState } from 'react'

function PromptForm({ onSubmit }) {
  const [motiv, setMotiv] = useState('')
  const [scene, setScene] = useState('')
  const [skipSave, setSkipSave] = useState(false)
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

    onSubmit({ motiv: motiv.trim(), scene: scene.trim(), skipSave })
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

      <div>
        <button
          type="submit"
          className="inline-flex rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Lag illustrasjon
        </button>
      </div>

      <label className="flex items-center gap-3 text-sm text-slate-700" htmlFor="skip-save">
        <input
          id="skip-save"
          type="checkbox"
          checked={skipSave}
          onChange={(event) => setSkipSave(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
        />
        Ikke lagre i bildebanken
      </label>
    </form>
  )
}

export default PromptForm
