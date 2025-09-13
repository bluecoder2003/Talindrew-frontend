// Worker Manager Utility
// Manages Web Workers for heavy computational tasks like disease detection and restriction enzyme analysis

import { createInlineDiseaseWorker, createInlineRestrictionWorker } from './inlineWorkers';

interface WorkerMessage {
  type: string;
  data?: any;
  id?: string;
}

interface WorkerTask {
  id: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  onProgress?: (progress: { progress: number; message: string }) => void;
}

export class WorkerManager {
  private worker: Worker | null = null;
  private tasks = new Map<string, WorkerTask>();
  private isReady = false;
  protected workerPath: string; // Changed to protected so subclasses can modify it
  private taskCounter = 0;

  constructor(workerPath: string) {
    this.workerPath = workerPath;
  }

  private generateTaskId(): string {
    return `task_${++this.taskCounter}_${Date.now()}`;
  }

  async initialize(): Promise<void> {
    if (this.worker) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        console.log(`🔧 Initializing external worker from: ${this.workerPath}`);
        
        // Test if worker script is accessible first
        fetch(this.workerPath)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Worker script not found: ${response.status} ${response.statusText}`);
            }
            console.log(`✅ Worker script accessible: ${this.workerPath}`);
          })
          .catch(fetchError => {
            console.warn(`❌ Worker script fetch test failed: ${fetchError.message}`);
          });

        this.worker = new Worker(this.workerPath);
        
        this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
          this.handleWorkerMessage(e.data);
        };

        this.worker.onerror = (error) => {
          console.error(`❌ Worker error for ${this.workerPath}:`, error);
          console.error('Error details:', {
            message: error.message,
            filename: error.filename,
            lineno: error.lineno,
            colno: error.colno
          });
          this.isReady = false;
          reject(new Error(`Worker failed to load: ${error.message || 'Unknown error'}`));
        };

        this.worker.onmessageerror = (error) => {
          console.error(`❌ Worker message error for ${this.workerPath}:`, error);
          reject(new Error(`Worker message error: ${error}`));
        };

        // Wait for ready signal
        const readyTimeout = setTimeout(() => {
          console.error(`❌ Worker initialization timeout for ${this.workerPath}`);
          if (this.worker) {
            this.worker.terminate();
            this.worker = null;
          }
          reject(new Error(`Worker initialization timeout for ${this.workerPath}`));
        }, 10000); // Reduced timeout since inline workers are faster

        const handleReady = (data: WorkerMessage) => {
          if (data.type === 'READY') {
            console.log(`✅ External worker ready: ${this.workerPath}`);
            clearTimeout(readyTimeout);
            this.isReady = true;
            resolve();
          }
        };

        // Listen for ready message
        this.worker.addEventListener('message', (e) => handleReady(e.data), { once: true });

      } catch (error) {
        console.error(`❌ Failed to create worker ${this.workerPath}:`, error);
        reject(error);
      }
    });
  }

  private handleWorkerMessage(message: WorkerMessage) {
    const { type, data, id } = message;

    if (type === 'READY') {
      this.isReady = true;
      return;
    }

    if (!id) {
      console.warn('Received worker message without task ID:', message);
      return;
    }

    const task = this.tasks.get(id);
    if (!task) {
      console.warn('Received message for unknown task ID:', id);
      return;
    }

    switch (type) {
      case 'PROGRESS':
        if (task.onProgress && data) {
          task.onProgress(data);
        }
        break;

      case 'ERROR':
        this.tasks.delete(id);
        task.reject(new Error(data?.error || 'Worker task failed'));
        break;

      default:
        // Assume this is a result message
        this.tasks.delete(id);
        task.resolve(data);
        break;
    }
  }

  async executeTask(
    type: string, 
    data?: any, 
    onProgress?: (progress: { progress: number; message: string }) => void
  ): Promise<any> {
    if (!workersAvailable) {
      throw new Error('Workers disabled - use fallback mode');
    }

    if (!this.isReady) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const taskId = this.generateTaskId();
      
      this.tasks.set(taskId, {
        id: taskId,
        resolve,
        reject,
        onProgress
      });

      // Set timeout for long-running tasks
      const timeout = setTimeout(() => {
        this.tasks.delete(taskId);
        reject(new Error('Worker task timeout'));
      }, 120000); // 2 minute timeout for large sequences

      // Clear timeout when task completes
      const originalResolve = resolve;
      const originalReject = reject;
      
      this.tasks.get(taskId)!.resolve = (value) => {
        clearTimeout(timeout);
        originalResolve(value);
      };
      
      this.tasks.get(taskId)!.reject = (error) => {
        clearTimeout(timeout);
        originalReject(error);
      };

      this.worker.postMessage({
        type,
        data,
        id: taskId
      });
    });
  }

  terminate() {
    if (this.worker) {
      // Reject all pending tasks
      this.tasks.forEach(task => {
        task.reject(new Error('Worker terminated'));
      });
      this.tasks.clear();

      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }

  isInitialized(): boolean {
    return this.isReady && this.worker !== null;
  }

  getPendingTaskCount(): number {
    return this.tasks.size;
  }
}

// Disease Detection Worker Manager
export class DiseaseDetectionWorker extends WorkerManager {
  constructor() {
    super('/diseaseWorker.js'); // This will be ignored in favor of inline workers
  }

  async initialize(): Promise<void> {
    // Priority 1: Try inline worker first (most reliable)
    console.log('🔧 Attempting inline disease worker creation...');
    try {
      const inlineWorker = createInlineDiseaseWorker();
      if (inlineWorker) {
        this.worker = inlineWorker;
        
        this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
          this.handleWorkerMessage(e.data);
        };

        this.worker.onerror = (error) => {
          console.error('Inline disease worker error:', error);
          this.isReady = false;
        };

        // Wait for ready signal from inline worker
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Inline worker initialization timeout'));
          }, 5000);

          const handleReady = (data: WorkerMessage) => {
            if (data.type === 'READY') {
              clearTimeout(timeout);
              this.isReady = true;
              console.log('✅ Inline disease worker ready');
              resolve();
            }
          };

          this.worker!.addEventListener('message', (e) => handleReady(e.data), { once: true });
        });
      } else {
        throw new Error('Failed to create inline worker');
      }
    } catch (inlineError) {
      console.warn('❌ Inline worker creation failed:', inlineError.message);
      
      // Priority 2: Try external worker files as fallback
      console.log('🔄 Falling back to external worker files...');
      try {
        await super.initialize();
        console.log('✅ External disease worker loaded successfully');
        return;
      } catch (error) {
        // Priority 3: Try alternative external paths
        console.warn(`External worker path failed, trying alternatives...`);
        const alternativePaths = [
          './diseaseWorker.js',
          '/workers/diseaseWorker.js',
          './workers/diseaseWorker.js'
        ];
        
        for (const altPath of alternativePaths) {
          try {
            this.workerPath = altPath;
            await super.initialize();
            console.log(`✅ Worker loaded successfully from alternative path: ${altPath}`);
            return;
          } catch (altError) {
            console.warn(`❌ Alternative path ${altPath} failed:`, altError.message);
          }
        }

        // All methods failed
        console.error('❌ All worker initialization methods failed');
        throw new Error('Disease worker initialization failed: All methods exhausted');
      }
    }
  }

  async detectMutations(
    sequence: string,
    options?: any,
    onProgress?: (progress: { progress: number; message: string }) => void
  ) {
    return this.executeTask('DETECT_MUTATIONS', { sequence, options }, onProgress);
  }
}

// Restriction Enzyme Worker Manager  
export class RestrictionEnzymeWorker extends WorkerManager {
  constructor() {
    super('/restrictionWorker.js'); // This will be ignored in favor of inline workers
  }

  async initialize(): Promise<void> {
    // Priority 1: Try inline worker first (most reliable)
    console.log('🔧 Attempting inline restriction worker creation...');
    try {
      const inlineWorker = createInlineRestrictionWorker();
      if (inlineWorker) {
        this.worker = inlineWorker;
        
        this.worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
          this.handleWorkerMessage(e.data);
        };

        this.worker.onerror = (error) => {
          console.error('Inline restriction worker error:', error);
          this.isReady = false;
        };

        // Wait for ready signal from inline worker
        return new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Inline worker initialization timeout'));
          }, 5000);

          const handleReady = (data: WorkerMessage) => {
            if (data.type === 'READY') {
              clearTimeout(timeout);
              this.isReady = true;
              console.log('✅ Inline restriction worker ready');
              resolve();
            }
          };

          this.worker!.addEventListener('message', (e) => handleReady(e.data), { once: true });
        });
      } else {
        throw new Error('Failed to create inline worker');
      }
    } catch (inlineError) {
      console.warn('❌ Inline worker creation failed:', inlineError.message);
      
      // Priority 2: Try external worker files as fallback
      console.log('🔄 Falling back to external worker files...');
      try {
        await super.initialize();
        console.log('✅ External restriction worker loaded successfully');
        return;
      } catch (error) {
        // Priority 3: Try alternative external paths
        console.warn(`External worker path failed, trying alternatives...`);
        const alternativePaths = [
          './restrictionWorker.js',
          '/workers/restrictionWorker.js', 
          './workers/restrictionWorker.js'
        ];
        
        for (const altPath of alternativePaths) {
          try {
            this.workerPath = altPath;
            await super.initialize();
            console.log(`✅ Worker loaded successfully from alternative path: ${altPath}`);
            return;
          } catch (altError) {
            console.warn(`❌ Alternative path ${altPath} failed:`, altError.message);
          }
        }

        // All methods failed
        console.error('❌ All worker initialization methods failed');
        throw new Error('Restriction worker initialization failed: All methods exhausted');
      }
    }
  }

  async findCutSites(
    sequence: string,
    options?: any,
    onProgress?: (progress: { progress: number; message: string }) => void
  ) {
    return this.executeTask('FIND_CUT_SITES', { sequence, options }, onProgress);
  }

  async getEnzymesList() {
    return this.executeTask('GET_ENZYMES');
  }
}

// Global flag to track if workers are available
let workersAvailable = true;

// Singleton instances for global use
export const diseaseWorker = new DiseaseDetectionWorker();
export const restrictionWorker = new RestrictionEnzymeWorker();

// Function to check if workers are available
export function areWorkersAvailable(): boolean {
  return workersAvailable;
}

// Function to disable workers (fallback mode)
export function disableWorkers(): void {
  workersAvailable = false;
  console.warn('Web Workers disabled - falling back to main thread processing');
}

// Cleanup function for app shutdown
export function terminateAllWorkers() {
  diseaseWorker.terminate();
  restrictionWorker.terminate();
}

// Performance monitoring
export function getWorkerStats() {
  return {
    diseaseWorker: {
      initialized: diseaseWorker.isInitialized(),
      pendingTasks: diseaseWorker.getPendingTaskCount()
    },
    restrictionWorker: {
      initialized: restrictionWorker.isInitialized(),
      pendingTasks: restrictionWorker.getPendingTaskCount()
    }
  };
}