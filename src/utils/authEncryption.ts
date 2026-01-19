import CryptoJS from 'crypto-js'

const BASE_KEY: string = process.env.PUBLIC_AUTH_ENCRYPTION_KEY || ''

export const generateEncryptionKey = (): string => {
  const BASE = BASE_KEY || 'secure_fallback_key'
  if (typeof window === 'undefined') {
    return CryptoJS.SHA256(BASE).toString()
  }

  const stableFingerprint = {
    // userAgent: navigator.userAgent?.substring(0, 100),
    // platform: navigator.platform,
    // language: navigator.language,
    // timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }

  const fingerprintHash = CryptoJS.SHA256(JSON.stringify(stableFingerprint)).toString()

  return CryptoJS.SHA256(BASE + fingerprintHash).toString()
}

export const generateCanvasFingerprint = (): string => {
  if (typeof window === 'undefined') return 'no-canvas'
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return 'no-canvas'

    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('Device fingerprint', 2, 2)
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)'
    ctx.fillRect(100, 5, 80, 20)

    return canvas.toDataURL().slice(-50)
  } catch {
    return 'canvas-error'
  }
}

export const getOrCreateSessionKey = (): string => {
  if (typeof window === 'undefined') return ''
  try {
    const sessionKey = sessionStorage.getItem('_device_session')
    if (sessionKey) return sessionKey

    const newKey = CryptoJS.lib.WordArray.random(128 / 8).toString()
    sessionStorage.setItem('_device_session', newKey)
    return newKey
  } catch {
    return ''
  }
}

export const getCreationTime = (): string => {
  if (typeof window === 'undefined') return ''
  try {
    const creationTime = localStorage.getItem('_auth_creation')
    if (creationTime) return creationTime

    const newTime = Date.now().toString()
    localStorage.setItem('_auth_creation', newTime)
    return newTime
  } catch {
    return ''
  }
}

export const getDeviceInfo = (): Record<string, unknown> => {
  if (typeof window === 'undefined') return {}

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
    cookieEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

export const encrypt = (text: string): string => {
  try {
    const key = generateEncryptionKey()
    const encrypted = CryptoJS.AES.encrypt(text, key).toString()

    const timestamp = Date.now().toString(36)
    return `${timestamp}:${encrypted}`
  } catch {
    return text
  }
}

export const decrypt = (encryptedText: string): string => {
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format')
    }

    const [timestampStr, encryptedData] = parts
    const timestamp = parseInt(timestampStr, 36)

    const maxAge = 30 * 24 * 60 * 60 * 1000
    if (Date.now() - timestamp > maxAge) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-client')
        localStorage.removeItem('_auth_creation')
      }
      return ''
    }

    const key = generateEncryptionKey()
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key)
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8)

    if (!decryptedText) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-client')
        localStorage.removeItem('_auth_creation')
      }
      return ''
    }

    try {
      const parsed = JSON.parse(decryptedText)
      if (!parsed.state || typeof parsed.state !== 'object') {
        throw new Error('Invalid auth data structure')
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-client')
        localStorage.removeItem('_auth_creation')
      }
      return ''
    }

    return decryptedText
  } catch {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-client')
      localStorage.removeItem('_auth_creation')
    }
    return ''
  }
}