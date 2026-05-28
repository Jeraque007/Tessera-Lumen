// iOS-compatible download utility
// iOS Safari ignores the "download" attribute on anchor tags entirely.
// The correct approach: detect iOS and open the blob in a new tab.
// The user can then long-press -> "Save to Files" or "Save Image".

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPad on iOS 13+ reports as MacIntel with touch
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isSafari() {
  if (typeof navigator === "undefined") return false;
  return (
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  );
}

/**
 * Download or open an HTML string as a file.
 * - Desktop Chrome/Firefox: triggers file download via <a download>
 * - iOS Safari / iOS Chrome: opens in new tab with save instructions overlay
 * - Android Chrome: triggers download via <a download>
 *
 * @param {string} htmlContent  The HTML string to export
 * @param {string} filename     Suggested filename (used on desktop)
 */
export function exportReading(htmlContent, filename = "tessera-lumen-reading.html") {
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  if (isIOS()) {
    // iOS: open in new tab  user can long-press to save or use share sheet
    const newTab = window.open(url, "_blank");
    if (!newTab) {
      // Popup blocked  fallback: navigate current window
      window.location.href = url;
    }
    // Revoke after a delay to allow the tab to load
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return { method: "ios-newtab" };
  }

  // Desktop / Android: standard anchor download
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { method: "download" };
}
