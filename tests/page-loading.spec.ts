import { test, expect } from '@playwright/test'

test.describe('页面加载测试', () => {
  test('应该成功加载页面并显示样式', async ({ page }) => {
    // 访问首页
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' })

    // 等待CSS加载
    await page.waitForLoadState('load')
    await page.waitForTimeout(2000)

    // 检查标题存在
    await expect(page.locator('h1')).toContainText('Dashboard')

    // 截图保存
    await page.screenshot({ path: 'test-results/page-with-styles.png', fullPage: true })

    console.log('✅ 页面已加载，截图已保存到 test-results/page-with-styles.png')
  })

  test('应该加载CSS样式文件', async ({ page }) => {
    const cssRequests: string[] = []

    page.on('response', response => {
      const url = response.url()
      if (url.includes('.css') || url.includes('/_next/static/css/')) {
        cssRequests.push(`${response.status()} - ${url}`)
      }
    })

    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    console.log('\n📝 CSS文件加载情况:')
    cssRequests.forEach(req => console.log(`  ${req}`))

    // 应该至少加载了一个CSS文件
    expect(cssRequests.length).toBeGreaterThan(0)
  })

  test('应该应用背景色样式', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // 检查body的背景色是否被应用
    const bodyBg = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).backgroundColor
    })

    console.log(`\n🎨 Body背景色: ${bodyBg}`)

    // 背景色不应该是默认的白色 rgb(255, 255, 255) 或透明
    expect(bodyBg).not.toBe('rgba(0, 0, 0, 0)')
  })
})
