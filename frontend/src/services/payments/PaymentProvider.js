/**
 * Abstract Base Class for Payment Providers
 * Ensures a consistent interface for the UI
 */
export class PaymentProvider {
  /**
   * @param {Object} product - The package to purchase
   * @param {Object} user - User context (email, name)
   * @param {Object} callbacks - onSuccess, onError, onPending
   */
  async purchase(product, user, callbacks) {
    throw new Error("Method 'purchase()' must be implemented.");
  }

  /**
   * Check if this provider is available on the current device
   */
  async isAvailable() {
    return false;
  }

  /**
   * Restore previous purchases
   */
  async restore(user) {
    return { success: false };
  }
}
