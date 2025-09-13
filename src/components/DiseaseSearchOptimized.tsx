import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Info, Loader2, Database, Dna, MapPin, FileText, X, Zap, Clock, TrendingUp, ExternalLink, TestTube, AlertTriangle } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { ensemblAPI } from '../utils/ensemblApi';
import { ncbiCache, batchRequester } from '../utils/apiCache';
import { useGeneSearch, useVariantSearch, useSequenceData } from '../utils/talindrew-hooks';
import { GeneDetails } from '../utils/talindrew-api';

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

// Enhanced interface for Talindrew Gene Results
interface TalindrewGeneResult extends GeneDetails {
  // Additional computed fields for display
  displayName?: string;
  relevanceScore?: number;
}

interface DiseaseSearchOptimizedProps {
  onDiseaseSelect?: (disease: DiseaseInfo) => void;
  onSequenceLoad?: (sequence: string, name: string, description: string) => void;
}

export function DiseaseSearchOptimized({ onDiseaseSelect, onSequenceLoad }: DiseaseSearchOptimizedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiseaseInfo[]>([]);
  const [allDiseases, setAllDiseases] = useState<DiseaseInfo[]>([]);
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
  const [assembly, setAssembly] = useState<'GRCh38' | 'GRCh37'>('GRCh38');
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [searchMode, setSearchMode] = useState<'local' | 'talindrew' | 'variants'>('talindrew');

  // Talindrew API hooks
  const { 
    data: talindrewGeneData, 
    geneDetails: talindrewGeneDetails, 
    loading: talindrewLoading, 
    error: talindrewError, 
    search: searchTalindrewGenes,
    clear: clearTalindrewResults
  } = useGeneSearch();

  const { 
    data: variantData, 
    loading: variantLoading, 
    error: variantError, 
    search: searchVariants,
    clear: clearVariantResults
  } = useVariantSearch();

  const { 
    sequence: fetchedSequence, 
    loading: sequenceLoading, 
    error: sequenceError, 
    fetchSequence, 
    clear: clearSequence
  } = useSequenceData();

  // Refs for optimization
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchQuery = useRef<string>('');

  // Load diseases from database on component mount
  useEffect(() => {
    loadDiseases();
    
    // Disable cache warm-up by default to prevent performance issues
    ensemblAPI.disableWarmUp();
    
    // Update cache stats periodically
    const statsInterval = setInterval(updateCacheStats, 10000);
    return () => clearInterval(statsInterval);
  }, []);

  const updateCacheStats = useCallback(() => {
    setCacheStats(ensemblAPI.getCacheStats());
  }, []);

  const loadDiseases = async () => {
    try {
      setIsLoadingDiseases(true);
      
      // Use caching for disease list
      const diseases = await ncbiCache.get('disease_list', async () => {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/diseases`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          return response.json();
        } else {
          return {};
        }
      }, 5 * 60 * 1000); // 5 minutes cache

      const diseaseArray = Object.entries(diseases).map(([key, data]: [string, any]) => ({
        key,
        ...data
      }));
      
      setAllDiseases(diseaseArray);
      setSearchResults(diseaseArray.slice(0, 10)); // Show first 10 by default
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
        // Clear cache and reload
        ncbiCache.clear();
        await loadDiseases();
      }
    } catch (error) {
      console.error('Error populating diseases:', error);
    } finally {
      setIsPopulating(false);
    }
  };

  // Enhanced search function supporting multiple sources
  const searchDiseases = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(allDiseases.slice(0, 10));
      setShowNCBIResults(false);
      clearTalindrewResults();
      clearVariantResults();
      return;
    }

    // Skip if same query as last search
    if (query === lastSearchQuery.current) {
      return;
    }
    lastSearchQuery.current = query;

    try {
      if (searchMode === 'local') {
        // Local database search
        const localResults = allDiseases.filter(disease =>
          disease.name.toLowerCase().includes(query.toLowerCase()) ||
          disease.geneSymbol.toLowerCase().includes(query.toLowerCase()) ||
          disease.description.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(localResults);
        setShowNCBIResults(false);
        
      } else if (searchMode === 'talindrew') {
        // Talindrew Gene API search
        searchTalindrewGenes(query, 10);
        
        // Also search local results for comparison
        const localResults = allDiseases.filter(disease =>
          disease.name.toLowerCase().includes(query.toLowerCase()) ||
          disease.geneSymbol.toLowerCase().includes(query.toLowerCase()) ||
          disease.description.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(localResults);
        
      } else if (searchMode === 'variants') {
        // Variant search
        searchVariants(query, 10);
      }

      // NCBI search (cached and batched) - kept for comparison
      const ncbiResults = await batchRequester.add(() =>
        ncbiCache.get(`ncbi_search_${query}`, async () => {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/ncbi/search-genes?disease=${encodeURIComponent(query)}&retmax=5`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.esearchresult?.idlist?.length > 0) {
              // Fetch details in parallel
              const geneDetails = await Promise.all(
                data.esearchresult.idlist.slice(0, 3).map(async (geneId: string) => {
                  try {
                    const detailsResponse = await fetch(
                      `https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/ncbi/gene-details/${geneId}`,
                      {
                        headers: {
                          'Authorization': `Bearer ${publicAnonKey}`,
                          'Content-Type': 'application/json'
                        }
                      }
                    );

                    if (detailsResponse.ok) {
                      const detailsData = await detailsResponse.json();
                      return detailsData.result[geneId];
                    }
                  } catch (error) {
                    console.warn('Error fetching gene details:', error);
                  }
                  return null;
                })
              );

              return geneDetails.filter(Boolean);
            }
          }
          return [];
        }, 10 * 60 * 1000) // 10 minutes cache for NCBI searches
      );

      setNcbiResults(ncbiResults);
      setShowNCBIResults(ncbiResults.length > 0);

    } catch (error) {
      console.error('Error searching diseases:', error);
    }
  }, [allDiseases, searchMode, searchTalindrewGenes, searchVariants, clearTalindrewResults, clearVariantResults]);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchDiseases(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchDiseases]);

  // Overall loading state
  const isSearching = talindrewLoading || variantLoading || sequenceLoading;

  // Optimized sequence loading with the enhanced Ensembl API
  const loadGenomicSequence = async (identifier: string, name: string, isGeneId: boolean = false) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const newAbortController = new AbortController();
    abortControllerRef.current = newAbortController;

    try {
      setLoadingSequence(identifier);
      setSequenceProgress({ step: '🚀 Initializing...', progress: 0 });

      const onProgress = (step: string, progress: number) => {
        setSequenceProgress({ step, progress });
      };

      let sequenceData;
      if (isGeneId && identifier.startsWith('ENSG')) {
        sequenceData = await ensemblAPI.getGenomicSequenceById(
          identifier,
          assembly,
          onProgress,
          newAbortController.signal
        );
      } else {
        sequenceData = await ensemblAPI.getGenomicSequenceBySymbol(
          identifier,
          assembly,
          onProgress,
          newAbortController.signal
        );
      }

      if (onSequenceLoad && sequenceData.sequence) {
        const description = `Genomic sequence from Ensembl (${assembly}) | ${sequenceData.geneInfo.display_name} | Chr${sequenceData.geneInfo.seq_region_name}:${sequenceData.geneInfo.start}-${sequenceData.geneInfo.end} | ${sequenceData.length.toLocaleString()} bp (${sequenceData.sizeKb} kb) | ${sequenceData.geneInfo.biotype}`;

        // Use requestIdleCallback for large sequences
        if ('requestIdleCallback' in window && sequenceData.length > 100000) {
          requestIdleCallback(() => {
            onSequenceLoad(sequenceData.sequence, `${name} Genomic Sequence`, description);
          });
        } else {
          setTimeout(() => {
            onSequenceLoad(sequenceData.sequence, `${name} Genomic Sequence`, description);
          }, 100);
        }
      }

      // Update cache stats after successful load
      updateCacheStats();

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 Sequence loading cancelled');
        return;
      }

      console.error('❌ Error loading genomic sequence:', error);
      setSequenceProgress({
        step: `❌ Error: ${error.message || 'Failed to load sequence'}`,
        progress: 0
      });

      setTimeout(() => {
        setSequenceProgress(null);
      }, 5000);
    } finally {
      setLoadingSequence(null);
      abortControllerRef.current = null;
      
      setTimeout(() => {
        setSequenceProgress(null);
      }, 2000);
    }
  };

  const cancelSequenceLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoadingSequence(null);
      setSequenceProgress(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Memoized search results to prevent unnecessary re-renders
  const displayResults = useMemo(() => {
    return searchResults.slice(0, 20); // Limit results for performance
  }, [searchResults]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-wrap">
            <Search className="w-5 h-5" />
            Enhanced Gene & Disease Search
            <Badge variant="outline" className="text-xs">
              <Zap className="w-3 h-3 mr-1" />
              Optimized
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Talindrew API
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Multi-source search with Talindrew Gene API, genetic variants, and local caching</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Performance Stats */}
          {cacheStats && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Cache: {cacheStats.total?.entries || 0} entries</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Pending: {cacheStats.total?.pending || 0}</span>
              </div>
              {cacheStats.total?.warmedUp && (
                <div className="flex items-center gap-1 text-green-600">
                  <Zap className="w-3 h-3" />
                  <span>Warmed</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => ensemblAPI.clearCaches()}
                className="text-xs h-6 px-2"
              >
                Clear Cache
              </Button>
              {!ensemblAPI.isWarmUpComplete() && (
                <Button
                  variant="ghost" 
                  size="sm"
                  onClick={() => ensemblAPI.warmUpCommonGenes()}
                  className="text-xs h-6 px-2 text-blue-600"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Warm Cache
                </Button>
              )}
            </div>
          )}

          {/* Search Mode Selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex rounded-md border overflow-hidden">
              <Button
                variant={searchMode === 'talindrew' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchMode('talindrew')}
                className="rounded-none text-xs"
              >
                <TestTube className="w-3 h-3 mr-1" />
                Gene Search
              </Button>
              <Button
                variant={searchMode === 'variants' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchMode('variants')}
                className="rounded-none text-xs"
              >
                <Dna className="w-3 h-3 mr-1" />
                Variants
              </Button>
              <Button
                variant={searchMode === 'local' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSearchMode('local')}
                className="rounded-none text-xs"
              >
                <Database className="w-3 h-3 mr-1" />
                Local DB
              </Button>
            </div>
            <Badge variant="outline" className="text-xs">
              <ExternalLink className="w-3 h-3 mr-1" />
              Powered by Talindrew API
            </Badge>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={
                  searchMode === 'talindrew' ? "Search genes (e.g., BRCA1, parkinsons, alzheimer)..." :
                  searchMode === 'variants' ? "Search genetic variants (e.g., p.Glu6Val, rs6025)..." :
                  "Search local database..."
                }
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
                <div className="flex items-start space-x-3 flex-1">
                  <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <AlertDescription className="text-foreground">
                      <div className="flex items-center gap-2 mb-2">
                        <Dna className="w-4 h-4 text-primary shrink-0" />
                        <strong className="truncate">Loading genomic sequence for {loadingSequence}</strong>
                      </div>
                      {sequenceProgress && (
                        <div className="space-y-3">
                          <div className="text-sm text-muted-foreground">
                            {sequenceProgress.step}
                          </div>
                          <div className="space-y-2">
                            <Progress value={sequenceProgress.progress} className="h-2" />
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
                  className="text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Alert>
          )}

          {!searchQuery && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Enhanced Search Capabilities:</strong></p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li><strong>Gene Search:</strong> Find genes by name, symbol, or disease association using the Talindrew Gene API</li>
                    <li><strong>Variants:</strong> Search genetic variants and mutations from ClinVar database</li>
                    <li><strong>Local DB:</strong> Search your cached disease sequences and NCBI results</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Click "Load Genome" to fetch complete genomic sequences from Ensembl with optimized caching.
                  </p>
                </div>
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
              {/* Error Messages */}
              {talindrewError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Gene Search Error:</strong> {talindrewError}
                  </AlertDescription>
                </Alert>
              )}
              
              {variantError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Variant Search Error:</strong> {variantError}
                  </AlertDescription>
                </Alert>
              )}

              {/* Talindrew Gene Results */}
              {searchMode === 'talindrew' && talindrewGeneDetails.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TestTube className="w-4 h-4" />
                    Talindrew Gene Results ({talindrewGeneDetails.length})
                    <Badge variant="secondary" className="text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      API
                    </Badge>
                    {talindrewGeneData && (
                      <Badge variant="outline" className="text-xs">
                        {talindrewGeneData.esearchresult.count} total found
                      </Badge>
                    )}
                  </h4>
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {talindrewGeneDetails.map((gene) => (
                      <div
                        key={gene.uid}
                        className="border rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => {
                          // Convert to DiseaseInfo format for compatibility
                          const diseaseInfo: DiseaseInfo = {
                            key: gene.uid,
                            name: gene.name || gene.description,
                            geneSymbol: gene.name,
                            description: gene.summary || gene.description,
                            chromosome: gene.chromosome || '',
                            maplocation: gene.maplocation || '',
                            geneId: gene.uid,
                            organism: gene.organism?.commonname || gene.organism?.scientificname || 'Unknown'
                          };
                          onDiseaseSelect?.(diseaseInfo);
                        }}
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium truncate">{gene.name}</span>
                              <Badge variant="outline" className="text-xs shrink-0">
                                ID: {gene.uid}
                              </Badge>
                              {gene.chromosome && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  Chr{gene.chromosome}
                                </Badge>
                              )}
                              {gene.maplocation && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {gene.maplocation}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {gene.description}
                            </p>
                            {gene.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                <strong>Summary:</strong> {gene.summary}
                              </p>
                            )}
                            {gene.organism && (
                              <p className="text-xs text-muted-foreground mt-1">
                                <strong>Organism:</strong> {gene.organism.commonname || gene.organism.scientificname}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 md:ml-4 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadGenomicSequence(gene.name || gene.uid, gene.name || gene.description, true);
                              }}
                              disabled={!!loadingSequence}
                              className="text-xs w-full md:w-auto"
                            >
                              <Dna className="w-3 h-3 mr-1" />
                              Load Genome
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Variant Results */}
              {searchMode === 'variants' && variantData && variantData.esearchresult.idlist.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Dna className="w-4 h-4" />
                    Genetic Variants ({variantData.esearchresult.count})
                    <Badge variant="secondary" className="text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Talindrew API
                    </Badge>
                  </h4>
                  <div className="grid gap-2 max-h-96 overflow-y-auto">
                    {variantData.esearchresult.idlist.map((variantId) => (
                      <div
                        key={variantId}
                        className="border rounded-lg p-3 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Variant ID: {variantId}</span>
                          <Badge variant="outline" className="text-xs">
                            ClinVar
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Click to view variant details and associated genes
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Local Database Results */}
              {searchMode === 'local' && displayResults.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Local Database Results ({displayResults.length})
                    {searchQuery && (
                      <Badge variant="secondary" className="text-xs">
                        Cached
                      </Badge>
                    )}
                  </h4>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {displayResults.map((disease) => (
                      <div
                        key={disease.key}
                        className="border rounded-lg p-3 hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => onDiseaseSelect?.(disease)}
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium truncate">{disease.name}</span>
                              {disease.geneSymbol && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {disease.geneSymbol}
                                </Badge>
                              )}
                              {disease.chromosome && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  Chr{disease.chromosome}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {disease.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 md:ml-4 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadGenomicSequence(disease.geneSymbol || disease.primaryGene || disease.geneId, disease.name);
                              }}
                              disabled={!!loadingSequence}
                              className="text-xs w-full md:w-auto"
                            >
                              <Dna className="w-3 h-3 mr-1" />
                              Load Genome
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NCBI Results (Legacy - shown for comparison) */}
              {showNCBIResults && ncbiResults.length > 0 && searchMode === 'local' && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    NCBI Results ({ncbiResults.length})
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Cached 10min
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Legacy
                    </Badge>
                  </h4>
                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {ncbiResults.map((gene) => (
                      <div
                        key={gene.uid}
                        className="border rounded-lg p-3 hover:bg-accent transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium truncate">{gene.name}</span>
                              {gene.chromosome && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  Chr{gene.chromosome}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {gene.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1 md:ml-4 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                loadGenomicSequence(gene.name, gene.name);
                              }}
                              disabled={!!loadingSequence}
                              className="text-xs w-full md:w-auto"
                            >
                              <Dna className="w-3 h-3 mr-1" />
                              Load Genome
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Messages */}
              {searchQuery && !isSearching && (
                <>
                  {searchMode === 'talindrew' && talindrewGeneDetails.length === 0 && !talindrewError && (
                    <Alert>
                      <Search className="h-4 w-4" />
                      <AlertDescription>
                        No genes found for "{searchQuery}" in the Talindrew database. Try different search terms or check spelling.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {searchMode === 'variants' && (!variantData || variantData.esearchresult.idlist.length === 0) && !variantError && (
                    <Alert>
                      <Dna className="h-4 w-4" />
                      <AlertDescription>
                        No genetic variants found for "{searchQuery}". Try searching with gene symbols (e.g., BRCA1) or variant notations (e.g., p.Glu6Val).
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {searchMode === 'local' && displayResults.length === 0 && !showNCBIResults && (
                    <Alert>
                      <Database className="h-4 w-4" />
                      <AlertDescription>
                        No results found in local database for "{searchQuery}". Try the Gene Search or Variants mode for broader results.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}