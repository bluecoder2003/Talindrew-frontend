import React, { useState, useEffect, useMemo } from 'react';
import { Search, Info, Loader2, Database, Dna, MapPin, FileText, Sparkles, Globe, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import Fuse from 'fuse.js';

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
  phenotypes?: any[];
  location?: string;
  source?: string;
}

interface EnsemblGeneData {
  id: string;
  display_name: string;
  description: string;
  biotype: string;
  start: number;
  end: number;
  strand: number;
  seq_region_name: string;
  assembly_name: string;
}

interface EnsemblPhenotype {
  phenotype: string;
  source: string;
  accession: string;
  attributes?: any;
}

interface NCBIGeneResult {
  uid: string;
  name: string;
  description: string;
  chromosome: string;
  maplocation: string;
  summary: string;
}

interface DiseaseSearchEnhancedProps {
  onDiseaseSelect?: (disease: DiseaseInfo) => void;
  onSequenceLoad?: (sequence: string, name: string, description: string) => void;
}

export function DiseaseSearchEnhanced({ onDiseaseSelect, onSequenceLoad }: DiseaseSearchEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DiseaseInfo[]>([]);
  const [allDiseases, setAllDiseases] = useState<DiseaseInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDiseases, setIsLoadingDiseases] = useState(true);
  const [isPopulating, setIsPopulating] = useState(false);
  const [ncbiResults, setNcbiResults] = useState<NCBIGeneResult[]>([]);
  const [ensemblResults, setEnsemblResults] = useState<EnsemblGeneData[]>([]);
  const [showNCBIResults, setShowNCBIResults] = useState(false);
  const [showEnsemblResults, setShowEnsemblResults] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useFuzzySearch, setUseFuzzySearch] = useState(true);
  const [searchSource, setSearchSource] = useState<'all' | 'database' | 'ncbi' | 'ensembl'>('all');
  const [isEnsemblExpanded, setIsEnsemblExpanded] = useState(false);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (allDiseases.length === 0) return null;
    
    return new Fuse(allDiseases, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'geneSymbol', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'category', weight: 0.1 }
      ],
      threshold: 0.3, // Lower threshold = more strict matching
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true
    });
  }, [allDiseases]);

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

  const searchEnsembl = async (query: string) => {
    try {
      // First try to get gene data
      const geneResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/ensembl/gene/${query}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (geneResponse.ok) {
        const geneData = await geneResponse.json();
        
        // Get phenotypes for this gene
        const phenotypeResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/ensembl/phenotypes/${query}`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        });

        let phenotypes = [];
        if (phenotypeResponse.ok) {
          const phenotypeData = await phenotypeResponse.json();
          phenotypes = phenotypeData.phenotypes || [];
        }

        setEnsemblResults([{ ...geneData, phenotypes }]);
        setShowEnsemblResults(true);
      } else {
        setEnsemblResults([]);
        setShowEnsemblResults(false);
      }
    } catch (error) {
      console.error('Error searching Ensembl:', error);
      setEnsemblResults([]);
      setShowEnsemblResults(false);
    }
  };

  const createDiseaseFromEnsembl = async (geneData: EnsemblGeneData) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/ensembl/create-disease`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          geneSymbol: geneData.display_name,
          phenotypes: geneData.phenotypes || [],
          geneData: geneData
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Reload diseases to include the new entry
        await loadDiseases();
        console.log('Created disease from Ensembl data:', result);
      }
    } catch (error) {
      console.error('Error creating disease from Ensembl:', error);
    }
  };

  const searchDiseases = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(allDiseases.slice(0, 10));
      setShowNCBIResults(false);
      setShowEnsemblResults(false);
      return;
    }

    setIsSearching(true);
    try {
      let localResults: DiseaseInfo[] = [];

      // Search local database
      if (searchSource === 'all' || searchSource === 'database') {
        if (useFuzzySearch && fuse) {
          // Use Fuse.js for fuzzy search
          const fuseResults = fuse.search(query);
          localResults = fuseResults.map(result => result.item);
        } else {
          // Use exact search
          localResults = allDiseases.filter(disease =>
            disease.name.toLowerCase().includes(query.toLowerCase()) ||
            disease.geneSymbol.toLowerCase().includes(query.toLowerCase()) ||
            disease.description.toLowerCase().includes(query.toLowerCase())
          );
        }
      }

      setSearchResults(localResults);

      // Search NCBI if enabled
      if (searchSource === 'all' || searchSource === 'ncbi') {
        try {
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
          console.error('Error searching NCBI:', error);
        }
      }

      // Search Ensembl if enabled
      if (searchSource === 'all' || searchSource === 'ensembl') {
        await searchEnsembl(query);
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
  }, [searchQuery, allDiseases, useFuzzySearch, searchSource]);

  const loadSequenceFromEnsembl = async (geneId: string, geneName: string) => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/ensembl/sequence/${geneId}?type=genomic`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (onSequenceLoad && data.seq) {
          onSequenceLoad(data.seq, geneName, `Genomic sequence from Ensembl (${geneId})`);
        }
      }
    } catch (error) {
      console.error('Error loading sequence from Ensembl:', error);
    }
  };

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Enhanced Disease Search
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Search for genetic diseases using fuzzy search, NCBI, and Ensembl databases</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="fuzzy-search"
                checked={useFuzzySearch}
                onCheckedChange={setUseFuzzySearch}
              />
              <Label htmlFor="fuzzy-search" className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Fuzzy Search
              </Label>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="search-source">Search Source</Label>
              <Select value={searchSource} onValueChange={(value: any) => setSearchSource(value)}>
                <SelectTrigger id="search-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="database">Database Only</SelectItem>
                  <SelectItem value="ncbi">NCBI Only</SelectItem>
                  <SelectItem value="ensembl">Ensembl Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={populateDiseasesFromNCBI}
              disabled={isPopulating}
              variant="outline"
              size="sm"
            >
              {isPopulating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              {isPopulating ? 'Populating...' : 'Populate DB'}
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search diseases, genes, or symptoms... (e.g., 'cystic fibrosis', 'BRCA2', 'huntngton')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {allDiseases.length === 0 && !isLoadingDiseases && (
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                No diseases found in database. Click "Populate DB" to fetch common genetic diseases from NCBI.
              </AlertDescription>
            </Alert>
          )}

          {useFuzzySearch && searchQuery && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Fuzzy search enabled:</strong> Try partial matches like "huntngton" for "Huntington" or "cysti" for "Cystic Fibrosis"
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
                    {useFuzzySearch && <Badge variant="secondary" className="text-xs">Fuzzy</Badge>}
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
                              {disease.source && (
                                <Badge variant="outline" className="text-xs">
                                  {disease.source}
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
                    ))}
                  </div>
                </div>
              )}

              {/* Ensembl Results */}
              {showEnsemblResults && ensemblResults.length > 0 && (
                <div>
                  <Collapsible open={isEnsemblExpanded} onOpenChange={setIsEnsemblExpanded}>
                    <CollapsibleTrigger className="flex items-center gap-2 font-medium hover:text-primary">
                      <Globe className="w-4 h-4" />
                      Ensembl Results ({ensemblResults.length})
                      {isEnsemblExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {ensemblResults.map((gene) => (
                          <div
                            key={gene.id}
                            className="border rounded-lg p-3 hover:bg-accent transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{gene.display_name}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    Ensembl
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {gene.biotype}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    Chr {gene.seq_region_name}
                                  </div>
                                  <span>{gene.start}-{gene.end}</span>
                                  <span>Strand {gene.strand > 0 ? '+' : '-'}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {gene.description}
                                </p>
                                {gene.phenotypes && gene.phenotypes.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    <strong>Phenotypes:</strong> {gene.phenotypes.slice(0, 3).map((p: EnsemblPhenotype) => p.phenotype).join(', ')}
                                    {gene.phenotypes.length > 3 && ` (+${gene.phenotypes.length - 3} more)`}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => loadSequenceFromEnsembl(gene.id, gene.display_name)}
                                >
                                  Load Sequence
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  onClick={() => createDiseaseFromEnsembl(gene)}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add to DB
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
              {searchQuery && searchResults.length === 0 && !showNCBIResults && !showEnsemblResults && !isSearching && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No diseases found for "{searchQuery}"</p>
                  <p className="text-sm">Try different keywords{useFuzzySearch ? ', fuzzy search is enabled' : ', or enable fuzzy search'}.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disease Details Modal - Same as before */}
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
                    {selectedDisease.source && (
                      <div>
                        <span className="font-medium">Source:</span>
                        <Badge variant="outline" className="ml-2 border-gray-600 text-white bg-gray-800">
                          {selectedDisease.source}
                        </Badge>
                      </div>
                    )}
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

              {selectedDisease.phenotypes && selectedDisease.phenotypes.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Associated Phenotypes</h4>
                  <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto text-sm">
                    {selectedDisease.phenotypes.slice(0, 10).map((phenotype: any, index: number) => (
                      <div key={index} className="text-gray-300">
                        • {typeof phenotype === 'string' ? phenotype : phenotype.phenotype}
                      </div>
                    ))}
                    {selectedDisease.phenotypes.length > 10 && (
                      <div className="text-gray-400 text-xs">
                        +{selectedDisease.phenotypes.length - 10} more phenotypes
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
                <Button
                  onClick={() => onDiseaseSelect?.(selectedDisease)}
                  className="flex-1 bg-white text-black hover:bg-gray-200"
                >
                  Select Disease
                </Button>
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