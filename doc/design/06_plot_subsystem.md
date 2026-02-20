# 情节管理子系统设计文档

## 1. 子系统概述

情节管理子系统负责预设情节和自定义情节的管理，为故事生成提供情节框架。

## 2. 功能模块

### 2.1 预设情节模块

#### 2.1.1 预设情节列表

| 情节ID | 情节名称 | 情节描述 | 适用场景 |
|--------|----------|----------|----------|
| plot_adventure | 冒险之旅 | 主人公踏上未知旅程 | 冒险故事 |
| plot_mystery | 神秘谜团 | 发现并解开谜题 | 悬疑故事 |
| plot_friendship | 友谊考验 | 朋友间的互助与成长 | 友情故事 |
| plot_hero | 英雄救美 | 拯救被困之人 | 英雄故事 |
| plot_treasure | 寻宝探险 | 寻找珍贵宝藏 | 冒险故事 |
| plot_magic | 魔法奇遇 | 遇到神奇魔法 | 魔法故事 |
| plot_space | 太空冒险 | 星际探索之旅 | 科幻故事 |
| plot_competition | 竞技比赛 | 参加激烈比赛 | 竞技故事 |

#### 2.1.2 获取预设情节列表
- 函数名：`getPresetPlots()`
- 输入：无
- 输出：预设情节列表
- 流程：
  1. 返回预设情节数组

### 2.2 自定义情节模块

#### 2.2.1 验证自定义情节
- 函数名：`validateCustomPlot(plotText)`
- 输入：情节描述文本
- 输出：有效/无效
- 规则：
  - 长度：最多100字
  - 不含敏感词
  - 内容健康

#### 2.2.2 处理自定义情节
- 函数名：`processCustomPlot(plotText)`
- 输入：情节描述文本
- 输出：处理后的情节描述
- 流程：
  1. 去除首尾空格
  2. 敏感词过滤
  3. 返回处理结果

### 2.3 语音输入模块

#### 2.3.1 语音转文字
- 函数名：`speechToText(audioBlob)`
- 输入：音频数据
- 输出：文字内容
- 流程：
  1. 验证音频格式
  2. 调用语音识别API
  3. 返回识别结果

#### 2.3.2 录音控制
- 开始录音：`startRecording()`
- 停止录音：`stopRecording()`
- 获取录音状态：`getRecordingStatus()`

## 3. 预设数据

### 3.1 预设情节数据

```javascript
const PRESET_PLOTS = [
    {
        id: 'plot_adventure',
        name: '冒险之旅',
        description: '主人公踏上未知旅程',
        scene: '冒险故事'
    },
    {
        id: 'plot_mystery',
        name: '神秘谜团',
        description: '发现并解开谜题',
        scene: '悬疑故事'
    },
    {
        id: 'plot_friendship',
        name: '友谊考验',
        description: '朋友间的互助与成长',
        scene: '友情故事'
    },
    {
        id: 'plot_hero',
        name: '英雄救美',
        description: '拯救被困之人',
        scene: '英雄故事'
    },
    {
        id: 'plot_treasure',
        name: '寻宝探险',
        description: '寻找珍贵宝藏',
        scene: '冒险故事'
    },
    {
        id: 'plot_magic',
        name: '魔法奇遇',
        description: '遇到神奇魔法',
        scene: '魔法故事'
    },
    {
        id: 'plot_space',
        name: '太空冒险',
        description: '星际探索之旅',
        scene: '科幻故事'
    },
    {
        id: 'plot_competition',
        name: '竞技比赛',
        description: '参加激烈比赛',
        scene: '竞技故事'
    }
];
```

## 4. API接口设计

### 4.1 获取预设情节列表
```
GET /api/plots/preset
Response:
{
  "success": true,
  "plots": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "scene": "string"
    }
  ]
}
```

### 4.2 语音识别
```
POST /api/speech
Request: FormData with audio file
Response:
{
  "success": true,
  "text": "string"
}
```

## 5. 语音输入功能实现

### 5.1 前端录音组件

```javascript
class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async stopRecording() {
        return new Promise((resolve) => {
            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.isRecording = false;
                
                const formData = new FormData();
                formData.append('audio', audioBlob);
                
                const response = await fetch('/api/speech', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                resolve(result);
            };
            
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        });
    }

    getRecordingStatus() {
        return this.isRecording;
    }
}
```

### 5.2 语音识别API (functions/api/speech.js)

```javascript
export async function onRequestPost(context) {
    try {
        const formData = await context.request.formData();
        const audioFile = formData.get('audio');
        
        if (!audioFile) {
            return new Response(JSON.stringify({
                success: false,
                error: '没有收到音频文件'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const siliconflowApiKey = context.env.SILICONFLOW_API_KEY;

        const audioFormData = new FormData();
        audioFormData.append('model', 'FunAudioLLM/SenseVoiceSmall');
        audioFormData.append('file', audioFile);

        const response = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${siliconflowApiKey}`
            },
            body: audioFormData
        });

        if (!response.ok) {
            const errorData = await response.json();
            return new Response(JSON.stringify({
                success: false,
                error: errorData.error?.message || '语音识别失败'
            }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const data = await response.json();
        
        return new Response(JSON.stringify({
            success: true,
            text: data.text || ''
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Speech recognition error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: '语音识别服务错误'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
```

## 6. 情节选择界面设计

### 6.1 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                    情节选择步骤                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 预设情节区域（卡片展示）                               │   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │ │冒险之旅 │ │神秘谜团 │ │友谊考验 │ │英雄救美 │   │   │
│  │ │         │ │         │ │         │ │         │   │   │
│  │ │主人公踏 │ │发现并解 │ │朋友间的 │ │拯救被困 │   │   │
│  │ │上未知旅 │ │开谜题   │ │互助与成 │ │之人     │   │   │
│  │ │程       │ │         │ │长       │ │         │   │   │
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │ │寻宝探险 │ │魔法奇遇 │ │太空冒险 │ │竞技比赛 │   │   │
│  │ │         │ │         │ │         │ │         │   │   │
│  │ │寻找珍贵 │ │遇到神奇 │ │星际探索 │ │参加激烈 │   │   │
│  │ │宝藏     │ │魔法     │ │之旅     │ │比赛     │   │   │
│  │ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 自定义情节区域                                         │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ [请输入自定义情节描述（最多100字）____________] │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │ [🎤 语音输入]                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [上一步]                                        [生成故事] │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 语音输入按钮状态

```
正常状态：[🎤 语音输入]
录音中： [🔴 录音中... 点击停止]
处理中： [⏳ 识别中...]
```

## 7. 敏感词过滤

### 7.1 敏感词列表
```javascript
const SENSITIVE_WORDS = [
    '暴力', '血腥', '恐怖', '死亡', '杀人',
    '毒品', '赌博', '色情', '诈骗'
];
```

### 7.2 过滤函数
```javascript
function filterSensitiveWords(text) {
    let filteredText = text;
    SENSITIVE_WORDS.forEach(word => {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
    });
    return filteredText;
}
```

## 8. 错误处理

| 错误码 | 说明 |
|--------|------|
| PLOT_001 | 情节描述超过100字 |
| PLOT_002 | 情节包含敏感词 |
| PLOT_003 | 语音识别失败 |
| PLOT_004 | 录音权限被拒绝 |
| PLOT_005 | 音频格式不支持 |

## 9. 文件结构

```
functions/
├── api/
│   ├── speech.js           - 语音识别API
│   └── plots/
│       └── preset.js       - 预设情节API
├── services/
│   ├── plotValidator.js    - 情节验证服务
│   └── sensitiveFilter.js  - 敏感词过滤服务
└── constants/
    └── plots.js            - 预设情节常量
```
