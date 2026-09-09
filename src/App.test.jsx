import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App.jsx'
import FocusTrainingHub from './components/FocusTrainingHub.jsx'

const previousWindow = globalThis.window

function useUrl(url) {
  const parsed = new URL(url)
  globalThis.window = {
    location: {
      href: parsed.toString(),
      search: parsed.search,
    },
  }
}

afterEach(() => {
  globalThis.window = previousWindow
})

describe('guest practice routes', () => {
  it('renders a no-registration landing page without loading a student dashboard', () => {
    useUrl('https://example.test/hub/?guest=1')
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('不用註冊，選一項開始練習')
    expect(html).toContain('不寫入學生資料')
    expect(html).toContain('?subject=science&amp;guest=1')
    expect(html).not.toContain('待完成的專注任務')
  })

  it('keeps guest mode on every science practice link', () => {
    useUrl('https://example.test/hub/?subject=science&guest=1')
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('?game=periodic-table&amp;guest=1')
    expect(html).toContain('?game=chemical-formula&amp;guest=1')
    expect(html).toContain('?game=measurement-lab&amp;guest=1')
    expect(html).toContain('href="?guest=1"')
  })

  it('opens the measurement lab inside the learning hub tab', () => {
    useUrl('https://example.test/hub/?game=measurement-lab&guest=1')
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('量測實驗室')
    expect(html).toContain('games/measurement-lab/index.html')
    expect(html).toContain('href="?subject=science&amp;guest=1"')
    expect(html).not.toContain('target="_blank"')
  })

  it('shows only general focus practice to guests', () => {
    useUrl('https://example.test/hub/?focus=training&guest=1')
    const html = renderToStaticMarkup(<FocusTrainingHub />)

    expect(html).toContain('?game=schulte-static&amp;guest=1')
    expect(html).toContain('?game=schulte-phrase&amp;guest=1')
    expect(html).not.toContain('名言佳句背誦')
    expect(html).not.toContain('內容管理')
  })

  it('does not open a named memorization task from a guest URL', () => {
    useUrl('https://example.test/hub/?game=schulte-memorization&guest=1')
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('不用註冊，選一項開始練習')
    expect(html).not.toContain('週五名言佳句背誦')
  })
})
