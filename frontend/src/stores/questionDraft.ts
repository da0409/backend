import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CreateQuestionInput, DemoScenarioSummary } from '../services/contracts'

function emptyDraft(): CreateQuestionInput {
  return {
    title: '',
    description: '',
    referenceAssetId: '',
    location: { cityCode: '', cityName: '', poiId: '', poiName: '' },
    answerWindow: { startDate: '', endDate: '' },
    shootingGuide: '',
  }
}

export const useQuestionDraftStore = defineStore('questionDraft', () => {
  const draft = ref<CreateQuestionInput>(emptyDraft())
  const previewReady = ref(false)
  const errors = ref<Record<string, string>>({})

  function useScenario(scenario: DemoScenarioSummary): void {
    draft.value = {
      ...scenario.template,
      location: { ...scenario.template.location },
      answerWindow: { ...scenario.template.answerWindow },
      demoScenarioId: scenario.id,
    }
    previewReady.value = false
    errors.value = {}
  }

  function reset(): void {
    draft.value = emptyDraft()
    previewReady.value = false
    errors.value = {}
  }

  function clearError(field: string): void {
    delete errors.value[field]
  }

  return { draft, previewReady, errors, useScenario, reset, clearError }
})
