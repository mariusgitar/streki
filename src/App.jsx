import React from 'react'
import PromptForm from './components/PromptForm'

function App() {
  const handleSubmit = ({ motiv, scene }) => {
    console.log({ motiv, scene })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <div className="w-full max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-slate-900">Illustrasjonsmaker</h1>
        <p className="mt-3 text-lg text-slate-600">Beskriv hva du vil illustrere</p>
        <PromptForm onSubmit={handleSubmit} />
      </div>
    </main>
  )
}

export default App
