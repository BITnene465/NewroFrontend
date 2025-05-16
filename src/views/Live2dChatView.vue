<script setup lang="ts">
import { Config, Live2DSprite, LogLevel } from 'easy-live2d'
import { Application, Ticker } from 'pixi.js'
import { onMounted, onUnmounted, ref, reactive } from 'vue'

// 聊天相关类型定义
interface ChatMessage {
  id: number
  text: string
  sender: 'user' | 'character'
  timestamp: Date
}

const canvasRef = ref<HTMLCanvasElement>()
const app = new Application()
const showChatHistory = ref(false)
const messageInput = ref('')
const chatHistory = reactive<ChatMessage[]>([])
const characterName = ref('日和')

// 设置 Config 默认配置
Config.MotionGroupIdle = 'Idle' // 设置默认的空闲动作组
Config.MouseFollow = false // 禁用鼠标跟随
Config.CubismLoggingLevel = LogLevel.LogLevel_Off // 设置日志级别

// 创建Live2D人物 并初始化
const live2DSprite = new Live2DSprite()
live2DSprite.init({
  modelPath: '/Resources/Hiyori/Hiyori.model3.json',
  ticker: Ticker.shared,
})

// 添加用户消息
const addUserMessage = (text: string) => {
  if (!text.trim()) return
  
  const message: ChatMessage = {
    id: Date.now(),
    text,
    sender: 'user',
    timestamp: new Date()
  }
  
  chatHistory.push(message)
  messageInput.value = ''
  
  // 模拟角色回复（实际项目中可以连接到后端API获取回复）
  setTimeout(() => {
    // 随机选择一个表情
    const expressions = ['F01', 'F02', 'F03']
    const randomExpression = expressions[Math.floor(Math.random() * expressions.length)]
    live2DSprite.setExpression({ expressionId: randomExpression })
    
    // 随机动作
    live2DSprite.startMotion({ group: 'Idle', no: 0, priority: 3 })
    
    // 模拟回复
    const replies = [
      `嗯...我觉得这个问题很有趣呢～`,
      `真的吗？我还是第一次听说呢！`,
      `啊哈哈，你说得对！`,
      `唔...我不太明白你的意思...`,
      `今天天气真好呢！`,
    ]
    const randomReply = replies[Math.floor(Math.random() * replies.length)]
    addCharacterMessage(randomReply)
  }, 1000)
}

// 添加角色消息
const addCharacterMessage = (text: string) => {
  const message: ChatMessage = {
    id: Date.now(),
    text,
    sender: 'character',
    timestamp: new Date()
  }
  chatHistory.push(message)
}

// 切换历史记录显示状态
const toggleChatHistory = () => {
  showChatHistory.value = !showChatHistory.value
}

// 格式化时间
const formatTime = (date: Date) => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

onMounted(async () => {
  await app.init({
    view: canvasRef.value,
    backgroundAlpha: 0, // 如果需要透明，可以设置alpha为0
  })
  if (canvasRef.value) {
    live2DSprite.width = canvasRef.value.clientWidth * window.devicePixelRatio
    live2DSprite.height = canvasRef.value.clientHeight * window.devicePixelRatio
    app.stage.addChild(live2DSprite)
    
    // 初始表情和动作
    live2DSprite.setExpression({
      expressionId: 'F01',
    })
    
    live2DSprite.startMotion({
      group: 'Idle',
      no: 0,
      priority: 3,
    })
    
    // 添加一条欢迎消息
    addCharacterMessage(`你好呀！我是${characterName.value}，很高兴认识你！`)
  }
})

onUnmounted(() => {
  // 释放实例
  live2DSprite.destroy()
})
</script>

<template>
  <div class="live2d-chat">
    <canvas
      id="live2d"
      ref="canvasRef"
    />
    
    <!-- Galgame 风格聊天框 -->
    <div class="chat-container">
      <div class="chat-dialog">
        <div class="speaker-name" v-if="chatHistory.length > 0">
          {{ chatHistory[chatHistory.length - 1].sender === 'character' ? characterName : '玩家' }}
        </div>
        <div class="dialog-text" v-if="chatHistory.length > 0">
          {{ chatHistory[chatHistory.length - 1].text }}
        </div>
      </div>
      
      <!-- 输入框 -->
      <div class="input-container">
        <input 
          v-model="messageInput" 
          @keyup.enter="addUserMessage(messageInput)"
          placeholder="输入消息..." 
          type="text" 
          class="message-input"
        />
        <button @click="addUserMessage(messageInput)" class="send-button">发送</button>
      </div>
      
      <!-- 历史记录按钮 -->
      <button class="history-toggle" @click="toggleChatHistory">
        {{ showChatHistory ? '隐藏历史' : '查看历史' }}
      </button>
    </div>
    
    <!-- 历史记录面板 -->
    <div 
      class="history-panel" 
      :class="{ 'history-panel-visible': showChatHistory }"
    >
      <div class="history-header">
        <h3>对话历史</h3>
        <button @click="toggleChatHistory" class="close-button">×</button>
      </div>
      <div class="history-messages">
        <div 
          v-for="message in chatHistory" 
          :key="message.id" 
          class="history-message"
          :class="{ 'user-message': message.sender === 'user', 'character-message': message.sender === 'character' }"
        >
          <div class="message-header">
            <span class="message-sender">{{ message.sender === 'character' ? characterName : '玩家' }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-content">{{ message.text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
#live2d {
  position: relative;
  top: 0%;
  right: 0%;
  width: 100%;
  height: 100%;
}

.live2d-chat {
  display: inline-block;
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #f0f8ff;
  overflow: hidden;
}

/* 聊天框样式 */
.chat-container {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 800px;
  z-index: 10;
}

.chat-dialog {
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 10px;
  color: white;
  min-height: 100px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
}

.speaker-name {
  color: #ffcc00;
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 1.2em;
}

.dialog-text {
  font-size: 1.1em;
  line-height: 1.5;
}

/* 输入框样式 */
.input-container {
  display: flex;
  margin-bottom: 10px;
}

.message-input {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 5px 0 0 5px;
  font-size: 1em;
  background-color: rgba(255, 255, 255, 0.9);
}

.send-button {
  padding: 10px 20px;
  background-color: #4a86e8;
  color: white;
  border: none;
  border-radius: 0 5px 5px 0;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s;
}

.send-button:hover {
  background-color: #3a76d8;
}

/* 历史记录按钮 */
.history-toggle {
  position: absolute;
  right: 0;
  top: -40px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 5px 5px 0 0;
  padding: 8px 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.history-toggle:hover {
  background-color: rgba(0, 0, 0, 0.9);
}

/* 历史记录面板 */
.history-panel {
  position: absolute;
  top: 0;
  right: -400px;
  width: 350px;
  height: 100%;
  background-color: rgba(240, 240, 240, 0.95);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  transition: right 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.history-panel-visible {
  right: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #4a86e8;
  color: white;
}

.history-header h3 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
}

.history-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.history-message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  max-width: 85%;
}

.user-message {
  background-color: #e1f5fe;
  margin-left: auto;
}

.character-message {
  background-color: #f5f5f5;
  margin-right: auto;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 0.85em;
}

.message-sender {
  font-weight: bold;
}

.message-time {
  color: #888;
}

.message-content {
  line-height: 1.4;
}
</style>
