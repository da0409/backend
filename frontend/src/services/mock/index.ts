// src/services/mock/index.ts
// 依据 docs/TECHNICAL.md 第 3 节：
// 页面和 Store 只允许通过 services/contracts 暴露的接口访问数据。
// 本文件把所有 Mock Adapter 聚合成一个 AppServices 对象。

import type { AppServices } from '../contracts'

import { sessionApi } from './sessionApi'
import { questionApi } from './questionApi'
import { tripApi } from './tripApi'
import { matchApi } from './matchApi'
import { claimApi } from './claimApi'
import { answerApi } from './answerApi'
import { assetApi } from './assetApi'
import { demoApi } from './demoApi'

export const mockServices: AppServices = {
  session: sessionApi,
  question: questionApi,
  trip: tripApi,
  match: matchApi,
  claim: claimApi,
  answer: answerApi,
  asset: assetApi,
  demo: demoApi,
}

export type MockServices = typeof mockServices