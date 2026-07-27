export const config = {
  maxDuration: 60,
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } })
  }

  const { baseUrl, apiKey, model, messages } = req.body

  if (!baseUrl || !apiKey || !model || !messages) {
    return res.status(200).json({
      error: { message: 'baseUrl, apiKey, model, messages 不能为空' },
    })
  }

  try {
    const url const url