import { useState, useEffect, useCallback } from 'react';
import { 
  talindrewAPI, 
  GeneSearchResponse, 
  GeneSummaryResponse, 
  GeneDetails,
  EnzymeDetectionRequest,
  EnzymeDetectionResponse,
  DiseaseDetectionRequest,
  DiseaseDetectionResponse,
  GeneAnalysisRequest,
  GeneAnalysisResponse,
  AnalysisErrorResponse,
  handleAPIError 
} from './talindrew-api';

// Custom Hook for Gene Search
export interface UseGeneSearchResult {
  data: GeneSearchResponse | null;
  geneDetails: GeneDetails[];
  loading: boolean;
  error: string | null;
  search: (term: string, retmax?: number) => void;
  clear: () => void;
}

export const useGeneSearch = (): UseGeneSearchResult => {
  const [data, setData] = useState<GeneSearchResponse | null>(null);
  const [geneDetails, setGeneDetails] = useState<GeneDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (term: string, retmax: number = 10) => {
    if (!term.trim()) return;
    
    setLoading(true);
    setError(null);
    setGeneDetails([]);
    
    try {
      // First, search for genes
      const searchResult = await talindrewAPI.searchGenes(term, retmax);
      setData(searchResult);

      // Then fetch details for each gene found
      if (searchResult.esearchresult.idlist.length > 0) {
        const details = await talindrewAPI.getMultipleGeneDetails(
          searchResult.esearchresult.idlist.slice(0, Math.min(5, retmax)) // Limit to 5 detailed results
        );
        setGeneDetails(details);
      }

    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Gene search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setGeneDetails([]);
    setError(null);
  }, []);

  return { data, geneDetails, loading, error, search, clear };
};

// Custom Hook for Gene Details
export interface UseGeneDetailsResult {
  data: GeneSummaryResponse | null;
  geneDetails: GeneDetails | null;
  loading: boolean;
  error: string | null;
}

export const useGeneDetails = (geneId: string | null): UseGeneDetailsResult => {
  const [data, setData] = useState<GeneSummaryResponse | null>(null);
  const [geneDetails, setGeneDetails] = useState<GeneDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!geneId) return;

    const fetchGeneDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await talindrewAPI.getGeneDetails(geneId);
        setData(result);
        
        // Extract the specific gene details
        const details = result.result[geneId] as GeneDetails;
        setGeneDetails(details);
      } catch (err) {
        const errorMessage = handleAPIError(err);
        setError(errorMessage);
        console.error('Gene details error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeneDetails();
  }, [geneId]);

  return { data, geneDetails, loading, error };
};

// Custom Hook for Variant Search
export interface UseVariantSearchResult {
  data: GeneSearchResponse | null;
  loading: boolean;
  error: string | null;
  search: (term: string, retmax?: number) => void;
  clear: () => void;
}

export const useVariantSearch = (): UseVariantSearchResult => {
  const [data, setData] = useState<GeneSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (term: string, retmax: number = 10) => {
    if (!term.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await talindrewAPI.searchVariants(term, retmax);
      setData(result);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Variant search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, search, clear };
};

// Custom Hook for Sequence Data
export interface UseSequenceDataResult {
  sequence: string | null;
  loading: boolean;
  error: string | null;
  fetchSequence: (sequenceId: string) => void;
  clear: () => void;
}

export const useSequenceData = (): UseSequenceDataResult => {
  const [sequence, setSequence] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSequence = useCallback(async (sequenceId: string) => {
    if (!sequenceId.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await talindrewAPI.getSequenceData(sequenceId);
      
      if ('error' in result) {
        setError(result.error);
        setSequence(null);
      } else {
        setSequence(result.content);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Sequence fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setSequence(null);
    setError(null);
  }, []);

  return { sequence, loading, error, fetchSequence, clear };
};

// Custom Hook for Enzyme Detection
export interface UseEnzymeDetectionResult {
  data: EnzymeDetectionResponse | null;
  loading: boolean;
  error: string | null;
  detect: (sequence: string, enzymes?: string[]) => Promise<void>;
  clear: () => void;
}

export const useEnzymeDetection = (): UseEnzymeDetectionResult => {
  const [data, setData] = useState<EnzymeDetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async (sequence: string, enzymes?: string[]) => {
    if (!sequence.trim()) {
      setError('Sequence is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await talindrewAPI.detectEnzymes({ sequence, enzymes });
      setData(result);
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Enzyme detection error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, detect, clear };
};

// Custom Hook for Disease Detection
export interface UseDiseaseDetectionResult {
  data: DiseaseDetectionResponse | null;
  loading: boolean;
  error: string | null;
  detect: (geneSymbol: string | undefined, inputSequence: string) => Promise<void>;
  clear: () => void;
}

export const useDiseaseDetection = (): UseDiseaseDetectionResult => {
  const [data, setData] = useState<DiseaseDetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async (geneSymbol: string | undefined, inputSequence: string) => {
    if (!inputSequence.trim()) {
      setError('Input sequence is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await talindrewAPI.detectDiseases({ 
        gene_symbol: geneSymbol, 
        input_sequence: inputSequence 
      });

      // Check if result is an error response
      if ('error' in result) {
        setError(result.error);
        setData(null);
      } else {
        setData(result as DiseaseDetectionResponse);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Disease detection error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, detect, clear };
};

// Custom Hook for Gene Analysis
export interface UseGeneAnalysisResult {
  data: GeneAnalysisResponse | null;
  loading: boolean;
  error: string | null;
  analyze: (request: GeneAnalysisRequest) => Promise<void>;
  clear: () => void;
}

export const useGeneAnalysis = (): UseGeneAnalysisResult => {
  const [data, setData] = useState<GeneAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (request: GeneAnalysisRequest) => {
    if (!request.gene_symbol.trim()) {
      setError('Gene symbol is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await talindrewAPI.analyzeGene(request);

      // Check if result is an error response
      if ('error' in result) {
        setError(result.error);
        setData(null);
      } else {
        setData(result as GeneAnalysisResponse);
      }
    } catch (err) {
      const errorMessage = handleAPIError(err);
      setError(errorMessage);
      console.error('Gene analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, analyze, clear };
};