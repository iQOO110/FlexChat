import { createContext, useContext, useState } from 'react'

const SettingsContext = createContext(null)

export function SettingsProvider({ children }) {
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [models, setModels] = useState([])

  const isConfigured = Boolean(baseUrl && apiKey && selectedModel)

  return (
    <SettingsContext.Provider
      value={{
        baseUrl,
        setBaseUrl,
        apiKey,
        setApiKey,
        selectedModel,
        setSelectedModel,
        models,
        setModels,
        isConfigured,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}