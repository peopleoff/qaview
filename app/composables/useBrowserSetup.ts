export const useBrowserSetup = () => {
  const router = useRouter();
  const route = useRoute();

  /**
   * Check if browser is installed
   */
  async function checkBrowserInstalled(): Promise<boolean> {
    if (!process.client || !window.electronAPI) {
      return true; // Assume installed in non-Electron environment (dev/web)
    }

    try {
      const result = await window.electronAPI.isBrowserInstalled();
      return result.success && result.data === true;
    } catch (error) {
      console.error("Failed to check browser installation:", error);
      return false;
    }
  }

  /**
   * Check browser status and redirect to setup if needed
   * Call this in app.vue or layout
   */
  async function ensureBrowserInstalled() {
    // Skip check if already on setup page
    if (route.path === "/setup") {
      return;
    }

    const isInstalled = await checkBrowserInstalled();

    if (!isInstalled) {
      // Redirect to setup page
      await router.push("/setup");
    }
  }

  return {
    checkBrowserInstalled,
    ensureBrowserInstalled,
  };
};
