// src/mocks/fixtures/demoStories.ts
// 依据 docs/PRODUCT.md 第 6 节与 FR-33 ~ FR-39：
// - 第一阶段只做一套完整可演示的预制故事
// - 预制故事锁定地点和参照照片
// - 未来回信只由用户主动触发

import type { DemoScenarioSummary } from '../../services/contracts/types'
import { DEMO_QUESTION_XUYUAN_ID, demoQuestions } from './demoQuestions'

export const DEMO_SCENARIO_XUYUAN_ID = 'sc_xuyuan'

const xuyuanQuestion = demoQuestions.find((q) => q.id === DEMO_QUESTION_XUYUAN_ID)
if (!xuyuanQuestion) {
  throw new Error('预制故事缺少许愿树问题模板')
}

export const demoScenarios: DemoScenarioSummary[] = [
  {
    id: DEMO_SCENARIO_XUYUAN_ID,
    title: '许愿树上的木牌',
    cityName: xuyuanQuestion.location.cityName,
    poiName: xuyuanQuestion.location.poiName,
    windowHint: '次年春天',
    template: {
      title: xuyuanQuestion.title,
      description: xuyuanQuestion.description,
      referenceAssetId: xuyuanQuestion.referenceAssetId,
      location: { ...xuyuanQuestion.location },
      answerWindow: { ...xuyuanQuestion.answerWindow },
      shootingGuide: xuyuanQuestion.shootingGuide,
    },
  },
]
