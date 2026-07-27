import { useState } from 'react'
import { useSettings } from '../context/SettingsContext'

export default function SettingsModal({ onClose }) {
  const {
    baseUrl,
    setBaseUrl,
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    models,
    setModels,
  } = useSettings()

  const [tempBaseUrl, setTempBaseUrl] = useState(baseUrl)
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // ==================== 获取模型 ====================
  const handleFetchModels = async () => {
    if (!tempBaseUrl || !tempApiKey) {
      setError('请填写 Base URL 和 API Key')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: tempBaseUrl, apiKey: tempApiKey }),
      })
      const json = await res.json()
      if (json.code === 200 && Array.isArray(json.data)) {
        setModels(json.data)
        if (json.data.length > 0 && !json.data.includes(selectedModel)) {
          setSelectedModel(json.data[0])
        }
      } else {
        setError(json.message || '获取模型失败')
      }
    } catch (e) {
      setError('网络错误: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // ==================== 保存 ====================
  const handleSave = () => {
    setBaseUrl(tempBaseUrl)
    setApiKey(tempApiKey)
    onClose()
  }

  return (
    // 遮罩层
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      {/* 弹窗主体 */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">设置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 表单 */}
        <div className="space-y-4">
          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Base URL
            </label>
            <input
              type="text"
              value={tempBaseUrl}
              onChange={(e) => setTempBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <input
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 获取模型按钮 */}
          <button
            onClick={handleFetchModels}
            disabled={loading}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '获取中...' : '获取模型'}
          </button>

          {/* 错误提示 */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* 模型下拉 */}
          {models.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                选择模型
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={!tempBaseUrl || !tempApiKey || !selectedModel}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}