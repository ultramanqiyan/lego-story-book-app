export async function onRequestPost(context) {
  try {
    const { image, prompt } = await context.request.json()

    const seedreamApiKey = context.env.SEEDREAM_API_KEY || 'ee51832f-f233-45ec-9262-00e1d2a66ba1'

    const payload = {
      model: "doubao-seedream-4-0-250828",
      prompt: prompt,
      image: image,
      sequential_image_generation: "disabled",
      response_format: "url",
      size: "1024x1024",
      stream: false,
      watermark: false
    }

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seedreamApiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return new Response(JSON.stringify({
        success: false,
        error: errorData.error?.message || 'API调用失败'
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const imageUrl = data.data[0].url

    return new Response(JSON.stringify({
      success: true,
      imageUrl: imageUrl
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: '服务器错误，请重试'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
