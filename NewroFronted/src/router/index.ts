import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Live2dChatView from '../views/Live2dChatView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
        },
        {
            path: '/live2d',
            name: 'live2d',
            component: Live2dChatView,
        },
        {
            path: '/about',
            name: 'about',
            // 懒加载关于页面
            component: () => import('../views/AboutView.vue'),
        },
        
        
        // 测试视图 - 仅在开发环境中可用
        ...(import.meta.env.DEV
            ? [{
                path: '/test',
                name: 'test',
                component: () => import('../views/TestView.vue')
            }]
            : [])
    ],
})

export default router