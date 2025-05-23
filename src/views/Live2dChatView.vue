<script setup lang="ts">
// ================= 导入依赖 =================
import { Application } from 'pixi.js'
import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display/cubism4'
import { onMounted, onUnmounted, ref, reactive } from 'vue'
import { WebSocketService, type WSMessage } from '../services/WebSocketService'
import { AudioService } from '../services/AudioService'

// ================= Live2D 初始化 =================
// 确保PIXI能访问全局变量，以供pixi-live2d-display使用
window.PIXI = PIXI as any;
// 声明全局变量类型
declare global {
  interface Window {
    PIXI: typeof PIXI;
    Live2DCubismCore: any;
  }
}
// 检查 Live2DCubismCore 是否已加载
if (typeof window.Live2DCubismCore === "object") {
  console.log("Live2DCubismCore 已加载");
} else {
  console.error("Live2DCubismCore 未加载，请检查 index.html 中的脚本引入");
}
// 设置模型的默认配置
Live2DModel.registerTicker(PIXI.Ticker)

// 设置 Live2D 模型的默认配置
let modelPath = '/Resources/Hiyori/Hiyori.model3.json'

// ================= 数据定义 =================
// 聊天消息类型定义
interface ChatMessage {
  id: number
  text: string
  sender: 'user' | 'character'
  timestamp: Date
  hasAudio?: boolean
  audioData?: string
}

// 引用和状态变量
const canvasRef = ref<HTMLDivElement>() // 改为 div 元素引用
const showChatHistory = ref(false)
const messageInput = ref('')
const chatHistory = reactive<ChatMessage[]>([])
const characterName = ref('日和')
const isMuted = ref(true) // 默认静音状态
let live2dModel: any = null // Live2D模型实例

// ================= PIXI 应用 =================
const app = new Application({
  antialias: true, // 抗锯齿
  backgroundColor: 0x000000, // 背景色
  backgroundAlpha: 0, // 透明背景
})

// ================= 服务实例 =================
// 创建 WebSocket 和音频服务实例
const sessionId = 'webtest0721' // 用于存储会话ID, 目前使用唯一sessionID进行测试
const wsService = new WebSocketService('ws://localhost:8765', sessionId, true, 20000)
const audioService = new AudioService()

// ================= 音频事件回调 =================
// 设置音频播放开始事件回调
audioService.onPlay = () => {
  // 播放说话动作
  if (live2dModel) {
    // 使用正确的动作组名，确保与模型文件一致
    live2dModel.motion('Idle', 1, 3);
  }
}

audioService.onEnded = () => {
  // 播放默认动作
  if (live2dModel) {
    // 使用正确的动作 API，设置为"Idle"组的动作，优先级较低
    live2dModel.motion('Idle', 0, 1);
  }
}

// ================= WebSocket 消息处理 =================
// 设置WebSocket消息处理回调
wsService.onMessage = (message: WSMessage) => {
  console.log('收到WebSocket消息:', message)
  
  switch (message.type) {
    case 'ai_response':
      if (message.payload.text) {
        if (message.payload.audio) {
          // 如果同时收到了文本和语音，先显示文本
          handleCharacterAudioResponse(message.payload.audio.audio_data, message.payload.text)
        } else {
          // 只收到文本
          handleCharacterTextResponse(message.payload.text)
        }
      }
      break
      
    case 'system_status':
      // 处理系统消息
      break
      
    default:
      console.warn('未知的消息类型:', message.type)
  }
}

// ================= 消息处理函数 =================
/**
 * 处理角色文本回复
 * @param text 文本内容
 */
const handleCharacterTextResponse = (text: string) => {
  // 设置随机表情 - 确保表情存在
  if (live2dModel && live2dModel.internalModel.motionManager.expressionManager) {
    const expressions = live2dModel.internalModel.motionManager.expressionManager.definitions;
    
    // 如果有表情定义
    if (expressions && expressions.length > 0) {
      // 随机选择一个表情
      const randomIndex = Math.floor(Math.random() * expressions.length);
      const expressionName = expressions[randomIndex].Name || expressions[randomIndex].name || 'F01';
      
      try {
        // 使用正确的表情名称
        live2dModel.expression(expressionName);
        console.log(`设置表情: ${expressionName}`);
      } catch (e) {
        console.error('设置表情失败:', e);
      }
    }
    
    // 播放随机动作 - 使用模型中可用的动作组
    const motionDefinitions = live2dModel.internalModel.motionManager.definitions;
    if (motionDefinitions && Object.keys(motionDefinitions).length > 0) {
      // 尝试使用第一个可用的动作组
      const firstGroup = Object.keys(motionDefinitions)[0];
      try {
        live2dModel.motion(firstGroup, 0, 1);
        console.log(`使用动作组 ${firstGroup} 播放动作`);
      } catch (e) {
        console.error('播放动作失败:', e);
      }
    }
  } else if (live2dModel) {
    console.warn('模型不支持表情或动作');
  }
  
  // 添加角色消息到聊天历史
  addCharacterMessage(text);
}

/**
 * 处理角色语音回复
 * @param audioBase64 Base64编码的音频数据
 * @param text 可选的文本内容
 */
const handleCharacterAudioResponse = (audioBase64: string, text?: string) => {
  // 如果同时收到了文本和语音，先显示文本
  if (text) {
    addCharacterMessage(text, true, audioBase64)
  } else { // 这种情况不会出现
    addCharacterMessage('[语音消息]', true, audioBase64)
  }
  // 只有在非静音状态下才自动播放语音
  if (!isMuted.value) {
    playAudio(audioBase64)
  }
}

/**
 * 播放Base64编码的音频
 * @param audioBase64 Base64编码的音频数据
 * @param audio_format 音频格式，默认为wav
 */
const playAudio = (audioBase64: string, audio_format: string = 'wav') => {
  audioService.playAudio(audioBase64, audio_format)
}

/**
 * 切换静音状态
 */
const toggleMute = () => {
  isMuted.value = !isMuted.value
  if (isMuted.value && audioService.isPlaying.value) {
    // 如果切换到静音状态且当前正在播放音频，则停止播放
    audioService.stopAudio()
  }
}

/**
 * 添加用户消息
 * @param text 消息文本
 */
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
  
  // 通过WebSocket发送消息到后端
  if (wsService.isConnected.value) {
    wsService.send('text_input', { text })
  } else {
    console.warn('WebSocket未连接，使用本地模拟回复')
    // 如果WebSocket未连接，使用本地模拟回复（保留原有功能作为备用）
    setTimeout(() => {
      // 随机选择一个表情
      const expressions = ['F01', 'F02', 'F03']
      const randomExpression = expressions[Math.floor(Math.random() * expressions.length)]
      
      if (live2dModel) {
        // 设置表情
        live2dModel.expression(randomExpression);
        // 播放随机动作，设置低优先级
        live2dModel.motion('Idle', 0, 1);
      }
      
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
}

/**
 * 添加角色消息
 * @param text 消息文本
 * @param hasAudio 是否包含音频
 * @param audioData 可选的音频数据
 */
const addCharacterMessage = (text: string, hasAudio = false, audioData = '') => {
  const message: ChatMessage = {
    id: Date.now(),
    text,
    sender: 'character',
    timestamp: new Date(),
    hasAudio,
    audioData
  }
  chatHistory.push(message)
}

/**
 * 切换历史记录显示状态
 */
const toggleChatHistory = () => {
  showChatHistory.value = !showChatHistory.value
}

/**
 * 格式化时间
 * @param date 日期对象
 * @returns 格式化后的时间字符串 (HH:MM)
 */
const formatTime = (date: Date) => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// ================= 生命周期钩子 =================
/**
 * 组件挂载时的处理逻辑
 */
onMounted(async () => {
  if (canvasRef.value) {
    // 调整应用大小
    app.renderer.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight);
    
    // 将 PixiJS 生成的 canvas 添加到我们的 div 容器中
    canvasRef.value.appendChild(app.view as HTMLCanvasElement);
    
    // 设置 canvas 样式
    const canvas = app.view as HTMLCanvasElement;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    
    try {
      // 设置舞台大小和视图
      app.renderer.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight);
      // 加载模型
      live2dModel = await Live2DModel.from(modelPath, {
        autoInteract: false, // 禁用自动交互
        autoUpdate: true, // 自动更新
      });
      
      if (!live2dModel) {
        throw new Error('模型加载失败');
      }
      
      // 设置模型尺寸和位置
      const canvasWidth = canvasRef.value.clientWidth;
      const canvasHeight = canvasRef.value.clientHeight;
      
      // 计算适合的缩放比例
      const scale = Math.min(
        canvasWidth / live2dModel.width, 
        canvasHeight / live2dModel.height
      );
      
      live2dModel.scale.set(scale);
      
      // 将模型居中
      live2dModel.x = canvasWidth / 2;
      live2dModel.y = canvasHeight;
      live2dModel.anchor.set(0.5, 1.0); // 设置锚点为底部中心
      
      // 添加模型到舞台
      app.stage.addChild(live2dModel);
      
      // 打印模型信息
      console.log('模型已加载:', live2dModel);
      console.log('可用动作组:', live2dModel.internalModel.motionManager.definitions);
      console.log('可用表情:', live2dModel.internalModel.motionManager.expressionManager?.definitions);
      
      // 初始化 WebSocket 连接
      wsService.connect();
      // 添加一条欢迎消息
      addCharacterMessage(`你好呀！我是${characterName.value}，很高兴认识你！`);
    } catch (error) {
      console.error('加载模型时出错:', error);
    }
  }
})

onUnmounted(() => {
  // 关闭 WebSocket 连接
  wsService.disconnect()
  // 停止音频播放
  audioService.destroy()
  // 释放 Live2D 实例
  if (live2dModel) {
    live2dModel.destroy()
    live2dModel = null
  }
  
  // 销毁PIXI应用程序
  app.destroy(true)
})
</script>

<template>
  <div class="live2d-chat">
    <div
      id="live2d-container"
      ref="canvasRef"
      class="live2d-container"
    ></div>
    
    <!-- 连接状态指示器 - 移到左上角 -->
    <div class="connection-status" :class="{ 'connected': wsService.isConnected.value }">
      {{ wsService.isConnected.value ? '已连接' : '未连接' }}
    </div>
    
    <!-- 静音按钮 -->
    <div class="mute-button" @click="toggleMute">
      <span v-if="isMuted">🔇</span>
      <span v-else>🔊</span>
    </div>
    
    <!-- Galgame 风格聊天框 -->
    <div class="chat-container">
      <div class="chat-dialog">
        <div class="speaker-name" v-if="chatHistory.length > 0">
          {{ chatHistory[chatHistory.length - 1].sender === 'character' ? characterName : 'player' }}
        </div>
        <div class="dialog-text" v-if="chatHistory.length > 0">
          {{ chatHistory[chatHistory.length - 1].text }}
          <!-- 语音播放按钮 -->
          <button 
            v-if="chatHistory[chatHistory.length - 1].hasAudio && chatHistory[chatHistory.length - 1].audioData" 
            @click="playAudio(chatHistory[chatHistory.length - 1].audioData as string)" 
            class="audio-play-button"
            :class="{ 'playing': audioService.isPlaying.value }"
          >
            <span v-if="audioService.isPlaying.value">🔊</span>
            <span v-else>🔈</span>
          </button>
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
          <div class="message-content">
            {{ message.text }}
            <button 
              v-if="message.hasAudio && message.audioData" 
              @click="playAudio(message.audioData as string)" 
              class="audio-play-button-small"
            >
              🔈
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.live2d-container {
  position: relative;
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
}

.live2d-chat {
  display: inline-block;
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: #f0f8ff;
  overflow: hidden;
}

/* 连接状态指示器 - 移到左上角 */
.connection-status {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px 10px;
  border-radius: 15px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  font-size: 12px;
  z-index: 100;
  transition: background-color 0.3s ease;
}

.connection-status.connected {
  background-color: rgba(0, 128, 0, 0.7);
}

/* 静音按钮样式 */
.mute-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s;
}

.mute-button:hover {
  background-color: rgba(0, 0, 0, 0.9);
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 音频播放按钮 */
.audio-play-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: #4a86e8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 10px;
  transition: all 0.3s;
}

.audio-play-button:hover {
  background-color: #3a76d8;
}

.audio-play-button.playing {
  animation: pulse 1.5s infinite;
}

.audio-play-button-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background-color: #4a86e8;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 5px;
  font-size: 0.8em;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
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

/* 历史记录面板 - 提高z-index确保在最上层 */
.history-panel {
  position: absolute;
  top: 0;
  right: -400px;
  width: 350px;
  height: 100%;
  background-color: rgba(240, 240, 240, 0.95);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2);
  transition: right 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 200; /* 提高z-index确保在最上层 */
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
  display: flex;
  align-items: center;
}
</style>
