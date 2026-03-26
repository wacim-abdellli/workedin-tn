import { test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

type LocaleConfig = {
  code: 'ar' | 'en'
  dir: 'rtl' | 'ltr'
}

type ViewportConfig = {
  name: 'desktop' | 'mobile'
  width: number
  height: number
}

type RouteConfig = {
  name: string
  path: string
}

type SnapshotMetric = {
  locale: string
  expectedDir: string
  actualDir: string
  viewport: string
  route: string
  path: string
  hasHorizontalOverflow: boolean
}

const locales: LocaleConfig[] = [
  { code: 'ar', dir: 'rtl' },
  { code: 'en', dir: 'ltr' },
]

const viewports: ViewportConfig[] = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

const routes: RouteConfig[] = [
  { name: 'home', path: '/' },
  { name: 'job-board', path: '/jobs' },
  { name: 'find-freelancers', path: '/find-freelancers' },
  { name: 'search-results', path: '/search?q=design&type=all' },
  { name: 'for-clients', path: '/for-clients' },
  { name: 'how-it-works', path: '/how-it-works' },
]

test.describe('Phase 11 visual baseline capture', () => {
  test.describe.configure({ timeout: 5 * 60 * 1000 })

  test('captures LTR/RTL desktop/mobile snapshots and writes metrics report', async ({ browser }, testInfo) => {
    testInfo.setTimeout(5 * 60 * 1000)

    const stamp = new Date().toISOString().slice(0, 10)
    const root = path.join(process.cwd(), 'artifacts', 'visual-regression', stamp)
    const metrics: SnapshotMetric[] = []

    await mkdir(root, { recursive: true })

    for (const viewport of viewports) {
      for (const locale of locales) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        })

        await context.addInitScript(
          ({ lang }) => {
            localStorage.setItem('i18n-language', lang)
            localStorage.setItem('language', lang)
          },
          { lang: locale.code }
        )

        const page = await context.newPage()

        for (const route of routes) {
          await page.goto(route.path, { waitUntil: 'domcontentloaded' })
          await page.waitForLoadState('networkidle')

          // Freeze transient animations for deterministic baselines.
          await page.addStyleTag({
            content: `
              *, *::before, *::after {
                animation: none !important;
                transition: none !important;
                caret-color: transparent !important;
              }
            `,
          })

          await page
            .waitForFunction(
              (expectedDir) => document.documentElement.dir === expectedDir,
              locale.dir,
              { timeout: 5000 }
            )
            .catch(() => {
              // Keep collecting artifacts even when direction parity fails.
            })

          await page.waitForTimeout(150)

          const actualDir = await page.evaluate(() => document.documentElement.dir || 'ltr')
          const hasHorizontalOverflow = await page.evaluate(() => {
            const doc = document.documentElement
            const body = document.body
            return doc.scrollWidth > doc.clientWidth || body.scrollWidth > doc.clientWidth
          })

          const screenshotDir = path.join(root, viewport.name, locale.code)
          await mkdir(screenshotDir, { recursive: true })

          const filePath = path.join(screenshotDir, `${route.name}.png`)
          await page.screenshot({ path: filePath, fullPage: false })

          metrics.push({
            locale: locale.code,
            expectedDir: locale.dir,
            actualDir,
            viewport: viewport.name,
            route: route.path,
            path: path.relative(process.cwd(), filePath).replaceAll('\\\\', '/'),
            hasHorizontalOverflow,
          })
        }

        await context.close()
      }
    }

    const reportPath = path.join(root, 'metrics.json')
    await writeFile(reportPath, JSON.stringify(metrics, null, 2), 'utf8')
  })
})
