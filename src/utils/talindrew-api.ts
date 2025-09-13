// Talindrew Gene API Service
// Based on the API integration guide

// Common interfaces
interface Header {
  type: string;
  version: string;
}

interface ErrorList {
  phrasesnotfound: string[];
  fieldsnotfound: string[];
}

interface WarningList {
  phrasesignored: string[];
  quotedphrasesnotfound: string[];
  outputmessages: string[];
}

// Gene Search Response
interface ESearchResult {
  count: string;
  retmax: string;
  retstart: string;
  idlist: string[];
  translationset: any[];
  translationstack: any[];
  querytranslation: string;
  errorlist?: ErrorList;
  warninglist?: WarningList;
}

export interface GeneSearchResponse {
  header: Header;
  esearchresult: ESearchResult;
}

// Gene Details Response
interface GenomicInfo {
  chrloc: string;
  chraccver: string;
  chrstart: number;
  chrstop: number;
  exoncount: number;
}

interface Organism {
  scientificname: string;
  commonname: string;
  taxid: number;
}

export interface GeneDetails {
  uid: string;
  name: string;
  description: string;
  chromosome: string;
  maplocation: string;
  summary: string;
  genomicinfo: GenomicInfo[];
  organism: Organism;
  // ... other fields
}

export interface GeneSummaryResponse {
  header: Header;
  result: {
    uids: string[];
    [geneId: string]: any; // Dynamic gene ID fields
  };
}

// Variant Details Response
interface VariationLoc {
  status: string;
  assembly_name: string;
  chr: string;
  band: string;
  start: string;
  stop: string;
  // ... other fields
}

export interface VariantDetails {
  uid: string;
  obj_type: string;
  accession: string;
  title: string;
  variation_set: Array<{
    measure_id: string;
    variation_name: string;
    cdna_change: string;
    variation_loc: VariationLoc[];
    variant_type: string;
    // ... other fields
  }>;
  genes: Array<{
    symbol: string;
    geneid: string;
    strand: string;
  }>;
  molecular_consequence_list: string[];
  protein_change: string;
  // ... other fields
}

// Sequence Response
export interface SequenceResponse {
  sequence_id: string;
  content: string;
  content_type: string;
}

export interface SequenceErrorResponse {
  error: string;
  sequence_id: string;
}

// Enzyme Detection Interfaces
export interface EnzymeDetectionRequest {
  sequence: string;
  enzymes?: string[];
}

export interface EnzymeCutSites {
  enzyme: string;
  positions: number[];
}

export interface EnzymeDetectionResponse {
  sequence_length: number;
  enzymes_analyzed: string[];
  cut_sites_found: EnzymeCutSites[];
  total_cut_sites: number;
}

// Disease Detection Interfaces
export interface DiseaseDetectionRequest {
  gene_symbol?: string;
  input_sequence: string;
}

export interface DiseaseAssociation {
  position: number;
  reference_base: string;
  alternative_base: string;
  clinvar_id: string;
  description: string;
}

export interface DiseaseDetectionResponse {
  gene_symbol?: string;
  input_sequence_length: number;
  reference_sequence_length: number;
  variants_detected: number;
  disease_associations: DiseaseAssociation[];
}

// Comprehensive Gene Analysis Interfaces
export interface GeneAnalysisRequest {
  gene_symbol: string;
  input_sequence?: string;
  detect_diseases: boolean;
  detect_enzymes: boolean;
  enzymes?: string[];
}

export interface GeneAnalysisResponse {
  gene_symbol: string;
  sequence_length: number;
  sequence_source: string;
  diseases_detected: DiseaseAssociation[];
  enzyme_cut_sites: { [enzyme: string]: number[] };
  variants_detected: number;
  analysis_timestamp: string;
}

// Error Response Interfaces
export interface AnalysisErrorResponse {
  error: string;
  gene_symbol?: string;
  sequence_length?: number;
}

class TalindrewGeneAPIService {
  private baseURL: string;

  constructor(baseURL: string = 'https://talindrew.glowzaar.com/api/v1') {
    this.baseURL = baseURL;
  }

  private async makeRequest<T>(endpoint: string, options?: RequestInit, retries: number = 2): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}${endpoint}`, options);
        
        if (!response.ok) {
          // Don't retry on client errors (4xx), but do retry on server errors (5xx)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // For server errors and rate limiting, retry with exponential backoff
          if (attempt < retries && (response.status >= 500 || response.status === 429)) {
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s...
            console.log(`API request failed with status ${response.status}, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        // For network errors, retry with exponential backoff
        if (attempt < retries && (error instanceof TypeError || error.message.includes('fetch'))) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Network error, retrying in ${delay}ms... (attempt ${attempt + 1}/${retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        console.error('API request failed:', error);
        throw error;
      }
    }
    
    throw new Error('All retry attempts failed');
  }

  // 1. Search Genes
  async searchGenes(term: string, retmax: number = 10): Promise<GeneSearchResponse> {
    const params = new URLSearchParams({
      term,
      retmax: retmax.toString()
    });
    
    return this.makeRequest<GeneSearchResponse>(`/gene/search?${params}`);
  }

  // 2. Get Gene Details
  async getGeneDetails(geneId: string): Promise<GeneSummaryResponse> {
    return this.makeRequest<GeneSummaryResponse>(`/gene/${geneId}`);
  }

  // 3. Search Variants
  async searchVariants(term: string, retmax: number = 10): Promise<GeneSearchResponse> {
    const params = new URLSearchParams({
      term,
      retmax: retmax.toString()
    });
    
    return this.makeRequest<GeneSearchResponse>(`/gene/variants/search?${params}`);
  }

  // 4. Get Variant Details
  async getVariantDetails(variantId: string): Promise<{ header: Header; result: { uids: string[]; [key: string]: any } }> {
    return this.makeRequest(`/gene/variants/${variantId}`);
  }

  // 5. Get Sequence Data
  async getSequenceData(sequenceId: string): Promise<SequenceResponse | SequenceErrorResponse> {
    return this.makeRequest(`/gene/sequence/${sequenceId}`);
  }

  // 6. Detect Enzyme Cut Sites
  async detectEnzymes(request: EnzymeDetectionRequest): Promise<EnzymeDetectionResponse> {
    return this.makeRequest<EnzymeDetectionResponse>(`/gene/detect-enzymes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
  }

  // 7. Detect Disease-Associated Variants
  async detectDiseases(request: DiseaseDetectionRequest): Promise<DiseaseDetectionResponse | AnalysisErrorResponse> {
    return this.makeRequest<DiseaseDetectionResponse | AnalysisErrorResponse>(`/gene/detect-diseases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
  }

  // 8. Comprehensive Gene Analysis
  async analyzeGene(request: GeneAnalysisRequest): Promise<GeneAnalysisResponse | AnalysisErrorResponse> {
    return this.makeRequest<GeneAnalysisResponse | AnalysisErrorResponse>(`/gene/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
  }

  // Helper method to get gene details from search results
  async getMultipleGeneDetails(geneIds: string[]): Promise<GeneDetails[]> {
    try {
      const detailsPromises = geneIds.map(async (geneId) => {
        try {
          const response = await this.getGeneDetails(geneId);
          return response.result[geneId] as GeneDetails;
        } catch (error) {
          console.warn(`Failed to fetch details for gene ${geneId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(detailsPromises);
      return results.filter((result): result is GeneDetails => result !== null);
    } catch (error) {
      console.error('Error fetching multiple gene details:', error);
      return [];
    }
  }
}

// Create service instance
export const talindrewAPI = new TalindrewGeneAPIService();

// Error handling helper
export const handleAPIError = (error: any): string => {
  if (error.message && error.message.includes('HTTP error! status: 503')) {
    return 'Talindrew Gene API is currently unavailable (503). The service may be under maintenance or experiencing high load. Please try again in a few minutes.';
  }
  
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 503:
        return 'Talindrew Gene API is currently unavailable. The service may be under maintenance or experiencing high load. Please try again in a few minutes.';
      case 500:
        return 'Internal server error occurred. Please try again.';
      case 404:
        return 'The requested resource was not found.';
      case 429:
        return 'API rate limit exceeded. Please wait a moment before trying again.';
      default:
        return `Server error: ${error.response.status}`;
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your internet connection.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};