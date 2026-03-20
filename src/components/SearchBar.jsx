import React from 'react'

function SearchBar({ onSearch, query = '' }) {
  const handleChange = (event) => {
    onSearch(event.target.value)
  }

  const handleClear = () => {
    onSearch('')
  }

  return (
    <div className="mt-10">
      <label className="relative block" htmlFor="image-search">
        <input
          id="image-search"
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Søk i beskrivelser..."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 pr-12 text-left text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xl leading-none text-slate-400 transition hover:text-slate-700"
            aria-label="Tøm søk"
          >
            ×
          </button>
        ) : null}
      </label>
    </div>
  )
}

export default SearchBar
