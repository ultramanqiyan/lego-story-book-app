export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData()
    const audioFile = formData.get('audio')
    
    if (!audioFile) {
      return new Response(JSON.stringify({
        success: false,
        error: '没有收到音频文件'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const siliconflowApiKey = context.env.SILICONFLOW_API_KEY || 'sk-zisdkmqynswnsnikguvbkegwyunykggaenzekxocuukeaotz'

    const audioFormData = new FormData()
    audioFormData.append('model', 'FunAudioLLM/SenseVoiceSmall')
    audioFormData.append('file', audioFile)

    const response = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${siliconflowApiKey}`
      },
      body: audioFormData
    })

    if (!response.ok) {
      const errorData = await response.json()
      return new Response(JSON.stringify({
        success: false,
        error: errorData.error?.message || '语音识别失败'
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    
    return new Response(JSON.stringify({
      success: true,
      text: data.text || ''
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Speech recognition error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: '语音识别服务错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
