export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 405, message: 'Method Not Allowed' })
  }

  const { baseUrl, apiKey } = req.body

  if (!baseUrl || !apiKey) {
    return res.status(200).json({ code: 400, message: 'baseUrl 和 apiKey 不能为空' })
  }

  try {
    const url = baseUrl.replace(/\/+$/, '') + '/models'

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      let errMsg = `上游返回 ${response.status}`
      try {
        const errBody = await response.json()
        errMsg = errBody?.error?.message || errMsg
      } catch {}
      return res.status(200).json({ code: 500, message: errMsg })
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