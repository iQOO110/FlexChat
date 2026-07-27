function isBlocked(res, contentType) {
  if (contentType.includes('text/html')) return true
  if (res.status === 403) return true
  return false
}

export async function fetchModels(baseUrl, apiKey) {
  // ===== 第1步：Vercel Serverless 代理 =====
  try {
    const res = await fetch('/api/v1/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, apiKey }),
    })

    const contentType = res.headers.get('content-type') || ''

    if (!isBlocked(res, contentType) && contentType.includes('application/json')) {
      const json = await res.json()
      if (json.code === 200 && Array.isArray(json.data) && json.data.length > 0) {
        return { success: true, data: json.data }
      }
      if (!json.fallback && json.code !== 200) {
        return { success: false, error: json.message || `错误码: ${json.code}` }
      }
    }
  } catch (e) {
    // 代理不可达，进入直连
  }

  // ===== 第2步：浏览器直连上游 =====
  const url = baseUrl.replace(/\/+$/, '') + '/models'
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!res.ok) {
    let errMsg = `返回 ${res.status}`
    try {
      const errText = await res.text()
      const errJson = JSON.parse(errText)
      errMsg = errJson?.error?.message || errText.substring(0, 200) || errMsg
    } catch {}
    return { success: false, error: errMsg }
  }

  const data = await res.json()
  const models = (data.data || []).map((m) => m.id).filter(Boolean)
  return { success: true, data: models }
}

export async function fetchChat(baseUrl, apiKey, model, messages) {
  const msgPayload = messages.map((m) => ({ role: m.role, content: m.content }))

  // ===== 第1步：Vercel Serverless 代理 =====
  try {
    const res = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, apiKey, model, messages: msgPayload, stream: true }),
    })

    const contentType = res.headers.get('content-type') || ''

    if (!isBlocked(res, contentType)) {
      if (contentType.includes('text/event-stream')) {
        return { response: res }
      }
      if (contentType.includes('application/json')) {
        const json = await res.json()
        if (json.fallback) {
          // 上游拦截，进入直连
        } else if (json.error) {
          throw new Error(json.error.message)
        }
      }
    }
  } catch (e) {
    if (!e.message?.includes('fetch')) throw e
  }

  // ===== 第2步：浏览器直连上游 =====
  const url = baseUrl.replace(/\/+$/, '') + '/chat/completions'
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages: msgPayload, stream: true }),
  })

  if (!res.ok) {
    let errMsg = `返回 ${res.status}`
    try {
      const errText = await res.text()
      const errJson = JSON.parse(errText)
      errMsg = errJson?.error?.message || errText.substring(0, 300) || errMsg
    } catch {}
    throw new Error(errMsg)
  }

  return { response: res }
}
