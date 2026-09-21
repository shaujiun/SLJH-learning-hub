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

  it('提供兩個站內與兩個外部益智遊戲，並保留訪客模式', () => {
    useUrl('https://example.test/hub/?guest=1')
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('不列入每日任務與教師報表')
    expect(html).toContain('href="?puzzle=word-grid&amp;guest=1"')
    expect(html).toContain('來源：聯合報好讀周報・設計者：遲驖川老師')
    expect(html).toContain('href="?puzzle=number-grid&amp;guest=1"')
    expect(html).toContain('來源：聯合報好讀周報・設計者：狄運來老師')
    expect(html).toContain('href="https://andrewkotw.github.io/card-puzzle/#4CLUE"')
    expect(html).toContain('href="https://andrewkotw.github.io/120_card_math/"')
    expect(html).toContain('target="_blank" rel="noreferrer"')
  })

  it('keeps guest mode on every science practice link', () => {
    useUrl('https://example.test/hub/?subject=science&guest=1')
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('?game=periodic-table&amp;guest=1')
    expect(html).toContain('?game=chemical-formula&amp;guest=1')
    expect(html).not.toContain('量測實驗室')
    expect(html).not.toContain('?game=measurement-lab')
    expect(html).toContain('href="?guest=1"')
  })

  it('各科頁面依地圖、基礎、引導、桌遊順序分區，活動不重複', () => {
    useUrl('https://example.test/hub/?subject=science&guest=1')
    const html = renderToStaticMarkup(<App />)
    const map = html.indexOf('data-learning-section="map"')
    const basic = html.indexOf('data-learning-section="basic"')
    const guided = html.indexOf('data-learning-section="guided"')
    const board = html.indexOf('data-learning-section="board"')
    expect(map).toBeGreaterThan(-1)
    expect(map).toBeLessThan(basic)
    expect(basic).toBeLessThan(guided)
    expect(guided).toBeLessThan(board)
    expect(html.slice(basic, guided)).toContain('元素週期表測驗')
    expect(html.slice(basic, guided)).not.toContain('化學事前哨站')
    expect(html.slice(guided, board)).not.toContain('量測實驗室')
    expect(html.slice(guided, board)).toContain('化學事前哨站')
    expect(html.slice(map, basic)).toContain('冊別與章節地圖尚在規劃中')
  })

  it('歷史地圖與數學桌遊各自放在對應區塊', () => {
    useUrl('https://example.test/hub/?subject=history&guest=1')
    const historyHtml = renderToStaticMarkup(<App />)
    expect(historyHtml.slice(historyHtml.indexOf('data-learning-section="map"'), historyHtml.indexOf('data-learning-section="basic"')))
      .toContain('歷史時光地圖')

    useUrl('https://example.test/hub/?subject=math&guest=1')
    const mathHtml = renderToStaticMarkup(<App />)
    expect(mathHtml.slice(mathHtml.indexOf('data-learning-section="board"'))).toContain('根式馬戲團')
  })

  it('blocks the archived measurement lab when a guest opens its old direct link', () => {
    useUrl('https://example.test/hub/?game=measurement-lab&guest=1')
    const html = renderToStaticMarkup(<App />)

    expect(html).toContain('量測實驗室已封存')
    expect(html).not.toContain('games/measurement-lab/index.html')
    expect(html).not.toContain('<iframe')
  })

  it('does not load the game before checking an authenticated direct link', () => {
    useUrl('https://example.test/hub/?game=measurement-lab')
    const html = renderToStaticMarkup(<App />)

    expect(html).not.toContain('games/measurement-lab/index.html')
    expect(html).not.toContain('<iframe')
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
