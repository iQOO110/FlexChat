export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-3 px-4 py-3 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* 头像 */}
      <div className="flex-shrink-0">
        {isUser ? (
          // 用户头像 — 人像
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        ) : (
          // AI 头像 — 机器人
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <circle cx="8.5" cy="16" r="1" fill="currentColor" />
              <circle cx="15.5" cy="16" r="1" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>

      {/* 消息气泡 */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-800 rounded-tl-sm'
          }`}
        >
          {message.content}
          {/* 流式输出时显示闪烁光标 */}
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 cursor-blink" />
          )}
        </div>
      </div>
    </div>
  )
}