<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header>
      <nav>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/live2d">Live2D</RouterLink>
        <RouterLink to="/about">关于</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>
  </div>
</template>

<style>
.app {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background-color: #f8f9fa;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
}

nav {
  display: flex;
  gap: 1.5rem;
}

nav a {
  color: #333;
  text-decoration: none;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: #e9ecef;
}

nav a.router-link-active {
  color: #3490dc;
  background-color: #e9ecef;
}

main {
  flex: 1;
  position: relative;
  overflow: hidden;
}
</style>
