import { useState, useCallback } from 'react'

const STORAGE_KEY = 'tibu_profile'

const DEFAULT_PROFILE = {
  name: '',
  major: '',
  year: '',
  initials: '',
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useProfile() {
  const [profile, setProfileState] = useState(() => loadProfile())

  const saveProfile = useCallback((data) => {
    const next = {
      ...data,
      initials: getInitials(data.name || '?'),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setProfileState(next)
  }, [])

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setProfileState(null)
  }, [])

  return { profile, saveProfile, clearProfile, isSetup: !!profile?.name }
}
