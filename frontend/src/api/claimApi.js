export const claimApi = {
  claimQuestion: (questionId) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ success: true, message: '任务已领取' }), 300)
    })
  },
  submitAnswer: (answerData) => {
    return new Promise((resolve) => {
      console.log('提交的回答数据：', answerData)
      setTimeout(() => resolve({ success: true }), 500)
    })
  }
}