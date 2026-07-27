import { useState } from 'react'
import { useSettings } from '../context/SettingsContext'
import { fetchModels } from '../services/apiClient'

export default function SettingsModal({ onClose }) {
  const {
    baseUrl, setBaseUrl,
    apiKey, setApiKey,
    selectedModel, setSelectedModel,
    models, setModels,
  } = useSettings()

  const [tempBaseUrl, setTempBaseUrl] = useState(baseUrl)
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [tempModel, setTempModel] = useState(selectedModel)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showManual, setShowManual] = useState(false)

  const handleFetchModels = async () => {
    if (!tempBaseUrl || !tempApiKey) {
      setError('请填写 Base URL 和 API Key')
      return
    }
    setLoading(true)
    setError('')
    setModels([])
    setShowManual(false)

    try {
      const result = await fetchModels(tempBaseUrl, tempApiKey)

      if (result.success && result.data?.length > 0) {
        setModels(result.data)
        if (!result.data.includes(tempModel)) {
          setTempModel(result.data[0])
        }
      } else {
        setError(`获取失败：${result.error}`)
        setShowManual(true)
      }
    } catch (e) {
      setError(`请求失败：${e.message}。可手动输入模型名`)
      setShowManual(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    setBaseUrl(tempBaseUrl)
    setApiKey(tempApiKey)
    setSelectedModel(tempModel)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
            <input
              type="text"
              value={tempBaseUrl}
              onChange={(e) => setTempBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 获取模型按钮 */}
          <button
            onClick={handleFetchModels}
            disabled={loading}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '获取中...' : '获取模型'}
          </button>

          {/* 错误提示 */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 break-all">{error}</p>
            </div>
          )}

          {/* 模型下拉（获取成功时显示） */}
          {models.length > 0 && !showManual && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">选择模型</label>
              <select
                value={tempModel}
                onChange={(e) => setTempModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {models.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {/* 手动输入模型（获取失败时显示） */}
          {(showManual || models.length === 0) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                手动输入模型名
              </label>
              <input
                type="text"
                value={tempModel}
                onChange={(e) => setTempModel(e.target.value)}
                placeholder="如 gpt-3.5-turbo、qwen-turbo"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                部分服务商不支持获取模型列表，可直接输入模型名
              </p>
            </div>
          )}

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={!tempBaseUrl || !tempApiKey || !tempModel}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
