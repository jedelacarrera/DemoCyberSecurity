// Global configuration
let CONFIG = {
  backendUrl: "http://localhost:3101", // Default fallback
  loaded: false,
};

// Load configuration from server
async function loadConfig() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();
    CONFIG.backendUrl = config.backendUrl;
    CONFIG.loaded = true;
    console.log("✅ Configuration loaded:", CONFIG);

    // Dispatch event to notify that config is ready
    window.dispatchEvent(new Event("configLoaded"));
  } catch (error) {
    console.warn("⚠️ Failed to load config, using defaults:", error);
    CONFIG.loaded = true;
    window.dispatchEvent(new Event("configLoaded"));
  }
}

// Auto-load on script load
loadConfig();

// Helper function to wait for config to be loaded
function waitForConfig() {
  return new Promise((resolve) => {
    if (CONFIG.loaded) {
      resolve(CONFIG);
    } else {
      window.addEventListener("configLoaded", () => resolve(CONFIG), {
        once: true,
      });
    }
  });
}
