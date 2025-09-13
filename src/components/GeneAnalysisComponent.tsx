import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  Dna, 
  Scissors, 
  AlertTriangle, 
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useGeneAnalysis } from '../utils/talindrew-hooks';
import { GeneAnalysisRequest } from '../utils/talindrew-api';

interface GeneAnalysisComponentProps {
  initialGeneSymbol?: string;
  initialSequence?: string;
  onAnalysisComplete?: (result: any) => void;
}

export const GeneAnalysisComponent: React.FC<GeneAnalysisComponentProps> = ({
  initialGeneSymbol = '',
  initialSequence = '',
  onAnalysisComplete
}) => {
  const [geneSymbol, setGeneSymbol] = useState(initialGeneSymbol);
  const [sequence, setSequence] = useState(initialSequence);
  const [detectDiseases, setDetectDiseases] = useState(true);
  const [detectEnzymes, setDetectEnzymes] = useState(true);
  const [enzymes, setEnzymes] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const { data, loading, error, analyze, clear } = useGeneAnalysis();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!geneSymbol.trim()) {
      return;
    }

    const request: GeneAnalysisRequest = {
      gene_symbol: geneSymbol,
      input_sequence: sequence.trim() || undefined,
      detect_diseases: detectDiseases,
      detect_enzymes: detectEnzymes,
      enzymes: enzymes.trim() ? enzymes.split(',').map(e => e.trim()) : undefined
    };

    // Start progress simulation for better UX
    setAnalysisProgress(0);
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90; // Stop at 90% until API completes
        }
        return prev + 10;
      });
    }, 1000);

    try {
      await analyze(request);
      setAnalysisProgress(100);
      
      if (onAnalysisComplete && data) {
        onAnalysisComplete(data);
      }
    } catch (err) {
      setAnalysisProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleClear = () => {
    clear();
    setAnalysisProgress(0);
  };

  // Format analysis duration
  const getEstimatedTime = () => {
    const sequenceLength = sequence.length;
    if (sequenceLength > 1000000) return '2-5 minutes';
    if (sequenceLength > 100000) return '1-2 minutes';
    if (sequenceLength > 10000) return '30-60 seconds';
    return '15-30 seconds';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dna className="w-5 h-5" />
            Comprehensive Gene Analysis
            <Badge variant="secondary" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Talindrew API
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Gene Symbol Input */}
            <div>
              <Label htmlFor="gene-symbol">Gene Symbol *</Label>
              <Input
                id="gene-symbol"
                type="text"
                placeholder="e.g., CFTR, BRCA1, HTT"
                value={geneSymbol}
                onChange={(e) => setGeneSymbol(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Optional Sequence Input */}
            <div>
              <Label htmlFor="analysis-sequence">DNA Sequence (optional)</Label>
              <Textarea
                id="analysis-sequence"
                placeholder="Provide sequence or leave empty to fetch from NCBI automatically"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                rows={4}
                className="mt-1 font-mono text-sm"
              />
              {sequence.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sequence length: {sequence.length.toLocaleString()} bp
                  {sequence.length > 100000 && (
                    <span className="text-orange-600 ml-2">
                      • Large sequence detected
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Analysis Options */}
            <div className="space-y-3">
              <Label>Analysis Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="detect-diseases"
                  checked={detectDiseases}
                  onCheckedChange={(checked) => setDetectDiseases(!!checked)}
                />
                <Label htmlFor="detect-diseases" className="text-sm">
                  Detect Disease-Associated Variants
                </Label>
                {detectDiseases && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    May take longer
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="detect-enzymes"
                  checked={detectEnzymes}
                  onCheckedChange={(checked) => setDetectEnzymes(!!checked)}
                />
                <Label htmlFor="detect-enzymes" className="text-sm">
                  Detect Restriction Enzyme Cut Sites
                </Label>
              </div>
            </div>

            {/* Enzyme Selection */}
            {detectEnzymes && (
              <div>
                <Label htmlFor="analysis-enzymes">Specific Enzymes (optional)</Label>
                <Input
                  id="analysis-enzymes"
                  type="text"
                  placeholder="e.g., EcoRI, BamHI, HindIII (comma-separated)"
                  value={enzymes}
                  onChange={(e) => setEnzymes(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to analyze all common restriction enzymes
                </p>
              </div>
            )}

            {/* Time Estimation */}
            {(detectDiseases || detectEnzymes) && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Estimated analysis time: <strong>{getEstimatedTime()}</strong>
                  {detectDiseases && sequence.length > 500000 && (
                    <span className="text-orange-600">
                      <br />Large sequences may require additional processing time for disease detection.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={loading || !geneSymbol.trim() || (!detectDiseases && !detectEnzymes)}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Dna className="w-4 h-4 mr-2" />
                    Start Analysis
                  </>
                )}
              </Button>
              {(data || error) && (
                <Button variant="outline" onClick={handleClear} type="button">
                  Clear
                </Button>
              )}
            </div>
          </form>

          {/* Progress Bar */}
          {loading && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Analysis Progress</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-xs text-muted-foreground">
                {analysisProgress < 30 && "Initializing analysis..."}
                {analysisProgress >= 30 && analysisProgress < 60 && "Processing sequence..."}
                {analysisProgress >= 60 && analysisProgress < 90 && "Running analysis algorithms..."}
                {analysisProgress >= 90 && "Finalizing results..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Analysis Error:</strong> {error}
            {(error.includes('503') || error.includes('unavailable')) && (
              <div className="mt-2">
                <strong>Note:</strong> The Talindrew Gene API appears to be temporarily unavailable. 
                This may be due to maintenance or high server load. Please try again in a few minutes.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {data && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Analysis Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Gene Symbol</p>
                  <p className="text-2xl font-bold">{data.gene_symbol}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sequence Length</p>
                  <p className="text-lg">{data.sequence_length.toLocaleString()} bp</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Source</p>
                  <Badge variant="outline">{data.sequence_source}</Badge>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground">
                  Analysis completed at: {new Date(data.analysis_timestamp).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Disease Results */}
          {detectDiseases && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Disease Analysis
                  <Badge variant={data.variants_detected > 0 ? "destructive" : "secondary"}>
                    {data.variants_detected} variants
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.diseases_detected.length > 0 ? (
                  <div className="space-y-3">
                    {data.diseases_detected.map((disease, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">Position {disease.position}</h4>
                            <p className="text-sm text-muted-foreground">
                              <strong>Change:</strong> {disease.reference_base} → {disease.alternative_base}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>ClinVar ID:</strong> {disease.clinvar_id}
                            </p>
                            <p className="text-sm">{disease.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No disease-associated variants detected in this sequence.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Enzyme Results */}
          {detectEnzymes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Restriction Enzyme Analysis
                  <Badge variant="secondary">
                    {Object.values(data.enzyme_cut_sites).flat().length} cut sites
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.enzyme_cut_sites).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(data.enzyme_cut_sites).map(([enzyme, positions]) => (
                      <div key={enzyme} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{enzyme}</h4>
                          <Badge variant="outline">{positions.length} sites</Badge>
                        </div>
                        {positions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              Cut positions: {positions.slice(0, 10).join(', ')}
                              {positions.length > 10 && ` ... and ${positions.length - 10} more`}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No restriction enzyme cut sites found in this sequence.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};