// Core

import { create, StateCreator } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import {
  generateCanvasFingerprint,
  getOrCreateSessionKey,
  getCreationTime,
  getDeviceInfo,
  encrypt,
  decrypt,
} from '@/utils/authEncryption'




// Clear auth data (let AuthGuard handle redirect)
const clearAuthData = (): void => {
  try {
    localStorage.removeItem(authStoreName)
    localStorage.removeItem('_auth_creation')
    sessionStorage.removeItem('_session_key')
    // Let AuthGuard handle redirect instead of forcing it here
  } catch (error) {
    console.error('Failed to clear auth data:', error)
  }
}

// Validate device fingerprint against stored data (with tolerance)
const validateDeviceFingerprint = (): boolean => {
  try {
    const currentDeviceInfo = getDeviceInfo()
    const storedData = localStorage.getItem(authStoreName)
    
    if (!storedData) return true // No stored data to validate against
    
    const decryptedData = decrypt(storedData)
    if (!decryptedData) return false // Failed to decrypt
    
    const parsed = JSON.parse(decryptedData)
    const storedDeviceInfo = parsed._deviceInfo
    
    // Only check most critical and stable fields
    if (storedDeviceInfo) {
      const criticalFields = ['userAgent', 'language', 'platform']
      let mismatches = 0
      
      for (const field of criticalFields) {
        if (storedDeviceInfo[field] !== currentDeviceInfo[field]) {
          mismatches++
        }
      }
      
      // Allow if less than 2 critical fields changed (more tolerant)
      if (mismatches >= 2) {
        console.warn(`Device validation failed: ${mismatches} critical fields changed`)
        return false
      }
    }
    
    return true
  } catch {
    return false
  }
}

// Custom encrypted storage
const createEncryptedStorage = () => ({
  getItem: (name: string) => {
    try {
      const encryptedValue = localStorage.getItem(name)
      if (!encryptedValue) return null
      
      // Validate device fingerprint before returning data
      if (!validateDeviceFingerprint()) {
        console.warn('Device validation failed, clearing auth data')
        clearAuthData()
        return null
      }
      
      const decryptedValue = decrypt(encryptedValue)
      return decryptedValue
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      // Parse the value to add device fingerprint
      const parsedValue = JSON.parse(value)
      
      // Add device fingerprint and device info
      parsedValue._deviceFingerprint = generateCanvasFingerprint()
      parsedValue._deviceInfo = getDeviceInfo()
      parsedValue._sessionKey = getOrCreateSessionKey()
      parsedValue._creationTime = getCreationTime()
      
      const enhancedValue = JSON.stringify(parsedValue)
      const encryptedValue = encrypt(enhancedValue)
      localStorage.setItem(name, encryptedValue)
    } catch {
      // Fallback to unencrypted storage
      localStorage.setItem(name, value)
    }
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name)
  }
})
export interface States {
  email: string | null
  username: string | null
  first_name: string | null
  last_name: string | null
  roles: string[] | null
  permissions: string[] | null
  _hasHydrated: boolean
}

interface SetStoreActionValues {
  email?: States['email']
  username?: States['username']
  first_name?: States['first_name']
  last_name?: States['last_name']
  roles?: States['roles']
  permissions?: States['permissions']
}
interface Actions {
  setStore: (values: SetStoreActionValues) => void
  resetStore: () => void
  setHasHydrated: (hasHydrated: boolean) => void
}
// Store
type Store = States & Actions

export const authStoreName = 'auth-client'
// Constants
const INITIAL_STATES: States = {
  email: null,
  username: null,
  first_name: null,
  last_name: null,
  roles: null,
  permissions: null,
  _hasHydrated: false,
}
const authStore: StateCreator<Store> = (set) => ({
  // States
  ...INITIAL_STATES,

  // Methods
  setStore: ({
    email,
    username,
    first_name,
    last_name,
    roles,
    permissions,
  }) =>
    (() => {
      return set((state) => {
        const newState = {
          email: email === undefined ? state.email : email,
          username: username === undefined ? state.username : username,
          first_name: first_name === undefined ? state.first_name : first_name,
          last_name: last_name === undefined ? state.last_name : last_name,
          roles: roles === undefined ? state.roles : roles,
          permissions: permissions === undefined ? state.permissions : permissions,
        }
        return newState
      })
    })(),
  resetStore: () => {
    return set({
      email: INITIAL_STATES.email,
      username: INITIAL_STATES.username,
      first_name: INITIAL_STATES.first_name,
      last_name: INITIAL_STATES.last_name,
      roles: INITIAL_STATES.roles,
      permissions: INITIAL_STATES.permissions,
      _hasHydrated: true, 
    })
  },
  setHasHydrated: (hasHydrated: boolean) => {
    set({ _hasHydrated: hasHydrated })
  },
})
const useAuthStore = create<Store>()(
  devtools(
    persist(authStore, {
      name: authStoreName,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? createEncryptedStorage() : (void 0 as unknown as Storage)
      ),
      partialize: (state) => ({ 
        email: state.email,
        username: state.username,
        first_name: state.first_name,
        last_name: state.last_name,
        roles: state.roles,
        permissions: state.permissions
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error) {
          // Validate device fingerprint immediately after rehydration
          if (typeof window !== 'undefined') {
            setTimeout(() => {
              const isValidDevice = validateDeviceFingerprint()
              if (!isValidDevice) {
                console.warn('Device validation failed during rehydration, clearing auth data')
                clearAuthData()
                useAuthStore.setState(INITIAL_STATES)
                return
              }
              useAuthStore.setState({ _hasHydrated: true })
            }, 0)
          } else {
            useAuthStore.setState({ _hasHydrated: true })
          }
        }
      }
    })
  )
)

// Gentle periodic device validation (less intrusive)
if (typeof window !== 'undefined') {
  // Validate every 30 minutes when tab is active (less frequent)
  setInterval(() => {
    if (!document.hidden) {
      const isValidDevice = validateDeviceFingerprint()
      if (!isValidDevice) {
        // Just clear data, don't log warnings constantly
        clearAuthData()
        useAuthStore.getState().resetStore()
      }
    }
  }, 30 * 60 * 1000) // 30 minutes

  // Only validate on focus if user was away for more than 1 hour
  let lastValidation = Date.now()
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && Date.now() - lastValidation > 60 * 60 * 1000) {
      const isValidDevice = validateDeviceFingerprint()
      if (!isValidDevice) {
        clearAuthData()
        useAuthStore.getState().resetStore()
      }
      lastValidation = Date.now()
    }
  })
}

export default useAuthStore