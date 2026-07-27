export const config = {
  maxDuration: 60,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } })
  }

  // 兼容 Vercel 不同 Node 版本的 body 解析
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }

  const { baseUrl, apiKey, model, messages } = body || {}

  if (!baseUrl || !apiKey || !model || !messages) {
    return res.status(200).json({
      error: { message: 'baseUrl, apiKey, model, messages 不能为空' },
    })
  }

  // 拼接上游 URL
  const url = baseUrl.replace(/\/+$/, '') + '/chat/completions'

  try {
    const upstreamRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    })

    // 上游返回错误 — 以 SSE 格式下发错误信息
    if (!upstreamRes.ok) {
      let errMsg = `上游返回 ${upstreamRes.status}`
      try {
        const errText = await upstreamRes.text()
        const errJson = JSON.parse(errText)
        errMsg = errJson?.error?.message || errText || errMsg
      } catch {}

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.write(`data: ${JSON.stringify({ error: { message: errMsg } })}\n\n`)
      res.end()
      return
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    })

    // 逐块读取上游响应并写入客户端
    const reader = upstreamRes.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(decoder.decode(value, { stream: true }))
    }

    res.end()
  } catch (e) {
    // 确保在出错时也以 SSE 格式返回
    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      })
    }
    res.write(`data: ${JSON.stringify({ error: { message: e.message } })}\n\n`)
    res.end()
  }
}