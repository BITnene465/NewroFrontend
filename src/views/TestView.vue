<script setup lang="ts">
// ================= 导入依赖 =================
import { Application } from 'pixi.js'
import * as PIXI from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display/cubism4'
import { onMounted, onUnmounted, ref } from 'vue'

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

// ================= 数据定义 =================
const canvasRef = ref<HTMLDivElement>() // 改为div元素引用
const app = new Application({
  antialias: true,
  backgroundColor: 0x000000,
  backgroundAlpha: 0,
  // 关于渲染质量(目前没有定义 devicePixelRatio)
  resolution:  window.devicePixelRatio || 2,
})
let live2DModel: any = null


// 测试功能区
const testStatus = ref('等待初始化')
const expressionIndex = ref(0)
const motionIndex = ref(0)
const expressionList = ['exp_01', 'exp_02', 'exp_03', 'exp_04', 'exp_05', 'exp_06', 'exp_07', 'exp_08']
const motionGroups = ['Idle',"TapBody"]

// 口型测试参数
const lipSyncInput = ref('')
const isLipSyncPlaying = ref(false)
const lipSyncFrames = ref<any[]>([])
const lipSyncTimer = ref<number | null>(null)
const currentLipSyncFrame = ref(0)

// 口型参数ID
const mouthParams = ['ParamA', 'ParamI', 'ParamU', 'ParamE', 'ParamO']

// ================= 测试功能函数 =================
/**
 * 解析口型帧数据
 * @returns 是否解析成功
 */
const parseLipSyncData = () => {
  try {
    // 清除之前的数据
    lipSyncFrames.value = []
    // 解析输入文本，格式: 每行一个帧 "a,i,u,e,o"，值范围0-1
    const lines = lipSyncInput.value.trim().split('\n')
    lines.forEach(line => {
      if (line.trim()) {
        const values = line.split(',').map(v => parseFloat(v.trim()))
        // 确保有5个值，不足的补0
        while (values.length < 5) {
          values.push(0)
        }
        // 限制值在0-1范围内
        const frame = values.map(v => Math.max(0, Math.min(1, v)))
        lipSyncFrames.value.push(frame)
      }
    })
    
    testStatus.value = `口型数据已解析: ${lipSyncFrames.value.length}帧`
    return true
  } catch (error) {
    testStatus.value = `口型数据解析错误: ${error}`
    console.error('口型数据解析错误:', error)
    return false
  }
}

/**
 * 应用口型帧到模型
 * @param frameIndex 帧索引
 */
const applyLipSyncFrame = (frameIndex: number) => {
  if (!lipSyncFrames.value.length || frameIndex >= lipSyncFrames.value.length) return
  
  const frame = lipSyncFrames.value[frameIndex]
  
  // 将值应用到相应的口型参数
  if (live2DModel && live2DModel.internalModel) {
    frame.forEach((value: number, index: number) => {
      if (index < mouthParams.length) {
        try {
          // 在pixi-live2d-display中设置参数值的方法
          live2DModel.internalModel.coreModel.setParameterValueById(mouthParams[index], value)
        } catch (e) {
          console.error(`设置口型参数 ${mouthParams[index]} 失败:`, e)
        }
      }
    })
  }
}

/**
 * 开始口型动画
 */
const startLipSync = () => {
  if (isLipSyncPlaying.value) return
  
  if (!parseLipSyncData() || lipSyncFrames.value.length === 0) {
    testStatus.value = '无有效口型数据'
    return
  }
  
  currentLipSyncFrame.value = 0
  isLipSyncPlaying.value = true
  testStatus.value = '正在播放口型动画'
  
  // 每帧更新口型参数
  lipSyncTimer.value = window.setInterval(() => {
    applyLipSyncFrame(currentLipSyncFrame.value)
    
    currentLipSyncFrame.value++
    if (currentLipSyncFrame.value >= lipSyncFrames.value.length) {
      currentLipSyncFrame.value = 0 // 循环播放
    }
  }, 60)
}

/**
 * 停止口型动画
 */
const stopLipSync = () => {
  if (lipSyncTimer.value) {
    clearInterval(lipSyncTimer.value)
    lipSyncTimer.value = null
  }
  
  // 重置所有口型参数为0
  if (live2DModel && live2DModel.internalModel) {
    mouthParams.forEach(param => {
      try {
        live2DModel.internalModel.coreModel.setParameterValueById(param, 0)
      } catch (e) {
        console.error(`重置口型参数 ${param} 失败:`, e)
      }
    })
  }
  
  isLipSyncPlaying.value = false
  testStatus.value = '口型动画已停止'
}

/**
 * 切换表情的函数
 */
const changeExpression = () => {
  if (!live2DModel) {
    testStatus.value = '模型未加载'
    return
  }
  // 检查模型是否有表情管理器
  if (live2DModel.internalModel.motionManager.expressionManager) {
    const expressions = live2DModel.internalModel.motionManager.expressionManager.definitions
    if (expressions && expressions.length > 0) {
      // 尝试使用提供的表情名称
      const expressionId = expressionList[expressionIndex.value]
      testStatus.value = `设置表情: ${expressionId}`
      try {
        live2DModel.expression(expressionId)
        console.log(`设置表情: ${expressionId}`)
      } catch (e) {
        console.error('设置表情失败:', e)
        // 尝试使用模型自带的第一个表情
        if (expressions.length > 0) {
          const firstExpression = expressions[0].Name || expressions[0].name
          try {
            live2DModel.expression(firstExpression)
            testStatus.value = `使用可用表情: ${firstExpression}`
          } catch (err) {
            console.error('设置备选表情也失败:', err)
            testStatus.value = '表情设置失败'
          }
        }
      }
    } else {
      testStatus.value = '模型不包含表情定义'
    }
  } else {
    testStatus.value = '模型不支持表情'
  }
  
  expressionIndex.value = (expressionIndex.value + 1) % expressionList.length
}

/**
 * 切换动作的函数
 */
const playMotion = () => {
  if (!live2DModel) {
    testStatus.value = '模型未加载'
    return
  }
  // 检查动作组
  const motionDefinitions = live2DModel.internalModel.motionManager.definitions
  if (motionDefinitions) {
    // 尝试使用指定的动作组
    const group = motionGroups[motionIndex.value % motionGroups.length]
    const no = Math.floor(Math.random() *motionIndex.value)
    
    try {
      live2DModel.motion("TapBody" ,5, 3)
      testStatus.value = `播放动作: ${group}-${no}`
      console.log(`播放动作: ${group}-${no}`)
    } catch (e) {
      console.error(`播放动作组 ${group} 失败:`, e)
      
      // 尝试使用模型的第一个可用动作组
      if (Object.keys(motionDefinitions).length > 0) {
        const firstGroup = Object.keys(motionDefinitions)[0]
        try {
          live2DModel.motion(firstGroup, 0, 3)
          testStatus.value = `使用可用动作组: ${firstGroup}`
        } catch (err) {
          console.error('播放备选动作也失败:', err)
          testStatus.value = '动作播放失败'
        }
      }
    }
  } else {
    testStatus.value = '模型不包含动作定义'
  }
  
  motionIndex.value = (motionIndex.value + 1) % 4
}

// ================= 生命周期钩子 =================
/**
 * 组件挂载时的初始化
 */
onMounted(async () => {
  if (!canvasRef.value) return
  
  try {
    testStatus.value = '初始化PIXI...'
    // 调整应用大小
    app.renderer.resize(canvasRef.value.clientWidth, canvasRef.value.clientHeight)
    // 将 PixiJS 生成的 canvas 添加到我们的 div 容器中
    canvasRef.value.appendChild(app.view as HTMLCanvasElement)
    // 设置 canvas 样式
    const canvas = app.view as HTMLCanvasElement
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    
    // 加载Live2D模型
    testStatus.value = '加载Live2D模型...'
    live2DModel = await Live2DModel.from('/Resources/Mao/Mao.model3.json', {
      autoInteract: false, // 禁用自动交互
      autoUpdate: true,    // 自动更新
    })
    
    if (!live2DModel) {
      throw new Error('模型加载失败')
    }
    
    // 设置模型尺寸和位置
    const canvasWidth = canvasRef.value.clientWidth
    const canvasHeight = canvasRef.value.clientHeight
    
    // 计算适合的缩放比例
    const scale = Math.min(
      canvasWidth / live2DModel.width,
      canvasHeight / live2DModel.height
    )
    
    live2DModel.scale.set(scale)
    
    // 将模型居中
    live2DModel.x = canvasWidth / 2
    live2DModel.y = canvasHeight
    live2DModel.anchor.set(0.5, 1.0) // 设置锚点为底部中心
    
    // 添加到舞台
    app.stage.addChild(live2DModel)
    
    // 输出模型可用的动作组和表情
    console.log('模型已加载:', live2DModel)
    console.log('可用动作组:', live2DModel.internalModel.motionManager.definitions)
    console.log('可用表情:', live2DModel.internalModel.motionManager.expressionManager?.definitions)
    
    // 尝试设置初始表情和动作
    try {
      if (live2DModel.internalModel.motionManager.expressionManager) {
        const expressions = live2DModel.internalModel.motionManager.expressionManager.definitions
        if (expressions && expressions.length > 0) {
          const firstExpression = expressions[0].Name || expressions[0].name
          live2DModel.expression(firstExpression)
        }
      }
      
      // 尝试播放初始动作
      const motionDefinitions = live2DModel.internalModel.motionManager.definitions
      if (motionDefinitions && Object.keys(motionDefinitions).length > 0) {
        const firstGroup = Object.keys(motionDefinitions)[0]
        live2DModel.motion(firstGroup, 0, 1)
      }
      
      testStatus.value = '模型加载完成!'
    } catch (e) {
      console.error('设置初始表情/动作失败:', e)
      testStatus.value = '模型加载完成，但初始化表情/动作失败'
    }
  } catch (error) {
    testStatus.value = `错误: ${error}`
    console.error('Live2D模型加载失败:', error)
  }
})

/**
 * 组件卸载时清理资源
 */
onUnmounted(() => {
  // 停止口型动画
  stopLipSync()
  
  // 清理模型资源
  if (live2DModel) {
    live2DModel.destroy()
    live2DModel = null
  }
  
  // 销毁PIXI应用
  app.destroy(true)
})
</script>

<template>
  <div class="test-view">
    <div class="test-header">
      <h1>🧪 Live2D测试页面</h1>
      <div class="test-status">
        状态: <span :class="{ 'success': testStatus === '模型加载完成!' }">{{ testStatus }}</span>
      </div>
    </div>
    
    <div class="test-content">
      <div class="live2d-container">
        <div ref="canvasRef" id="testLive2d"></div>
      </div>
      
      <div class="test-controls">
        <div class="control-panel">
          <h2>Live2D控制面板</h2>
          
          <div class="control-section">
            <h3>表情控制</h3>
            <button @click="changeExpression" class="test-button">
              切换表情 (当前: {{ expressionList[expressionIndex] }})
            </button>
          </div>
          
          <div class="control-section">
            <h3>动作控制</h3>
            <button @click="playMotion" class="test-button">
              播放动作
            </button>
          </div>
          
          <!-- 口型测试区域 -->
          <div class="control-section">
            <h3>口型测试</h3>
            <div class="lip-sync-description">
              <p>输入格式：每行一个帧，每帧5个参数用逗号分隔 (a,i,u,e,o)，值范围0-1</p>
              <p>示例：<button @click="lipSyncInput='0.3,0,0,0,0\n0,0.3,0,0,0\n0,0,0.3,0,0\n0,0,0,0.3,0\n0,0,0,0,0.3'" class="example-button">加载示例</button></p>
            </div>
            
            <textarea 
              v-model="lipSyncInput" 
              class="lip-sync-input" 
              placeholder="请输入口型数据，如：0.5,0,0,0,0"
              :disabled="isLipSyncPlaying"
            ></textarea>
            
            <div class="lip-sync-controls">
              <button 
                @click="startLipSync" 
                class="test-button"
                :class="{ 'disabled': isLipSyncPlaying }"
                :disabled="isLipSyncPlaying"
              >
                开始口型动画
              </button>
              
              <button 
                @click="stopLipSync" 
                class="test-button stop-button"
                :class="{ 'disabled': !isLipSyncPlaying }"
                :disabled="!isLipSyncPlaying"
              >
                停止口型动画
              </button>
            </div>
            
            <div class="lip-sync-info" v-if="lipSyncFrames.length > 0">
              <p>帧总数：{{ lipSyncFrames.length }}</p>
              <p v-if="isLipSyncPlaying">当前帧：{{ currentLipSyncFrame + 1 }}</p>
            </div>
          </div>
          
          <div class="info-panel">
            <h3>开发信息</h3>
            <p>这是一个仅在开发环境可见的测试页面，用于测试Live2D功能。</p>
            <p>此页面不会包含在生产构建中</p>
            <p class="dev-note">⚠️ 仅开发环境可见</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.test-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
}

.test-header {
  background-color: #1a1a2e;
  color: white;
  padding: 1rem;
  text-align: center;
}

.test-header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.test-status {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #ddd;
}

.test-status .success {
  color: #4caf50;
  font-weight: bold;
}

.test-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.live2d-container {
  flex: 2;
  position: relative;
  background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%);
}

#testLive2d {
  position: absolute;
  width: 100%;
  height: 100%;
}

.test-controls {
  flex: 1;
  min-width: 300px;
  background-color: #f8f9fa;
  padding: 1rem;
  overflow-y: auto;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
}

.control-panel {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.control-panel h2 {
  margin-top: 0;
  color: #16213e;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.control-section {
  margin-bottom: 2rem;
}

.control-section h3 {
  font-size: 1.1rem;
  color: #0f3460;
  margin-bottom: 1rem;
}

.test-button {
  width: 100%;
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.8rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-bottom: 0.5rem;
}

.test-button:hover {
  background-color: #3a56d4;
}

.info-panel {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.info-panel h3 {
  color: #e94560;
  margin-top: 0;
}

.info-panel p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #555;
}

.dev-note {
  font-weight: bold;
  color: #e94560 !important;
  margin-top: 1rem !important;
}

/* 口型测试相关样式 */
.lip-sync-description {
  font-size: 0.85rem;
  margin-bottom: 0.8rem;
  color: #555;
  background-color: #f5f5f5;
  padding: 0.8rem;
  border-radius: 4px;
}

.lip-sync-description p {
  margin: 0.3rem 0;
}

.lip-sync-input {
  width: 100%;
  height: 120px;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  resize: vertical;
  margin-bottom: 1rem;
}

.lip-sync-controls {
  display: flex;
  gap: 8px;
}

.lip-sync-controls .test-button {
  flex: 1;
}

.stop-button {
  background-color: #e94560;
}

.stop-button:hover {
  background-color: #d63d55;
}

.test-button.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.lip-sync-info {
  margin-top: 1rem;
  font-size: 0.85rem;
  color: #555;
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.lip-sync-info p {
  margin: 0.2rem 0;
}

.example-button {
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 0.3rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
}

.example-button:hover {
  background-color: #43a047;
}

@media (max-width: 768px) {
  .test-content {
    flex-direction: column;
  }
  
  .live2d-container {
    flex: 1;
    min-height: 50%;
  }
  
  .test-controls {
    min-width: auto;
  }
  
  .lip-sync-controls {
    flex-direction: column;
  }
}
</style>