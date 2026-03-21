import React from 'react'

const filterOptions = [
  { value: 'all', label: 'Alle' },
  { value: 'text', label: 'Tekstbasert' },
  { value: 'converted', label: 'Konvertert' },
]

function SearchBar({ onSearch, query = '', filter = 'all', onFilterChange }) {
  const handleChange = (event) => {
    onSearch(event.target.value)
  }

  const handleClear = () => {
    onSearch('')
  }

  return (
    <div className="mt-10 text-left">
      <label className="relative block" htmlFor="image-search">
        <input
          id="image-search"
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Søk i bildebanken..."
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

      <div className="mt-3 flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const isActive = filter === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onFilterChange(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900'
              }`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SearchBar
