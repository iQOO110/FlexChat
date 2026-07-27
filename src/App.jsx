import { useState, useRef, useEffect } from 'react'
import { useSettings } from './context/SettingsContext'
import Header from './components/Header'
import SettingsModal from './components/SettingsModal'
import ChatMessage from './components/ChatMessage'
import ChatInput from './components/ChatInput'

export default function App() {
  const { baseUrl, apiKey, selectedModel, isConfigured } = useSettings()
  const [messages, setMessages] = useState([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!isConfigured) setShowSettings(true)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text) => {
    if (!isConfigured) {
      setShowSettings(true)
      return
    }

    const userMessage = { role: 'user', content: text }
    const assistantMessage = { role: 'assistant', content: '', isStreaming: true }
    const allMessages = [...messages, userMessage]
    setMessages([...allMessages, assistantMessage])
    setIsStreaming(true)

    let fullContent = ''

    try {
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl,
          apiKey,
          model: selectedModel,
          messages: allMessages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      })

      // HTTP 错误（非 200）
      if (!res.ok) {
        let errBody = ''
        try { errBody = await res.text() } catch {}
        throw new Error(`HTTP ${res.status}${errBody ? ': ' + errBody.substring(0, 300) : ''}`)
      }

      if (!res.body) throw new Error('响应体为空')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data:')) continue

          const data = line.slice(5).trim()
          if (data === '[DONE]') continue

          try {
            const chunk = JSON.parse(data)

            if (chunk.error) {
              fullContent += `[错误] ${chunk.error.message || JSON.stringify(chunk.error)}`
            } else if (chunk.choices?.[0]?.delta?.content) {
              fullContent += chunk.choices[0].delta.content
            }

            setMessages((prev) => {
              const updated = [...prev]
              updated[updated.length - 1] = {
                role: 'assistant',
                content: fullContent,
                isStreaming: true,
              }
              return updated
            })
          } catch {}
        }
      }

      // 流结束
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: fullContent || '(空回复)',
          isStreaming: false,
        }
        return updated
      })
    } catch (e) {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `[请求失败] ${e.message}`,
          isStreaming: false,
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header onOpenSettings={() => setShowSettings(true)} />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 py-20">
              <svg className="w-16 h-16 mb-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-500">FlexChat</p>
              <p className="text-sm mt-1">开始与 AI 对话吧</p>
            </div>
          ) : (
            messages.map((msg, i) => <ChatMessage key={i} message={msg} />)
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput onSend={handleSend} disabled={isStreaming} />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}