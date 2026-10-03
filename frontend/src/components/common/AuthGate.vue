<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { isRestMode, services, isApiError } from '../../services'
import { useSessionStore } from '../../stores/session'
import { useActiveTripStore } from '../../stores/activeTrip'
import { useQuestionDraftStore } from '../../stores/questionDraft'

const ready = ref(!isRestMode)
const checking = ref(isRestMode)
const busy = ref(false)
const register = ref(false)
const username = ref('')
const password = ref('')
const nickname = ref('')
const error = ref('')
const session = useSessionStore()
const trip = useActiveTripStore()
const draft = useQuestionDraftStore()
function expired() {
  ready.value = false
  session.clear(); trip.clear()
  error.value = '登录已过期，请重新登录'
}
onMounted(async () => {
  window.addEventListener('session-expired', expired)
  try {
    if (isRestMode && services.session.hasSession?.()) {
      await services.session.getCurrentUser()
      ready.value = true
    }
  } catch (e) { error.value = isApiError(e) ? e.message : '登录状态读取失败' }
  finally { checking.value = false }
})
onBeforeUnmount(() => window.removeEventListener('session-expired', expired))
async function submit() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    if (register.value) await services.session.register!(username.value, password.value, nickname.value)
    else await services.session.login!(username.value, password.value)
    password.value = ''
    session.clear(); trip.clear(); draft.reset()
    ready.value = true
  } catch (e) { error.value = isApiError(e) ? e.message : '登录失败，请重试' }
  finally { busy.value = false }
}
async function logout() {
  if (busy.value) return
  busy.value = true
  try { await services.session.logout?.() }
  catch (e) { error.value = isApiError(e) ? e.message : '退出请求失败，本机会话已清除' }
  finally { session.clear(); trip.clear(); draft.reset(); ready.value = false; busy.value = false }
}
</script>

<template>
  <p v-if="checking" class="auth-panel">正在确认登录状态…</p>
  <template v-else-if="ready">
    <div v-if="isRestMode" class="session-bar">
      <span>已连接后端 · 问题与回信保存至服务器</span>
      <button type="button" :disabled="busy" @click="logout">退出登录</button>
    </div>
    <slot />
  </template>
  <main v-else class="auth-panel">
    <h1>后来呢？</h1>
    <p>登录后，发布你的时间问题，或带回一封远方回信。</p>
    <form @submit.prevent="submit">
      <label>用户名<input v-model="username" autocomplete="username" required minlength="3" maxlength="64" pattern="[a-zA-Z0-9_]{3,64}" placeholder="字母、数字或下划线" /></label>
      <label v-if="register">昵称<input v-model="nickname" autocomplete="nickname" required maxlength="64" /></label>
      <label>密码<input v-model="password" type="password" :autocomplete="register ? 'new-password' : 'current-password'" required minlength="8" maxlength="64" /></label>
      <p v-if="error" role="alert">{{ error }}</p>
      <button :disabled="busy" type="submit">{{ busy ? '正在处理…' : register ? '注册并登录' : '登录' }}</button>
      <button :disabled="busy" type="button" @click="register = !register; error = ''">{{ register ? '已有账号，去登录' : '没有账号，去注册' }}</button>
    </form>
  </main>
</template>

<style scoped>
.auth-panel { max-width: 430px; margin: 40px auto; padding: 24px; }
form, label { display: grid; gap: 10px; } form { gap: 20px; }
input, button { min-height: 44px; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; }
button { background: #2563eb; color: white; cursor: pointer; }
[role=alert] { color: #b91c1c; } button:disabled { opacity: .6; }
.session-bar { display: flex; justify-content: space-between; align-items: center; padding: 6px 16px; background: #eff6ff; font-size: 12px; }
.session-bar button { background: white; color: #2563eb; }
</style>
