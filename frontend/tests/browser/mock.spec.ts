import { test, expect } from '@playwright/test'
test.skip(process.env.E2E_MODE !== 'mock', 'Mock regression requires dev:mock')
test('Mock remains isolated and supports discovery, trips and my content', async ({ page }) => {
  const apiRequests: string[] = []
  const errors: string[] = []
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/v1/')) apiRequests.push(request.url()) })
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/discover')
  await expect(page.locator('.question-list')).toBeVisible()
  await expect(page.getByRole('button', { name: '退出登录' })).toHaveCount(0)
  await page.goto('/trips')
  await page.getByRole('button', { name: '载入模拟行程', exact: true }).click()
  await expect(page.locator('.trip-list')).toBeVisible()
  await page.goto('/me')
  await expect(page.getByRole('button', { name: /重置演示数据/ })).toBeVisible()
  expect(apiRequests).toEqual([])
  expect(errors).toEqual([])
})
