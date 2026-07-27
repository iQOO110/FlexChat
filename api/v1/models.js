export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ code: 405, message: 'Method Not Allowed' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }

  const { baseUrl, apiKey } = body || {}

  if (!baseUrl || !apiKey) {
    return res.status(200).json({ code: 400, message: 'baseUrl 和 apiKey 不能为空' })
  }

  const url = baseUrl.replace(/\/+$/, '') + '/models'

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'FlexChat/1.0',
      },
    })

    if (!response.ok) {
      let errMsg = `上游返回 ${response.status}`
      try {
        const errText = await response.text()
        const errJson = JSON.parse(errText)
        errMsg = errJson?.error?.message || errText.substring(0, 200) || errMsg
      } catch {
        try {
          const raw = await response.text()
          if (raw) errMsg = raw.substring(0, 200)
        } catch {}
      }
      return res.status(200).json({ code: response.status, message: errMsg })
    }

    const data = await response.json()
    const models = (data.data || [])
      .map((m) => m.id)
      .filter(Boolean)

    return res.status(200).json({ code: 200, data: models })
  } catch (e) {
    return res.status(200).json({ code: 500, message: e.message })
  }
}
