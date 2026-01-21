declare const __APP_VERSION__: string

interface UpdateInfo {
  version: string
  url: string
  name: string
}

function isNewerVersion(latest: string, current: string): boolean {
  const [latestParts, currentParts] = [latest, current].map(v =>
    v.split('.').map(Number)
  )
  for (let i = 0; i < 3; i++) {
    if ((latestParts[i] || 0) > (currentParts[i] || 0)) return true
    if ((latestParts[i] || 0) < (currentParts[i] || 0)) return false
  }
  return false
}

export function useUpdateChecker() {
  const updateAvailable = ref<UpdateInfo | null>(null)
  const isChecking = ref(false)

  async function checkForUpdates() {
    // Check once per session
    if (sessionStorage.getItem('update-check-done') === 'true') {
      return
    }

    isChecking.value = true
    try {
      const response = await fetch(
        'https://api.github.com/repos/peopleoff/qaview/releases/latest'
      )

      if (!response.ok) {
        console.warn('Update check failed: HTTP', response.status)
        return
      }

      const release = await response.json()
      const latestVersion = release.tag_name.replace(/^v/, '')
      const currentVersion = __APP_VERSION__

      if (isNewerVersion(latestVersion, currentVersion)) {
        updateAvailable.value = {
          version: latestVersion,
          url: release.html_url,
          name: release.name || `Version ${latestVersion}`
        }
      }
    } catch (error) {
      console.warn('Update check failed:', error)
    } finally {
      isChecking.value = false
      sessionStorage.setItem('update-check-done', 'true')
    }
  }

  return { updateAvailable, isChecking, checkForUpdates }
}
