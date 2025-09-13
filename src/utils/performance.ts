export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static measureSync<T>(label: string, fn: () => T): T {
    const startTime = performance.now();
    try {
      const result = fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance if it's slow
      if (duration > 100) {
        console.warn(`Performance: ${label} took ${duration.toFixed(2)}ms`);
      } else if (duration > 50) {
        console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
      }
      
      this.measurements.set(label, duration);
      return result;
    } catch (error) {
      console.error(`Performance measurement failed for ${label}:`, error);
      throw error;
    }
  }

  static async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) {
        console.warn(`Performance: ${label} took ${duration.toFixed(2)}ms`);
      } else if (duration > 50) {
        console.log(`Performance: ${label} took ${duration.toFixed(2)}ms`);
      }
      
      this.measurements.set(label, duration);
      return result;
    } catch (error) {
      console.error(`Performance measurement failed for ${label}:`, error);
      throw error;
    }
  }

  static getLastMeasurement(label: string): number | undefined {
    return this.measurements.get(label);
  }

  static getAllMeasurements(): Record<string, number> {
    return Object.fromEntries(this.measurements);
  }

  static clearMeasurements(): void {
    this.measurements.clear();
  }

  static logMemoryUsage(label?: string): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      
      const memoryInfo = `Memory usage${label ? ` (${label})` : ''}: ${usedMB}MB used / ${totalMB}MB total (limit: ${limitMB}MB)`;
      
      if (usedMB > limitMB * 0.8) {
        console.warn(memoryInfo + ' - High memory usage detected!');
      } else if (usedMB > limitMB * 0.6) {
        console.log(memoryInfo + ' - Moderate memory usage');
      } else {
        console.log(memoryInfo);
      }
    } else {
      console.log(`Memory monitoring not available${label ? ` for ${label}` : ''}`);
    }
  }

  static getMemoryUsage(): { used: number; total: number; limit: number } | null {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return null;
  }

  static async processInChunks<T, R>(
    data: T[],
    chunkSize: number,
    processor: (chunk: T[]) => Promise<R> | R,
    onProgress?: (processed: number, total: number) => void
  ): Promise<R[]> {
    const results: R[] = [];
    const total = data.length;
    
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      try {
        const result = await processor(chunk);
        results.push(result);
        
        // Report progress if callback provided
        if (onProgress) {
          onProgress(i + chunk.length, total);
        }
        
        // Yield control to prevent UI blocking
        if (i + chunkSize < total) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      } catch (error) {
        console.error(`Error processing chunk ${i}-${i + chunk.length}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  static async processSequenceInChunks(
    sequence: string,
    chunkSize: number = 10000,
    processor: (chunk: string) => string = (chunk) => chunk
  ): Promise<string> {
    if (sequence.length <= chunkSize) {
      return processor(sequence);
    }

    // For very large sequences (1M+ bp), use adaptive chunking
    const isVeryLarge = sequence.length > 1000000;
    const adaptiveChunkSize = isVeryLarge ? Math.min(chunkSize * 2, 50000) : chunkSize;
    const yieldInterval = isVeryLarge ? 2 : 5; // Yield more frequently for large sequences

    const chunks: string[] = [];
    let processedLength = 0;
    
    for (let i = 0; i < sequence.length; i += adaptiveChunkSize) {
      const chunk = sequence.slice(i, i + adaptiveChunkSize);
      chunks.push(processor(chunk));
      processedLength += chunk.length;
      
      // Yield control more frequently for large sequences
      if (i % (adaptiveChunkSize * yieldInterval) === 0) {
        await new Promise(resolve => setTimeout(resolve, isVeryLarge ? 5 : 0));
        
        // Log progress for very large sequences
        if (isVeryLarge && processedLength % 500000 === 0) {
          const progressPercent = ((processedLength / sequence.length) * 100).toFixed(1);
          console.log(`Processing large sequence: ${progressPercent}% complete (${processedLength.toLocaleString()}/${sequence.length.toLocaleString()} bp)`);
        }
      }
    }
    
    return chunks.join('');
  }

  static async processLargeSequenceWithProgress(
    sequence: string,
    chunkSize: number = 25000,
    processor: (chunk: string) => string = (chunk) => chunk,
    onProgress?: (processed: number, total: number) => void
  ): Promise<string> {
    if (sequence.length <= chunkSize) {
      return processor(sequence);
    }

    const totalLength = sequence.length;
    const isVeryLarge = totalLength > 1000000;
    
    // Adaptive chunk sizing based on sequence length
    let adaptiveChunkSize = chunkSize;
    if (totalLength > 5000000) adaptiveChunkSize = 100000;      // 5M+ bp: 100kb chunks
    else if (totalLength > 2000000) adaptiveChunkSize = 50000;  // 2M+ bp: 50kb chunks
    else if (totalLength > 1000000) adaptiveChunkSize = 25000;  // 1M+ bp: 25kb chunks

    const chunks: string[] = [];
    let processedLength = 0;
    
    // Memory monitoring for large sequences
    if (isVeryLarge) {
      this.logMemoryUsage('Starting large sequence processing');
    }
    
    for (let i = 0; i < totalLength; i += adaptiveChunkSize) {
      const chunk = sequence.slice(i, i + adaptiveChunkSize);
      chunks.push(processor(chunk));
      processedLength += chunk.length;
      
      // Report progress
      if (onProgress) {
        onProgress(processedLength, totalLength);
      }
      
      // Yield control and manage memory
      if (i % (adaptiveChunkSize * 4) === 0) {
        await new Promise(resolve => setTimeout(resolve, isVeryLarge ? 10 : 1));
        
        // Memory check for very large sequences
        if (isVeryLarge && processedLength % 1000000 === 0) {
          this.logMemoryUsage(`Processed ${(processedLength / 1000000).toFixed(1)}M bp`);
          
          // Force garbage collection hint (if available)
          if (typeof window !== 'undefined' && (window as any).gc) {
            (window as any).gc();
          }
        }
      }
    }
    
    if (isVeryLarge) {
      this.logMemoryUsage('Completed large sequence processing');
    }
    
    return chunks.join('');
  }

  static estimateSequenceMemoryUsage(sequenceLength: number): {
    estimatedMB: number;
    recommendation: string;
  } {
    // Rough estimation: sequence string + processing overhead
    const baseMemoryMB = (sequenceLength * 2) / (1024 * 1024); // 2 bytes per character
    const processingOverheadMB = baseMemoryMB * 1.5; // 50% overhead for processing
    const totalEstimatedMB = Math.ceil(baseMemoryMB + processingOverheadMB);
    
    let recommendation = 'Normal processing';
    if (sequenceLength > 10000000) recommendation = 'Consider streaming or server-side processing';
    else if (sequenceLength > 5000000) recommendation = 'Use progressive loading with memory monitoring';
    else if (sequenceLength > 1000000) recommendation = 'Use chunked processing with regular yields';
    
    return {
      estimatedMB: totalEstimatedMB,
      recommendation
    };
  }
}