import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dna, Zap, AlertTriangle, Info } from 'lucide-react';
import { PerformanceMonitor } from '../utils/performance';

interface SequenceGeneratorProps {
  onSequenceGenerated: (sequence: string, name: string, description: string) => void;
}

export function SequenceGenerator({ onSequenceGenerated }: SequenceGeneratorProps) {
  const [targetLength, setTargetLength] = useState<number>(1000000);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Generate a random DNA sequence of specified length
  const generateRandomSequence = async (length: number): Promise<string> => {
    const bases = ['A', 'T', 'G', 'C'];
    const chunkSize = 50000; // Generate in 50kb chunks
    const chunks: string[] = [];
    
    return PerformanceMonitor.measureAsync(`Generate ${(length / 1000000).toFixed(2)}MB sequence`, async () => {
      for (let i = 0; i < length; i += chunkSize) {
        const currentChunkSize = Math.min(chunkSize, length - i);
        let chunk = '';
        
        for (let j = 0; j < currentChunkSize; j++) {
          chunk += bases[Math.floor(Math.random() * 4)];
        }
        
        chunks.push(chunk);
        
        // Update progress
        const currentProgress = Math.round(((i + currentChunkSize) / length) * 100);
        setProgress(currentProgress);
        
        // Yield control every chunk to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 1));
        
        // Log progress for large sequences
        if (length > 1000000 && (i + currentChunkSize) % 500000 === 0) {
          console.log(`Generated ${((i + currentChunkSize) / 1000000).toFixed(1)}MB of ${(length / 1000000).toFixed(1)}MB`);
        }
      }
      
      return chunks.join('');
    });
  };

  const handleGenerateSequence = async () => {
    if (targetLength < 1000 || targetLength > 20000000) {
      alert('Please enter a length between 1,000 and 20,000,000 bases');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      const memoryEstimate = PerformanceMonitor.estimateSequenceMemoryUsage(targetLength);
      console.log(`Generating ${(targetLength / 1000000).toFixed(2)}MB sequence - Estimated memory: ${memoryEstimate.estimatedMB}MB`);
      
      if (targetLength > 10000000) {
        console.warn('Generating very large sequence - this may take some time and use significant memory');
      }

      const sequence = await generateRandomSequence(targetLength);
      
      const sizeDescription = targetLength >= 1000000 
        ? `${(targetLength / 1000000).toFixed(2)}MB`
        : `${(targetLength / 1000).toFixed(0)}KB`;
      
      const name = `Generated Random DNA Sequence (${sizeDescription})`;
      const description = `Randomly generated DNA sequence of ${targetLength.toLocaleString()} base pairs for performance testing. Generated using optimized chunking for large sequences.`;

      onSequenceGenerated(sequence, name, description);
      
      PerformanceMonitor.logMemoryUsage('After sequence generation');
    } catch (error) {
      console.error('Error generating sequence:', error);
      alert('Failed to generate sequence. Please try a smaller size.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const presetSizes = [
    { size: 100000, label: '100KB', description: 'Medium test sequence' },
    { size: 500000, label: '500KB', description: 'Large test sequence' },
    { size: 1000000, label: '1MB', description: 'Very large sequence' },
    { size: 2000000, label: '2MB', description: 'Mega sequence' },
    { size: 5000000, label: '5MB', description: 'Ultra large sequence' },
    { size: 10000000, label: '10MB', description: 'Maximum test sequence' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Sequence Generator
          <Badge variant="outline" className="text-xs">
            Performance Testing
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Generate random DNA sequences to test Talindrew's performance with large genomic data (up to 20MB).
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Sequence Length (base pairs)
            </label>
            <Input
              type="number"
              value={targetLength}
              onChange={(e) => setTargetLength(parseInt(e.target.value) || 1000000)}
              min={1000}
              max={20000000}
              step={100000}
              disabled={isGenerating}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {presetSizes.map((preset) => (
              <Button
                key={preset.size}
                variant="outline"
                size="sm"
                onClick={() => setTargetLength(preset.size)}
                disabled={isGenerating}
                className="flex flex-col h-auto py-2"
              >
                <span className="font-medium">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
              </Button>
            ))}
          </div>

          {targetLength > 5000000 && (
            <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                <strong>Large sequence warning:</strong> Sequences over 5MB may take significant time to generate and process. 
                Some analysis features will be limited to maintain performance.
              </AlertDescription>
            </Alert>
          )}

          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Dna className="w-4 h-4 animate-spin" />
                <span>Generating sequence... {progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerateSequence}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Dna className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate {(targetLength / 1000000).toFixed(2)}MB Sequence
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground">
            <strong>Memory estimate:</strong> ~{PerformanceMonitor.estimateSequenceMemoryUsage(targetLength).estimatedMB}MB
          </div>
        </div>
      </CardContent>
    </Card>
  );
}