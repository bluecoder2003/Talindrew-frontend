import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  getWorkerStats, 
  diseaseWorker, 
  restrictionWorker,
  areWorkersAvailable
} from '../utils/workerManager';
import { 
  Activity,
  Cpu,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface WorkerDiagnosticsProps {
  diseaseProgress?: { progress: number; message: string };
  restrictionProgress?: { progress: number; message: string };
  isAnalyzingDiseases?: boolean;
  isAnalyzingRestriction?: boolean;
}

export function WorkerDiagnostics({
  diseaseProgress = { progress: 0, message: '' },
  restrictionProgress = { progress: 0, message: '' },
  isAnalyzingDiseases = false,
  isAnalyzingRestriction = false
}: WorkerDiagnosticsProps) {
  const [stats, setStats] = useState(getWorkerStats());
  const [isTestingWorkers, setIsTestingWorkers] = useState(false);
  const [testResults, setTestResults] = useState<{
    disease: { success: boolean; time: number; error?: string } | null;
    restriction: { success: boolean; time: number; error?: string } | null;
  }>({
    disease: null,
    restriction: null
  });

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getWorkerStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const testWorkers = async () => {
    if (!areWorkersAvailable()) {
      setTestResults({
        disease: { success: false, time: 0, error: 'Workers disabled' },
        restriction: { success: false, time: 0, error: 'Workers disabled' }
      });
      return;
    }

    setIsTestingWorkers(true);
    setTestResults({ disease: null, restriction: null });

    // Test Disease Worker
    try {
      const diseaseStart = performance.now();
      const diseaseResult = await diseaseWorker.detectMutations(
        'GAGGAGGTGGAGAAGCTT', // Simple test sequence with sickle cell mutation
        {}
      );
      const diseaseTime = performance.now() - diseaseStart;
      
      setTestResults(prev => ({
        ...prev,
        disease: { 
          success: true, 
          time: diseaseTime,
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        disease: { 
          success: false, 
          time: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }

    // Test Restriction Worker
    try {
      const restrictionStart = performance.now();
      const restrictionResult = await restrictionWorker.findCutSites(
        'ATCGGAATTCGCAAAGCTTGGC', // Simple test sequence with EcoRI and HindIII sites
        {}
      );
      const restrictionTime = performance.now() - restrictionStart;
      
      setTestResults(prev => ({
        ...prev,
        restriction: { 
          success: true, 
          time: restrictionTime,
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        restriction: { 
          success: false, 
          time: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }));
    }

    setIsTestingWorkers(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Worker Performance Monitor
          {!areWorkersAvailable() && (
            <Badge variant="destructive" className="text-xs">
              Disabled
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Worker Availability Status */}
        {!areWorkersAvailable() && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Workers Disabled</span>
            </div>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Web Workers failed to initialize. Analysis is running in the main thread, which may impact performance for large sequences.
            </p>
          </div>
        )}
        {/* Worker Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Disease Worker</span>
              <Badge 
                variant={stats.diseaseWorker.initialized ? "default" : "destructive"}
                className="text-xs"
              >
                {stats.diseaseWorker.initialized ? (
                  <><CheckCircle className="w-3 h-3 mr-1" />Ready</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" />Not Ready</>
                )}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Pending tasks: {stats.diseaseWorker.pendingTasks}
            </div>
            {isAnalyzingDiseases && (
              <div className="space-y-1">
                <Progress value={diseaseProgress.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {diseaseProgress.message}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Restriction Worker</span>
              <Badge 
                variant={stats.restrictionWorker.initialized ? "default" : "destructive"}
                className="text-xs"
              >
                {stats.restrictionWorker.initialized ? (
                  <><CheckCircle className="w-3 h-3 mr-1" />Ready</>
                ) : (
                  <><XCircle className="w-3 h-3 mr-1" />Not Ready</>
                )}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Pending tasks: {stats.restrictionWorker.pendingTasks}
            </div>
            {isAnalyzingRestriction && (
              <div className="space-y-1">
                <Progress value={restrictionProgress.progress} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {restrictionProgress.message}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Worker Test */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Worker Performance Test</h4>
            <Button
              onClick={testWorkers}
              disabled={isTestingWorkers}
              size="sm"
              variant="outline"
            >
              {isTestingWorkers ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Cpu className="w-4 h-4 mr-2" />
              )}
              {isTestingWorkers ? 'Testing...' : 'Test Workers'}
            </Button>
          </div>

          {(testResults.disease || testResults.restriction) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testResults.disease && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {testResults.disease.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">Disease Worker</span>
                  </div>
                  {testResults.disease.success ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {testResults.disease.time.toFixed(1)}ms
                    </div>
                  ) : (
                    <div className="text-xs text-red-500">
                      Error: {testResults.disease.error}
                    </div>
                  )}
                </div>
              )}

              {testResults.restriction && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {testResults.restriction.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">Restriction Worker</span>
                  </div>
                  {testResults.restriction.success ? (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {testResults.restriction.time.toFixed(1)}ms
                    </div>
                  ) : (
                    <div className="text-xs text-red-500">
                      Error: {testResults.restriction.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Performance Benefits */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <h5 className="text-sm font-medium mb-2">
            Performance Benefits {areWorkersAvailable() ? '(Active)' : '(Main Thread Mode)'}
          </h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            {areWorkersAvailable() ? (
              <>
                <li>• Analysis runs in separate threads (Web Workers)</li>
                <li>• Main UI thread remains responsive during heavy computation</li>
                <li>• Parallel processing of disease detection and restriction analysis</li>
                <li>• Inline workers provide maximum compatibility</li>
                <li>• Progressive loading with real-time progress updates</li>
              </>
            ) : (
              <>
                <li>• Analysis runs in main thread (synchronous mode)</li>
                <li>• May cause UI blocking for very large sequences</li>
                <li>• Consider using smaller sequence chunks (100kb-1MB)</li>
                <li>• All functionality remains available</li>
                <li>• Performance optimization still active</li>
              </>
            )}
          </ul>
        </div>

        {/* Worker Strategy Info */}
        {areWorkersAvailable() && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="text-sm font-medium mb-2 text-blue-800 dark:text-blue-200">Worker Strategy</h5>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Using inline workers for maximum compatibility. Workers are created using JavaScript blobs, 
              ensuring functionality without external file dependencies.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}