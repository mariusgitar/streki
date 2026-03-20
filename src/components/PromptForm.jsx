import React, { useState } from 'react'

function PromptForm({ onSubmit }) {
  const [beskrivelse, setBeskrivelse] = useState('')
  const [skipSave, setSkipSave] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!beskrivelse.trim()) {
      nextErrors.beskrivelse = 'Fyll inn en beskrivelse.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    onSubmit({ beskrivelse: beskrivelse.trim(), skipSave })
  }

  return (
    <form className="mt-8 w-full max-w-xl space-y-5 text-left" onSubmit={handleSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-900" htmlFor="beskrivelse">
          Hva vil du jeg skal tegne?
        </label>
        <textarea
          id="beskrivelse"
          value={beskrivelse}
          onChange={(event) => setBeskrivelse(event.target.value)}
          placeholder={`Beskriv gjerne et motiv og en scene, så er det
lettere for meg å tolke. F.eks: En gutt som spiser havregryn
alene ved et kjøkkenbord om morgenen.`}
          className="min-h-32 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
        {errors.beskrivelse ? <p className="mt-2 text-sm text-red-600">{errors.beskrivelse}</p> : null}
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
