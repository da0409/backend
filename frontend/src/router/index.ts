// src/router/index.ts
// 依据 docs/TECHNICAL.md 第 5 节的路由表。
// 保留已验收的入口和九个既定路由；尚未实现的页面继续使用占位页。

import { createRouter, createWebHistory } from 'vue-router'
import { isRestMode } from '../services'

const routes = [
  { path: '/', redirect: '/discover' },
  {
    path: '/discover',
    name: 'Discover',
    component: () => import('../pages/DiscoverPage.vue'),
  },
  {
    path: '/questions/new',
    name: 'QuestionCreate',
    component: () => import('../pages/QuestionCreatePage.vue'),
  },
  {
    path: '/questions/new/preview',
    name: 'QuestionPreview',
    component: () => import('../pages/QuestionPreviewPage.vue'),
  },
  {
    path: '/explore',
    name: 'Explore',
    beforeEnter: () => isRestMode ? '/discover' : true,
    component: () => import('../views/Explore.vue'),
  },
  {
    path: '/trips',
    name: 'Trips',
    component: () => import('../pages/TripsPage.vue'),
  },
  {
    path: '/trips/new',
    name: 'TripCreate',
    component: () => import('../pages/TripCreatePage.vue'),
  },
  {
    path: '/questions/:id',
    name: 'QuestionDetail',
    component: () => import('../pages/QuestionDetailPage.vue'),
  },
  {
    path: '/questions/:id/answer',
    name: 'AnswerQuestion',
    component: () => import('../views/Answer.vue'),
  },
  {
    path: '/me',
    name: 'Me',
    component: () => import('../pages/MePage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
