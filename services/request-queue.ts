/**
 * Global Request Queue Service
 * Ensures API requests are processed sequentially to prevent rate limit violations
 */

interface QueueTask<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class RequestQueue {
  private queue: Array<QueueTask<any>> = [];
  private processing = false;
  private minDelayMs = 500; // Minimum delay between requests (500ms = max 120 RPM)

  /**
   * Add a request to the queue
   * @param fn Function that returns a Promise (typically an API call)
   * @returns Promise that resolves when the request completes
   */
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: fn,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  /**
   * Process queued requests sequentially
   */
  private async processQueue(): Promise<void> {
    // If already processing or queue is empty, return
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) break;

      try {
        const result = await task.execute();
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }

      // Wait before processing next request to respect rate limits
      if (this.queue.length > 0) {
        await this.delay(this.minDelayMs);
      }
    }

    this.processing = false;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current queue length
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is processing
   */
  isProcessing(): boolean {
    return this.processing;
  }
}

// Export singleton instance
export const globalRequestQueue = new RequestQueue();
