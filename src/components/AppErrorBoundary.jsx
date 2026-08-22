import { Component } from 'react'
import { CircleAlert, RefreshCw } from 'lucide-react'

function reloadLatestVersion() {
  const url = new URL(window.location.href)
  url.searchParams.set('_reload', Date.now().toString())
  window.location.replace(url.toString())
}

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Learning hub render failed.', error, errorInfo)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <main className="app-error-screen" role="alert">
        <div className="app-error-icon"><CircleAlert aria-hidden="true" /></div>
        <p className="eyebrow">PAGE RECOVERY</p>
        <h1>學習系統暫時無法顯示</h1>
        <p>可能是瀏覽器仍保留舊版本。請按下方按鈕重新讀取最新頁面。</p>
        <button type="button" className="primary-button" onClick={reloadLatestVersion}>
          <RefreshCw aria-hidden="true" />重新載入最新版
        </button>
        <details>
          <summary>查看錯誤資訊</summary>
          <code>{error?.message || String(error)}</code>
        </details>
      </main>
    )
  }
}
