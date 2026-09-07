export const guestLearningSystems = [
  {
    id: 'guest-science',
    code: 'science',
    name: '自然科',
    description: '練習元素週期表、粒子與化學式，不需要建立帳號。',
    audienceLabel: '訪客開放',
    activities: [],
  },
  {
    id: 'guest-history',
    code: 'history',
    name: '歷史',
    description: '使用歷史時光地圖整理人物、制度與事件的前後關係。',
    audienceLabel: '訪客開放',
    activities: [],
  },
  {
    id: 'guest-geography',
    code: 'geography',
    name: '地理',
    description: '使用填圖與線索推理，練習臺灣、中國及世界地理。',
    audienceLabel: '訪客開放',
    activities: [],
  },
]

function browserHref() {
  return typeof window === 'undefined' ? '' : window.location.href
}

export function isGuestMode(currentHref = browserHref()) {
  return currentHref ? new URL(currentHref).searchParams.get('guest') === '1' : false
}

export function guestLaunchUrl(href) {
  if (!href) return ''
  const url = new URL(href, 'https://learning-hub.invalid/')
  url.searchParams.set('guest', '1')
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) return url.toString()
  return `${href.startsWith('./') ? './' : ''}${url.search}${url.hash}`
}

export function learningHubUrl(query = '', currentHref = browserHref()) {
  if (!currentHref) return query ? `.${query}` : './'
  const url = new URL(currentHref)
  const guestMode = isGuestMode(currentHref)
  url.search = query
  if (guestMode) url.searchParams.set('guest', '1')
  url.hash = ''
  return url.toString()
}
