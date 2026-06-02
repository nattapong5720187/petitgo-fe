import liff from '@line/liff'

let initialized = false

export async function initLiff() {
  if (initialized) return
  await liff.init({ liffId: import.meta.env.VITE_LIFF_ID })
  initialized = true
}

export const isInLiff = () => liff.isInClient()
export const isLiffLoggedIn = () => liff.isLoggedIn()
export const liffLogin = (redirectUri) => liff.login(redirectUri ? { redirectUri } : undefined)
export const getLiffAccessToken = () => liff.getAccessToken()
