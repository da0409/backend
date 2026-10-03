// src/services/mock/sessionApi.ts
// 依据 docs/API.md SessionApi：
// - 第一阶段当前用户由演示会话提供
// - 从 IndexedDB 读固定 demo self user

import type { SessionApi, User } from '../contracts'
import { notFoundError } from '../contracts'
import { getOne } from '../../db'
import { STORE_USERS } from '../../db/schema'
import { DEMO_SELF_USER_ID } from '../../mocks/fixtures'

export const sessionApi: SessionApi = {
  async getCurrentUser(): Promise<User> {
    const user = await getOne<User>(STORE_USERS, DEMO_SELF_USER_ID)
    if (!user) {
      // bootstrap 没跑或数据被误删
      throw notFoundError('演示用户不存在，请重置演示数据')
    }
    return user
  },
}