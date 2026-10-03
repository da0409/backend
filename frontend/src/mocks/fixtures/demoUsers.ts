// src/mocks/fixtures/demoUser.ts
// 依据 docs/PRODUCT.md 第 2 节和 docs/API.md 第 2 节：
// - 当前演示用户，固定 ID
// - 明确 isDemo: true
// - 不得写入真实姓名、邮箱或任何个人隐私数据

import type { User } from '../../services/contracts/types'

export const DEMO_SELF_USER_ID = 'u_demo_self'

export const demoSelfUser: User = {
  id: DEMO_SELF_USER_ID,
  nickname: '我（演示用户）',
  isDemo: true,
  createdAt: '2026-09-24T00:00:00+08:00',
}

/** 其他预置用户，用于让「不能领取自己的问题」和「多人领取」可演示 */
export const DEMO_USER_A_ID = 'u_demo_alice'
export const DEMO_USER_B_ID = 'u_demo_bob'
export const DEMO_USER_C_ID = 'u_demo_carol'

export const demoOtherUsers: User[] = [
  {
    id: DEMO_USER_A_ID,
    nickname: '许愿牌的主人（演示）',
    isDemo: true,
    createdAt: '2026-09-20T00:00:00+08:00',
  },
  {
    id: DEMO_USER_B_ID,
    nickname: '老巷邻居（演示）',
    isDemo: true,
    createdAt: '2026-09-21T00:00:00+08:00',
  },
  {
    id: DEMO_USER_C_ID,
    nickname: '旅行者 Carol（演示）',
    isDemo: true,
    createdAt: '2026-09-22T00:00:00+08:00',
  },
]

export const demoAllUsers: User[] = [demoSelfUser, ...demoOtherUsers]