// Global audio cache to persist across component re-renders
class AudioCache {
  private cache: Record<string, string> = {};
  private cleanupOnUnload = false;

  constructor() {
    // Set up cleanup on page unload to prevent memory leaks
    if (!this.cleanupOnUnload) {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
      this.cleanupOnUnload = true;
    }
  }

  get(hanzi: string): string | undefined {
    return this.cache[hanzi];
  }

  set(hanzi: string, url: string): void {
    // If we already have a URL for this hanzi, revoke the old one first
    if (this.cache[hanzi]) {
      URL.revokeObjectURL(this.cache[hanzi]);
    }
    this.cache[hanzi] = url;
  }

  delete(hanzi: string): void {
    if (this.cache[hanzi]) {
      URL.revokeObjectURL(this.cache[hanzi]);
      delete this.cache[hanzi];
    }
  }

  cleanup(): void {
    Object.values(this.cache).forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.cache = {};
  }
}

// Export a singleton instance
export const audioCache = new AudioCache();
