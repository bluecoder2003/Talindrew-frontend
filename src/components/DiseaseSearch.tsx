import React, { useState, useEffect } from 'react';
import { Search, Info, Loader2, Database, Dna, MapPin, FileText } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { PerformanceMonitor } from '../utils/performance';

interface DiseaseInfo {
  key: string;
  name: string;
  geneSymbol: string;
  primaryGene?: string;
  description: string;
  chromosome: string;
  maplocation: string;
  geneId: string;
  organism: string;
  category?: string;
  prevalence?: string;
  inheritance?: string;
}

interface NCBIGeneResult {
  uid: string;
  name: string;
  description: string;
  chromosome: string;
  maplocation: string;
  summary: string;
}

interface DiseaseSearchProps {
  onDiseaseSelect?: (disease: DiseaseInfo) => void;
  onSequenceLoad?: (sequence: string, name: string, description: string) => void;
}

export function DiseaseSearch({ onDiseaseSelect, onSequenceLoad }: DiseaseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiseaseInfo[]>([]);
  const [allDiseases, setAllDiseases] = useState<DiseaseInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDiseases, setIsLoadingDiseases] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);
  const [ncbiResults, setNcbiResults] = useState<NCBIGeneResult[]>([]);
  const [showNCBIResults, setShowNCBIResults] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSequence, setLoadingSequence] = useState<string | null>(null);
  const [sequenceProgress, setSequenceProgress] = useState<{
    step: string;
    progress: number;
  } | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Load diseases from database on component mount
  useEffect(() => {
    loadDiseases();
  }, []);

  const loadDiseases = async () => {
    try {
      setIsLoadingDiseases(true);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/diseases`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const diseases = await response.json();
        const diseaseArray = Object.entries(diseases).map(([key, data]: [string, any]) => ({
          key,
          ...data
        }));
        setAllDiseases(diseaseArray);
        setSearchResults(diseaseArray.slice(0, 10)); // Show first 10 by default
      } else {
        console.log('No diseases found in database');
        setAllDiseases([]);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error loading diseases:', error);
      setAllDiseases([]);
      setSearchResults([]);
    } finally {
      setIsLoadingDiseases(false);
    }
  };

  const populateDiseasesFromNCBI = async () => {
    try {
      setIsPopulating(true);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/populate-diseases`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Disease population result:', result);
        // Reload diseases after population
        await loadDiseases();
      } else {
        console.error('Failed to populate diseases');
      }
    } catch (error) {
      console.error('Error populating diseases:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  const searchDiseases = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(allDiseases.slice(0, 10));
      setShowNCBIResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // First search local database
      const localResults = allDiseases.filter(disease =>
        disease.name.toLowerCase().includes(query.toLowerCase()) ||
        disease.geneSymbol.toLowerCase().includes(query.toLowerCase()) ||
        disease.description.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(localResults);

      // Then search NCBI for additional results
      const ncbiResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/ncbi/search-genes?disease=${encodeURIComponent(query)}&retmax=5`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (ncbiResponse.ok) {
        const ncbiData = await ncbiResponse.json();
        if (ncbiData.esearchresult && ncbiData.esearchresult.idlist.length > 0) {
          // Fetch details for each gene ID
          const geneDetails = await Promise.all(
            ncbiData.esearchresult.idlist.slice(0, 3).map(async (geneId: string) => {
              try {
                const detailsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/ncbi/gene-details/${geneId}`, {
                  headers: {
                    'Authorization': `Bearer ${publicAnonKey}`,
                    'Content-Type': 'application/json'
                  }
                });

                if (detailsResponse.ok) {
                  const detailsData = await detailsResponse.json();
                  return detailsData.result[geneId];
                }
              } catch (error) {
                console.error('Error fetching gene details:', error);
              }
              return null;
            })
          );

          const validDetails = geneDetails.filter(Boolean);
          setNcbiResults(validDetails);
          setShowNCBIResults(validDetails.length > 0);
        }
      }
    } catch (error) {
      console.error('Error searching diseases:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDiseases(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allDiseases]);

  const loadSequenceFromNCBI = async (accession: string, geneName: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/ncbi/sequence/${accession}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        }
      });

      if (response.ok) {
        const fastaText = await response.text();
        // Parse FASTA format
        const lines = fastaText.split('\n');
        const sequence = lines.slice(1).join('').replace(/\s/g, '');
        
        if (onSequenceLoad && sequence) {
          onSequenceLoad(sequence, geneName, `Sequence loaded from NCBI (${accession})`);
        }
      }
    } catch (error) {
      console.error('Error loading sequence from NCBI:', error);
    }
  };

  // Fetch genomic sequence from Ensembl using REST API with progress tracking
  const fetchGenomicSequence = async (geneId: string, assembly: string = 'GRCh38', signal?: AbortSignal) => {
    return PerformanceMonitor.measureAsync(`Ensembl Fetch: ${geneId}`, async () => {
      try {
        // Step 1: Lookup gene details to get genomic location
        setSequenceProgress({ step: 'Looking up gene information...', progress: 20 });
        
        const baseUrl = assembly === 'GRCh37' ? 'https://grch37.rest.ensembl.org' : 'https://rest.ensembl.org';
        // Validate geneId format
        if (!geneId || geneId.trim().length === 0) {
          throw new Error('Gene ID is required');
        }
        
        const sanitizedGeneId = encodeURIComponent(geneId.trim());
        const lookupUrl = `${baseUrl}/lookup/id/${sanitizedGeneId}?content-type=application/json`;
        
        console.log('Looking up gene details for:', geneId, 'URL:', lookupUrl);
        const lookupResponse = await fetch(lookupUrl, { 
          signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Talindrew/1.0 (Educational genetics tool)'
          }
        });
        
        if (!lookupResponse.ok) {
          if (lookupResponse.status === 400) {
            throw new Error(`Invalid gene ID format: ${geneId}. Please use a valid Ensembl gene ID (e.g., ENSG00000139618).`);
          } else if (lookupResponse.status === 404) {
            throw new Error(`Gene ID "${geneId}" not found in Ensembl database.`);
          }
          
          const errorText = await lookupResponse.text();
          console.error('Ensembl gene lookup error:', {
            geneId: geneId,
            status: lookupResponse.status,
            statusText: lookupResponse.statusText,
            body: errorText
          });
          
          throw new Error(`Ensembl lookup failed (${lookupResponse.status}): Unable to find gene information.`);
        }
        
        const lookupData = await lookupResponse.json();
        
        // Validate the response data
        if (!lookupData || !lookupData.id) {
          throw new Error('Invalid gene data received from Ensembl');
        }
        
        // Show gene information in progress
        const sequenceLength = lookupData.end - lookupData.start;
        const sizeKb = (sequenceLength / 1000).toFixed(1);
        const sizeMb = (sequenceLength / 1000000).toFixed(2);
        
        // Memory estimation and warnings for large sequences
        const memoryEstimate = PerformanceMonitor.estimateSequenceMemoryUsage(sequenceLength);
        
        let progressMessage = `Found ${lookupData.display_name} on Chr${lookupData.seq_region_name}`;
        if (sequenceLength > 1000000) {
          progressMessage += ` (${sizeMb}Mb - Large sequence)`;
        } else {
          progressMessage += ` (${sizeKb}kb)`;
        }
        
        setSequenceProgress({ 
          step: progressMessage, 
          progress: 40 
        });
        
        // Warn about very large sequences and provide memory estimates
        if (sequenceLength > 10000000) {
          console.warn(`Very large sequence detected: ${sizeMb}MB - ${memoryEstimate.recommendation}`);
          setSequenceProgress({ 
            step: `Warning: Very large sequence (${sizeMb}MB). Estimated memory usage: ${memoryEstimate.estimatedMB}MB`, 
            progress: 40 
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else if (sequenceLength > 5000000) {
          console.log(`Large sequence: ${sizeMb}MB - Using progressive loading`);
          PerformanceMonitor.logMemoryUsage('Large sequence detected');
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else if (sequenceLength > 1000000) {
          console.log(`Medium-large sequence: ${sizeMb}MB - Using chunked processing`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else if (sequenceLength > 500000) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Construct region (chromosome:start..end:strand)
        const region = `${lookupData.seq_region_name}:${lookupData.start}..${lookupData.end}:1`; // Forward strand
        
        // Step 2: Fetch genomic sequence using the region
        setSequenceProgress({ step: 'Downloading genomic sequence...', progress: 70 });
        
        const sequenceUrl = `${baseUrl}/sequence/region/homo_sapiens/${region}?content-type=text/plain`;
        
        console.log('Fetching genomic sequence for region:', region, 'URL:', sequenceUrl);
        const sequenceResponse = await fetch(sequenceUrl, { 
          signal,
          headers: {
            'Content-Type': 'text/plain',
            'User-Agent': 'Talindrew/1.0 (Educational genetics tool)'
          }
        });
        
        if (!sequenceResponse.ok) {
          if (sequenceResponse.status === 400) {
            throw new Error(`Invalid region format: ${region}. Please check the gene coordinates.`);
          } else if (sequenceResponse.status === 404) {
            throw new Error(`Sequence not found for region: ${region}. The gene may not be available in ${assembly}.`);
          }
          
          const errorText = await sequenceResponse.text();
          console.error('Ensembl sequence fetch error:', {
            status: sequenceResponse.status,
            statusText: sequenceResponse.statusText,
            body: errorText,
            region: region
          });
          
          throw new Error(`Ensembl sequence fetch failed (${sequenceResponse.status}): Unable to retrieve genomic sequence.`);
        }
        
        const sequence = await sequenceResponse.text();
        
        // Show processing step
        setSequenceProgress({ step: 'Processing sequence data...', progress: 90 });
        
        // Validate sequence response
        if (!sequence || typeof sequence !== 'string') {
          throw new Error('Invalid sequence data received from Ensembl');
        }
        
        // Process large sequences in chunks to prevent UI blocking
        let cleanSequence: string;
        if (sequence.length > 100000) {
          // Use the enhanced processing method for large sequences
          cleanSequence = await PerformanceMonitor.processLargeSequenceWithProgress(
            sequence,
            25000, // 25kb chunks for large sequences
            (chunk) => chunk.replace(/\s/g, ''), // Remove whitespace from each chunk
            (processed, total) => {
              // Update progress for very large sequences
              if (total > 1000000) {
                const progressPercent = Math.round((processed / total) * 10); // 0-10 range for final 10%
                setSequenceProgress({ 
                  step: `Processing large sequence... ${((processed / total) * 100).toFixed(1)}% (${(processed / 1000000).toFixed(1)}M bp)`, 
                  progress: 90 + progressPercent 
                });
              }
            }
          );
        } else {
          cleanSequence = sequence.replace(/\s/g, ''); // Remove any whitespace
        }
        
        // Validate processed sequence
        if (!cleanSequence || cleanSequence.length === 0) {
          throw new Error('Empty or invalid sequence received');
        }
        
        setSequenceProgress({ step: 'Complete!', progress: 100 });
        
        PerformanceMonitor.logMemoryUsage('After sequence processing');
        
        return {
          sequence: cleanSequence,
          geneInfo: lookupData,
          region: region,
          assembly: assembly
        };
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Sequence fetch was cancelled');
          throw error;
        }
        console.error('Error fetching genomic sequence:', error);
        throw error;
      }
    });
  };

  // Fetch genomic sequence by gene symbol with progress tracking
  const fetchGenomicSequenceBySymbol = async (geneSymbol: string, assembly: string = 'GRCh38', signal?: AbortSignal) => {
    return PerformanceMonitor.measureAsync(`Gene Symbol Lookup: ${geneSymbol}`, async () => {
      try {
        // First lookup gene by symbol to get gene ID
        setSequenceProgress({ step: 'Resolving gene symbol...', progress: 10 });
        
        // Validate gene symbol
        if (!geneSymbol || geneSymbol.trim().length === 0) {
          throw new Error('Gene symbol is required');
        }
        
        const baseUrl = assembly === 'GRCh37' ? 'https://grch37.rest.ensembl.org' : 'https://rest.ensembl.org';
        const sanitizedSymbol = encodeURIComponent(geneSymbol.trim().toUpperCase());
        const lookupUrl = `${baseUrl}/lookup/symbol/homo_sapiens/${sanitizedSymbol}?content-type=application/json`;
        
        console.log('Looking up gene symbol:', geneSymbol, 'URL:', lookupUrl);
        const lookupResponse = await fetch(lookupUrl, { 
          signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Talindrew/1.0 (Educational genetics tool)'
          }
        });
        
        if (!lookupResponse.ok) {
          if (lookupResponse.status === 404) {
            throw new Error(`Gene symbol "${geneSymbol}" not found. Please check the spelling or try a different gene symbol.`);
          }
          
          const errorText = await lookupResponse.text();
          console.error('Gene symbol lookup error:', {
            status: lookupResponse.status,
            statusText: lookupResponse.statusText,
            body: errorText
          });
          
          throw new Error(`Gene symbol lookup failed (${lookupResponse.status}): Please check the gene symbol and try again.`);
        }
        
        const geneData = await lookupResponse.json();
        console.log('Gene symbol lookup successful:', geneData);
        
        // Now fetch the genomic sequence using the gene ID
        return await fetchGenomicSequence(geneData.id, assembly, signal);
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Symbol lookup was cancelled');
          throw error;
        }
        console.error('Error fetching genomic sequence by symbol:', error);
        throw error;
      }
    });
  };

  // Load genomic sequence for a disease/gene with cancellation support
  const loadGenomicSequence = async (identifier: string, name: string, isGeneId: boolean = false, assembly: string = 'GRCh38') => {
    // Cancel any existing request
    if (abortController) {
      abortController.abort();
    }
    
    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    
    try {
      setLoadingSequence(identifier);
      setSequenceProgress({ step: 'Initializing...', progress: 0 });
      
      let sequenceData;
      if (isGeneId && identifier.startsWith('ENSG')) {
        // Use Ensembl gene ID
        sequenceData = await fetchGenomicSequence(identifier, assembly, newAbortController.signal);
      } else {
        // Use gene symbol
        sequenceData = await fetchGenomicSequenceBySymbol(identifier, assembly, newAbortController.signal);
      }
      
      if (onSequenceLoad && sequenceData.sequence) {
        const sizeInKb = (sequenceData.sequence.length / 1000).toFixed(1);
        const description = `Genomic sequence from Ensembl (${assembly}) | ${sequenceData.geneInfo.display_name} | Chr${sequenceData.geneInfo.seq_region_name}:${sequenceData.geneInfo.start}-${sequenceData.geneInfo.end} | ${sequenceData.sequence.length.toLocaleString()} bp (${sizeInKb} kb) | ${sequenceData.geneInfo.biotype}`;
        
        // Use requestIdleCallback to load sequence when browser is idle
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            onSequenceLoad(sequenceData.sequence, `${name} Genomic Sequence`, description);
          });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            onSequenceLoad(sequenceData.sequence, `${name} Genomic Sequence`, description);
          }, 100);
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Genomic sequence loading was cancelled');
        return; // Don't show error for cancelled requests
      }
      
      console.error('Error loading genomic sequence:', error);
      setSequenceProgress({ 
        step: `Error: ${error.message || 'Failed to load sequence'}`, 
        progress: 0 
      });
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setSequenceProgress(null);
      }, 5000);
    } finally {
      setLoadingSequence(null);
      setAbortController(null);
      // Clear progress after short delay to show completion
      setTimeout(() => {
        setSequenceProgress(null);
      }, 1500);
    }
  };

  // Cancel loading function
  const cancelSequenceLoading = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLoadingSequence(null);
      setSequenceProgress(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Disease Search
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search for genetic diseases and associated genes using NCBI database</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search diseases, genes, or symptoms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Button
              onClick={populateDiseasesFromNCBI}
              disabled={isPopulating}
              variant="outline"
              className="shrink-0"
            >
              {isPopulating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              {isPopulating ? 'Populating...' : 'Populate DB'}
            </Button>
          </div>

          {allDiseases.length === 0 && !isLoadingDiseases && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                No diseases found in database. Click "Populate DB" to fetch common genetic diseases from NCBI.
              </AlertDescription>
            </Alert>
          )}

          {(loadingSequence || sequenceProgress) && (
            <Alert className="border-muted bg-card">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5" />
                  <div className="flex-1">
                    <AlertDescription className="text-foreground">
                      <div className="flex items-center gap-2 mb-2">
                        <Dna className="w-4 h-4 text-primary" />
                        <strong>Loading genomic sequence for {loadingSequence}</strong>
                      </div>
                      {sequenceProgress && (
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            {sequenceProgress.step}
                          </div>
                          <div className="space-y-2">
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${sequenceProgress.progress}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">
                                {sequenceProgress.progress}% complete
                              </span>
                              {sequenceProgress.progress > 70 && (
                                <span className="text-primary animate-pulse">
                                  Almost ready...
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelSequenceLoading}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
                >
                  Cancel
                </Button>
              </div>
            </Alert>
          )}

          {searchResults.length > 0 && !searchQuery && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Genomic sequences:</strong> Click "Load Genome" to fetch the complete genomic DNA sequence (including introns) for any gene directly from Ensembl into the editor. Supports both GRCh38 (current) and GRCh37 (legacy) assemblies.
              </AlertDescription>
            </Alert>
          )}

          {isLoadingDiseases ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading diseases...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Local Database Results */}
              {searchResults.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Database Results ({searchResults.length})
                  </h4>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {searchResults.map((disease) => (
                      <div
                        key={disease.key}
                        className="border rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => onDiseaseSelect?.(disease)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{disease.name}</span>
                              {disease.geneSymbol && (
                                <Badge variant="outline" className="text-xs">
                                  {disease.geneSymbol}
                                </Badge>
                              )}
                              {disease.category && (
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {disease.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              {disease.chromosome && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Chr {disease.chromosome}
                                </div>
                              )}
                              {disease.maplocation && (
                                <span>{disease.maplocation}</span>
                              )}
                              {disease.inheritance && (
                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                  {disease.inheritance}
                                </span>
                              )}
                            </div>
                            {disease.prevalence && (
                              <div className="text-xs text-muted-foreground mb-1">
                                <strong>Prevalence:</strong> {disease.prevalence}
                              </div>
                            )}
                            {disease.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {disease.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                const identifier = disease.geneId?.startsWith('ENSG') ? disease.geneId : disease.geneSymbol;
                                const isGeneId = disease.geneId?.startsWith('ENSG') || false;
                                if (identifier) {
                                  loadGenomicSequence(identifier, disease.name, isGeneId);
                                }
                              }}
                              disabled={!disease.geneId && !disease.geneSymbol || loadingSequence !== null}
                            >
                              {loadingSequence === (disease.geneId || disease.geneSymbol) ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Dna className="w-3 h-3 mr-1" />
                              )}
                              Load Genome
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDisease(disease);
                                setIsModalOpen(true);
                              }}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NCBI Live Results */}
              {showNCBIResults && ncbiResults.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Dna className="w-4 h-4" />
                    NCBI Live Results ({ncbiResults.length})
                  </h4>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {ncbiResults.map((gene) => (
                      <div
                        key={gene.uid}
                        className="border rounded-lg p-3 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{gene.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                NCBI
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              {gene.chromosome && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  Chr {gene.chromosome}
                                </div>
                              )}
                              {gene.maplocation && (
                                <span>{gene.maplocation}</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {gene.description}
                            </p>
                            {gene.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {gene.summary}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                if (gene.name) {
                                  loadGenomicSequence(gene.name, `${gene.name} Gene`, false);
                                }
                              }}
                              disabled={!gene.name || loadingSequence !== null}
                            >
                              {loadingSequence === gene.name ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Dna className="w-3 h-3 mr-1" />
                              )}
                              Load Genome
                            </Button>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-1">
                                    <p><strong>Gene ID:</strong> {gene.uid}</p>
                                    <p><strong>Symbol:</strong> {gene.name}</p>
                                    <p><strong>Location:</strong> {gene.chromosome}q{gene.maplocation}</p>
                                    <p><strong>Summary:</strong> {gene.summary || gene.description}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {searchQuery && searchResults.length === 0 && !showNCBIResults && !isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No diseases found for "{searchQuery}"</p>
                  <p className="text-sm">Try different keywords or populate the database with more diseases.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disease Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-black border-gray-800 max-w-2xl">
          <DialogHeader className="bg-[rgba(0,0,0,1)] border-b border-gray-800 pt-[0px] pr-[0px] pb-[22px] pl-[0px]">
            <DialogTitle className="text-white">
              {selectedDisease?.name} - Disease Details
            </DialogTitle>
            <DialogDescription className="sr-only">
              Disease information dialog
            </DialogDescription>
          </DialogHeader>
          {selectedDisease && (
            <div className="space-y-4 text-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Gene Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Gene Symbol:</span>
                      <Badge variant="outline" className="ml-2 border-gray-600 text-white bg-gray-800">
                        {selectedDisease.geneSymbol}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Gene ID:</span>
                      <span className="ml-2 text-gray-300">{selectedDisease.geneId}</span>
                    </div>
                    <div>
                      <span className="font-medium">Organism:</span>
                      <span className="ml-2 text-gray-300">{selectedDisease.organism}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-300" />
                      <span className="font-medium">Chromosome:</span>
                      <span className="text-gray-300">{selectedDisease.chromosome}</span>
                    </div>
                    <div>
                      <span className="font-medium">Map Location:</span>
                      <span className="ml-2 text-gray-300">{selectedDisease.maplocation}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {(selectedDisease.category || selectedDisease.inheritance || selectedDisease.prevalence) && (
                <div>
                  <h4 className="font-medium mb-2">Disease Characteristics</h4>
                  <div className="space-y-2 text-sm">
                    {selectedDisease.category && (
                      <div>
                        <span className="font-medium">Category:</span>
                        <Badge variant="secondary" className="ml-2 capitalize bg-gray-700 text-white border-gray-600">
                          {selectedDisease.category}
                        </Badge>
                      </div>
                    )}
                    {selectedDisease.inheritance && (
                      <div>
                        <span className="font-medium">Inheritance Pattern:</span>
                        <span className="ml-2 text-gray-300">{selectedDisease.inheritance}</span>
                      </div>
                    )}
                    {selectedDisease.prevalence && (
                      <div>
                        <span className="font-medium">Prevalence:</span>
                        <span className="ml-2 text-gray-300">{selectedDisease.prevalence}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {selectedDisease.description}
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <div className="flex flex-col gap-2 flex-1">
                  <Button
                    onClick={() => onDiseaseSelect?.(selectedDisease)}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    Select Disease
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const identifier = selectedDisease.geneId?.startsWith('ENSG') ? selectedDisease.geneId : selectedDisease.geneSymbol;
                        const isGeneId = selectedDisease.geneId?.startsWith('ENSG') || false;
                        if (identifier) {
                          loadGenomicSequence(identifier, selectedDisease.name, isGeneId);
                          setIsModalOpen(false);
                        }
                      }}
                      disabled={!selectedDisease.geneId && !selectedDisease.geneSymbol || loadingSequence !== null}
                      className="border-gray-600 text-white hover:bg-gray-800"
                    >
                      <Dna className="w-3 h-3 mr-1" />
                      Load Genome (GRCh38)
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const identifier = selectedDisease.geneId?.startsWith('ENSG') ? selectedDisease.geneId : selectedDisease.geneSymbol;
                        const isGeneId = selectedDisease.geneId?.startsWith('ENSG') || false;
                        if (identifier) {
                          loadGenomicSequence(identifier, selectedDisease.name, isGeneId, 'GRCh37');
                          setIsModalOpen(false);
                        }
                      }}
                      disabled={!selectedDisease.geneId && !selectedDisease.geneSymbol || loadingSequence !== null}
                      className="border-gray-600 text-white hover:bg-gray-800"
                    >
                      <Dna className="w-3 h-3 mr-1" />
                      Load Genome (GRCh37)
                    </Button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="border-gray-600 text-[rgba(0,0,0,1)] hover:bg-gray-800 px-[16px] py-[10px]"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}