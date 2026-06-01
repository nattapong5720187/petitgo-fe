import liff from '@line/liff'

const LIFF_ID = import.meta.env.VITE_LIFF_ID

let initialized = false

export async function initLiff() {
  if (initialized || !LIFF_ID) return
  await liff.init({ liffId: LIFF_ID })
  initialized = true
}

export function isLiffBrowser() {
  if (typeof window === 'undefined') return false
  return (
    navigator.userAgent.includes('Line/') ||
    new URLSearchParams(window.location.search).has('liff.state')
  )
}

export { liff }
