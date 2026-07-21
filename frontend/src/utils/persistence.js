import { get, set, del } from "idb-keyval";

const DB_PREFIX = "tl_reading_";

export async function saveReadingState(state) {
  try {
    await set(`${DB_PREFIX}current`, {
      ...state,
      timestamp: Date.now()
    });
  } catch (e) {
    console.warn("[Persistence] Failed to save reading state:", e);
  }
}

export async function loadReadingState() {
  try {
    const saved = await get(`${DB_PREFIX}current`);
    if (!saved) return null;

    // Auto-expire readings older than 24 hours to prevent stale data
    if (Date.now() - saved.timestamp > 24 * 60 * 60 * 1000) {
      await clearReadingState();
      return null;
    }

    return saved;
  } catch (e) {
    console.error("[Persistence] Failed to load reading state:", e);
    return null;
  }
}

export async function clearReadingState() {
  try {
    await del(`${DB_PREFIX}current`);
  } catch (e) {
    console.warn("[Persistence] Failed to clear reading state:", e);
  }
}
