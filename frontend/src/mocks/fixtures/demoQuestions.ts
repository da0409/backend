// src/mocks/fixtures/demoQuestions.ts
// 依据 docs/PRODUCT.md FR-01、FR-07 与 docs/TECHNICAL.md 第 6 节：
// - 全国发现流用固定 curationOrder
// - 城市用稳定 cityCode，不比较展示名
// - 每条问题都必须有一个 referenceAssetId（对应 demoAssets 里预置的图）

import type { Question } from '../../services/contracts/types'
import {
  DEMO_USER_A_ID,
  DEMO_USER_B_ID,
  DEMO_USER_C_ID,
} from './demoUsers'

export const DEMO_QUESTION_XUYUAN_ID = 'q_demo_xuyuan'
export const DEMO_QUESTION_ALLEY_ID = 'q_demo_alley'
export const DEMO_QUESTION_BRIDGE_ID = 'q_demo_bridge'
export const DEMO_QUESTION_TREE_ID = 'q_demo_tree'
export const DEMO_QUESTION_MINE_ID = 'q_demo_mine_self'

export const demoQuestions: Question[] = [
  {
    id: DEMO_QUESTION_XUYUAN_ID,
    authorId: DEMO_USER_A_ID,
    title: '这棵许愿树上的木牌还在吗？',
    description:
      '2026 年春天我在树下挂了一块写着自己名字的木牌，想请后来的人帮我看看它还在不在。',
    referenceAssetId: 'a_demo_xuyuan_ref',
    location: {
      cityCode: '310100',
      cityName: '上海',
      poiId: 'poi_xuyuan_sh',
      poiName: '静安公园许愿树',
      latitude: 31.2263,
      longitude: 121.4465,
    },
    answerWindow: { startDate: '2027-03-01', endDate: '2027-05-31' },
    shootingGuide: '请从正南方向拍一张整棵树的照片，木牌集中在东侧枝条。',
    demoScenarioId: 'sc_xuyuan',
    curationOrder: 1,
    createdAt: '2026-04-15T10:00:00+08:00',
  },
  {
    id: DEMO_QUESTION_ALLEY_ID,
    authorId: DEMO_USER_B_ID,
    title: '老巷口那家修鞋铺还在吗？',
    description:
      '小时候家门口有个修鞋铺，老板姓王，店面很小。后来听说那片要拆了，想看看现在还在不在。',
    referenceAssetId: 'a_demo_alley_ref',
    location: {
      cityCode: '310100',
      cityName: '上海',
      poiId: 'poi_alley_sh',
      poiName: '虹口老弄堂',
      latitude: 31.2534,
      longitude: 121.4921,
    },
    answerWindow: { startDate: '2027-01-01', endDate: '2027-12-31' },
    shootingGuide: '顺着巷口往里走，右手边第二家。',
    curationOrder: 2,
    createdAt: '2026-05-02T09:30:00+08:00',
  },
  {
    id: DEMO_QUESTION_BRIDGE_ID,
    authorId: DEMO_USER_C_ID,
    title: '断桥边的柳树有没有被修剪过？',
    description:
      '去年冬天在断桥边拍过一棵歪向湖面的柳树，想知道它现在长什么样了。',
    referenceAssetId: 'a_demo_bridge_ref',
    location: {
      cityCode: '330100',
      cityName: '杭州',
      poiId: 'poi_bridge_hz',
      poiName: '西湖断桥',
      latitude: 30.2587,
      longitude: 120.1449,
    },
    answerWindow: { startDate: '2027-02-01', endDate: '2027-04-30' },
    shootingGuide: '从桥北侧往南拍，能拍到柳树和远山。',
    curationOrder: 3,
    createdAt: '2026-06-10T16:00:00+08:00',
  },
  {
    id: DEMO_QUESTION_TREE_ID,
    authorId: DEMO_USER_A_ID,
    title: '故宫角楼那棵老槐树还在吗？',
    description: '2019 年拍过一张角楼配槐树的照片，不知道现在树还在不在。',
    referenceAssetId: 'a_demo_tree_ref',
    location: {
      cityCode: '110100',
      cityName: '北京',
      poiId: 'poi_jiaolou_bj',
      poiName: '故宫角楼',
      latitude: 39.9286,
      longitude: 116.3975,
    },
    answerWindow: { startDate: '2027-05-01', endDate: '2027-10-31' },
    curationOrder: 4,
    createdAt: '2026-07-01T11:00:00+08:00',
  },
  {
    id: DEMO_QUESTION_MINE_ID,
    authorId: 'u_demo_self',
    title: '我自己发的测试问题（演示）',
    description:
      '这是当前演示用户自己发的一条问题，用来验证「不能领取自己的问题」这条规则。',
    referenceAssetId: 'a_demo_self_ref',
    location: {
      cityCode: '310100',
      cityName: '上海',
      poiId: 'poi_self_sh',
      poiName: '演示地点',
      latitude: 31.2304,
      longitude: 121.4737,
    },
    answerWindow: { startDate: '2027-01-01', endDate: '2027-12-31' },
    curationOrder: 5,
    createdAt: '2026-08-01T12:00:00+08:00',
  },
]