import { mockQuestions } from './mockData'

export const matchApi = {
  getMatchQuestions: (city) => {
    return new Promise((resolve) => {
      const matched = mockQuestions.filter(q => q.city === city)
      setTimeout(() => resolve(matched), 300)
    })
  }
}