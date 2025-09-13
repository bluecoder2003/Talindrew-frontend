// API Cache Utility for Optimizing External API Calls
// Implements memory caching, request deduplication, and performance monitoring

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class APICache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private pendingRequests = new Map<string, PendingRequest<T>>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;

  constructor(defaultTTL: number = 5 * 60 * 1000, maxSize: number = 1000) { // 5 min TTL, 1000 entries max
    this.defaultTTL = defaultTTL;
    this.maxSize = maxSize;
  }

  // Get cached data or execute function with deduplication
  async get<R>(key: string, fetcher: () => Promise<R>, ttl?: number): Promise<R> {
    const now = Date.now();
    const cacheKey = this.normalizeKey(key);

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      // Only log cache hits in development or for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`💾 Cache HIT: ${key}`);
      }
      return cached.data as R;
    }

    // Check if request is already pending (deduplication)
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      console.log(`🔄 Request deduplication: ${key}`);
      return pending.promise as Promise<R>;
    }

    // Execute request
    const isWarmUp = key.includes('warm');
    if (!isWarmUp) {
      console.log(`⚡ Cache MISS: ${key} - fetching...`);
    }
    
    const promise = this.executeRequest(cacheKey, fetcher, ttl || this.defaultTTL);
    
    // Store pending request for deduplication
    this.pendingRequests.set(cacheKey, {
      promise: promise as Promise<T>,
      timestamp: now
    });

    return promise;
  }

  private async executeRequest<R>(cacheKey: string, fetcher: () => Promise<R>, ttl: number): Promise<R> {
    try {
      const data = await fetcher();
      const now = Date.now();

      // Store in cache
      this.cache.set(cacheKey, {
        data: data as T,
        timestamp: now,
        expiresAt: now + ttl
      });

      // Clean up pending request
      this.pendingRequests.delete(cacheKey);

      // Clean cache if needed
      this.cleanCache();

      // Only log caching in development or for non-warm-up requests
      const isWarmUp = cacheKey.includes('warm');
      if (!isWarmUp && process.env.NODE_ENV === 'development') {
        console.log(`💾 Cached: ${cacheKey} (TTL: ${ttl}ms)`);
      }
      
      return data;
    } catch (error) {
      // Clean up pending request on error
      this.pendingRequests.delete(cacheKey);
      throw error;
    }
  }

  private normalizeKey(key: string): string {
    return key.toLowerCase().trim();
  }

  private cleanCache(): void {
    if (this.cache.size <= this.maxSize) return;

    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries first
    const expired = entries.filter(([_, entry]) => entry.expiresAt <= now);
    expired.forEach(([key]) => this.cache.delete(key));

    // If still over limit, remove oldest entries
    if (this.cache.size > this.maxSize) {
      const remaining = Array.from(this.cache.entries())
        .sort(([_, a], [__, b]) => a.timestamp - b.timestamp);
      
      const toRemove = remaining.slice(0, remaining.length - this.maxSize + 100); // Keep some buffer
      toRemove.forEach(([key]) => this.cache.delete(key));
    }

    console.log(`Cache cleaned: ${this.cache.size} entries remaining`);
  }

  // Clear cache manually
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache stats
  getStats() {
    const now = Date.now();
    const total = this.cache.size;
    const expired = Array.from(this.cache.values()).filter(entry => entry.expiresAt <= now).length;
    const pending = this.pendingRequests.size;

    return {
      totalEntries: total,
      expiredEntries: expired,
      validEntries: total - expired,
      pendingRequests: pending,
      hitRate: 0, // Would need to track hits/misses for this
    };
  }
}

// Create singleton instances for different API types
export const ensemblCache = new APICache(10 * 60 * 1000); // 10 minutes for Ensembl
export const ncbiCache = new APICache(15 * 60 * 1000);    // 15 minutes for NCBI
export const geneCache = new APICache(30 * 60 * 1000);    // 30 minutes for gene data

// Utility function to create optimized fetch with timeout and retry
export async function optimizedFetch(
  url: string, 
  options: RequestInit = {}, 
  timeout: number = 10000,
  retries: number = 2
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestOptions: RequestInit = {
    ...options,
    signal: controller.signal,
    headers: {
      'User-Agent': 'Talindrew/1.0 (Educational genetics tool)',
      ...options.headers,
    }
  };

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Fetch attempt ${attempt + 1} failed for ${url}:`, error.message);
      
      if (attempt < retries && error.name !== 'AbortError') {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      clearTimeout(timeoutId);
      throw lastError;
    }
  }

  throw lastError!;
}

// Batch request utility for multiple API calls
export class BatchRequester {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private concurrency = 2; // Reduced concurrent requests for better performance
  private delay = 300; // Increased delay between batches to be gentler on APIs

  add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.process();
      }
    });
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.concurrency);
      
      try {
        await Promise.all(batch.map(request => request()));
      } catch (error) {
        console.error('Batch processing error:', error);
      }

      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
      }
    }

    this.isProcessing = false;
  }
}

export const batchRequester = new BatchRequester();