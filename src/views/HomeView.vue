<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const modelOptions = ref([
  { id: 'hiyori', name: '日和', path: '/Resources/Hiyori/Hiyori.model3.json' },
  { id: 'haru', name: '春', path: '/Resources/Haru/Haru.model3.json' },
  { id: 'mao', name: '茅', path: '/Resources/Mao/Mao.model3.json' },
  { id: 'rice', name: '莉西', path: '/Resources/Rice/Rice.model3.json' },
  { id: 'mark', name: '马克', path: '/Resources/Mark/Mark.model3.json' },
]);

const selectedModel = ref(modelOptions.value[0]);

function navigateToLive2d() {
  // TODO 跳转到Live2D页面时，可以考虑如何传递所选模型信息
  router.push('/live2d');
}
</script>

<template>
  <div class="home-container">
    <h1>AI VTuber Demo</h1>
    
    <div class="features-section">
      <div class="feature-card">
        <h2>Live2D 模型</h2>
        <p>基于 Live2D 和 pixi.js 的虚拟形象展示</p>
        <div class="model-selector">
          <div 
            v-for="model in modelOptions" 
            :key="model.id"
            class="model-option"
            :class="{ active: selectedModel.id === model.id }"
            @click="selectedModel = model"
          >
            {{ model.name }}
          </div>
        </div>
        <button class="primary-btn" @click="navigateToLive2d">开始体验</button>
      </div>
      
      <div class="feature-card">
        <h2>AI 聊天</h2>
        <p>与 AI 虚拟形象实时互动交流</p>
        <div class="chat-preview">
          <div class="chat-message ai">你好！我是你的AI助手</div>
          <div class="chat-message user">你能做什么？</div>
          <div class="chat-message ai">我可以回答问题、讲故事或者只是陪你聊天~</div>
        </div>
      </div>
    </div>
    
    <div class="about-section">
      <h2>关于本项目</h2>
      <p>本项目旨在结合 Live2D 模型和人工智能，创建一个可交互的虚拟伙伴。</p>
      <p>技术栈: Vue3 + TypeScript + Easy-Live2D</p>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  color: #333;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #3490dc;
  font-size: 2.5rem;
}

.features-section {
  display: flex;
  gap: 2rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.feature-card {
  flex: 1;
  min-width: 300px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  transition: transform 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h2 {
  color: #3490dc;
  margin-bottom: 1rem;
}

.model-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1rem 0;
}

.model-option {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.model-option.active {
  background-color: #3490dc;
  color: white;
  border-color: #3490dc;
}

.model-option:hover:not(.active) {
  background-color: #f0f0f0;
}

.primary-btn {
  background-color: #3490dc;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s;
}

.primary-btn:hover {
  background-color: #2779bd;
}

.chat-preview {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
}

.chat-message {
  padding: 0.75rem;
  border-radius: 1rem;
  margin-bottom: 0.75rem;
  max-width: 80%;
}

.chat-message.ai {
  background-color: #e9ecef;
  align-self: flex-start;
  margin-right: auto;
}

.chat-message.user {
  background-color: #3490dc;
  color: white;
  align-self: flex-end;
  margin-left: auto;
}

.about-section {
  background-color: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
}

.about-section h2 {
  color: #3490dc;
  margin-bottom: 1rem;
}
</style>