// Optimized Ensembl API Service
// Implements caching, request optimization, and performance monitoring

import { ensemblCache, geneCache, optimizedFetch, batchRequester } from './apiCache';
import { PerformanceMonitor } from './performance';

export interface EnsemblGeneInfo {
  id: string;
  display_name: string;
  seq_region_name: string;
  start: number;
  end: number;
  strand: number;
  biotype: string;
  description?: string;
  canonical_transcript?: string;
}

export interface GenomicSequenceResult {
  sequence: string;
  geneInfo: EnsemblGeneInfo;
  region: string;
  assembly: string;
  length: number;
  sizeKb: string;
  sizeMb: string;
}

export interface ProgressCallback {
  (step: string, progress: number): void;
}

export class EnsemblAPIService {
  private readonly baseUrls = {
    GRCh38: 'https://rest.ensembl.org',
    GRCh37: 'https://grch37.rest.ensembl.org'
  };

  private readonly requestTimeout = 15000; // 15 seconds
  private readonly maxRetries = 2;

  private cacheWarmedUp = false;

  constructor() {
    // Don't warm up cache immediately - do it on first use instead
    // this.warmUpCache();
  }

  // Look up gene by ID with caching and optimization
  async lookupGeneById(
    geneId: string, 
    assembly: 'GRCh38' | 'GRCh37' = 'GRCh38',
    signal?: AbortSignal
  ): Promise<EnsemblGeneInfo> {
    const cacheKey = `gene_id_${geneId}_${assembly}`;
    
    return geneCache.get(cacheKey, async () => {
      return PerformanceMonitor.measureAsync(`Ensembl Gene Lookup: ${geneId}`, async () => {
        if (!geneId?.trim()) {
          throw new Error('Gene ID is required');
        }

        const baseUrl = this.baseUrls[assembly];
        const sanitizedGeneId = encodeURIComponent(geneId.trim());
        const url = `${baseUrl}/lookup/id/${sanitizedGeneId}?content-type=application/json`;

        console.log(`🔍 Looking up gene: ${geneId} (${assembly})`);

        const response = await optimizedFetch(url, {
          signal,
          headers: { 'Content-Type': 'application/json' }
        }, this.requestTimeout, this.maxRetries);

        const data = await response.json();

        if (!data?.id) {
          throw new Error('Invalid gene data received from Ensembl');
        }

        console.log(`✅ Gene lookup successful: ${data.display_name}`);
        return data;
      });
    }, 15 * 60 * 1000); // 15 minutes cache
  }

  // Look up gene by symbol with caching and optimization
  async lookupGeneBySymbol(
    geneSymbol: string, 
    assembly: 'GRCh38' | 'GRCh37' = 'GRCh38',
    signal?: AbortSignal
  ): Promise<EnsemblGeneInfo> {
    // Trigger intelligent cache warm-up on first use
    this.intelligentWarmUp(geneSymbol);
    
    const cacheKey = `gene_symbol_${geneSymbol}_${assembly}`;
    
    return geneCache.get(cacheKey, async () => {
      return PerformanceMonitor.measureAsync(`Gene Symbol Lookup: ${geneSymbol}`, async () => {
        if (!geneSymbol?.trim()) {
          throw new Error('Gene symbol is required');
        }

        const baseUrl = this.baseUrls[assembly];
        const sanitizedSymbol = encodeURIComponent(geneSymbol.trim().toUpperCase());
        const url = `${baseUrl}/lookup/symbol/homo_sapiens/${sanitizedSymbol}?content-type=application/json`;

        console.log(`🔍 Looking up gene symbol: ${geneSymbol} (${assembly})`);

        const response = await optimizedFetch(url, {
          signal,
          headers: { 'Content-Type': 'application/json' }
        }, this.requestTimeout, this.maxRetries);

        const data = await response.json();

        if (!data?.id) {
          throw new Error(`Gene symbol "${geneSymbol}" not found`);
        }

        console.log(`✅ Gene symbol lookup successful: ${data.display_name} (${data.id})`);
        return data;
      });
    }, 30 * 60 * 1000); // 30 minutes cache for symbols
  }

  // Fetch genomic sequence with optimizations
  async fetchGenomicSequence(
    region: string,
    assembly: 'GRCh38' | 'GRCh37' = 'GRCh38',
    signal?: AbortSignal
  ): Promise<string> {
    const cacheKey = `sequence_${region}_${assembly}`;
    
    return ensemblCache.get(cacheKey, async () => {
      return PerformanceMonitor.measureAsync(`Ensembl Sequence Fetch: ${region}`, async () => {
        const baseUrl = this.baseUrls[assembly];
        const url = `${baseUrl}/sequence/region/homo_sapiens/${region}?content-type=text/plain`;

        console.log(`🧬 Fetching sequence for region: ${region} (${assembly})`);

        const response = await optimizedFetch(url, {
          signal,
          headers: { 'Content-Type': 'text/plain' }
        }, this.requestTimeout * 2, this.maxRetries); // Longer timeout for sequences

        const sequence = await response.text();

        if (!sequence?.trim()) {
          throw new Error('Empty sequence received from Ensembl');
        }

        console.log(`✅ Sequence fetch successful: ${sequence.length.toLocaleString()} bp`);
        return sequence.replace(/\s/g, ''); // Clean whitespace
      });
    }, 10 * 60 * 1000); // 10 minutes cache for sequences
  }

  // Combined optimized method for getting gene sequence by ID
  async getGenomicSequenceById(
    geneId: string,
    assembly: 'GRCh38' | 'GRCh37' = 'GRCh38',
    onProgress?: ProgressCallback,
    signal?: AbortSignal
  ): Promise<GenomicSequenceResult> {
    try {
      onProgress?.('🔍 Looking up gene information...', 20);

      // Use batch requester for gene lookup
      const geneInfo = await batchRequester.add(() => 
        this.lookupGeneById(geneId, assembly, signal)
      );

      // Calculate sequence info
      const sequenceLength = geneInfo.end - geneInfo.start;
      const sizeKb = (sequenceLength / 1000).toFixed(1);
      const sizeMb = (sequenceLength / 1000000).toFixed(2);

      let progressMessage = `📍 Found ${geneInfo.display_name} on Chr${geneInfo.seq_region_name}`;
      if (sequenceLength > 1000000) {
        progressMessage += ` (${sizeMb}MB - Large sequence)`;
      } else {
        progressMessage += ` (${sizeKb}kb)`;
      }

      onProgress?.(progressMessage, 40);

      // Add appropriate delay based on sequence size
      if (sequenceLength > 10000000) {
        console.warn(`⚠️ Very large sequence: ${sizeMb}MB`);
        onProgress?.(`⚠️ Very large sequence (${sizeMb}MB) - This may take longer`, 40);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else if (sequenceLength > 1000000) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Construct region
      const region = `${geneInfo.seq_region_name}:${geneInfo.start}..${geneInfo.end}:1`;

      onProgress?.('🧬 Downloading genomic sequence...', 70);

      // Use batch requester for sequence fetch
      const sequence = await batchRequester.add(() =>
        this.fetchGenomicSequence(region, assembly, signal)
      );

      onProgress?.('⚙️ Processing sequence data...', 90);

      // Process large sequences with chunking if needed
      let cleanSequence: string;
      if (sequence.length > 100000) {
        cleanSequence = await PerformanceMonitor.processLargeSequenceWithProgress(
          sequence,
          25000,
          (chunk) => chunk.replace(/\s/g, ''),
          (processed, total) => {
            if (total > 1000000) {
              const progressPercent = Math.round((processed / total) * 10);
              onProgress?.(
                `⚙️ Processing large sequence... ${((processed / total) * 100).toFixed(1)}%`,
                90 + progressPercent
              );
            }
          }
        );
      } else {
        cleanSequence = sequence;
      }

      onProgress?.('✅ Complete!', 100);

      return {
        sequence: cleanSequence,
        geneInfo,
        region,
        assembly,
        length: cleanSequence.length,
        sizeKb,
        sizeMb
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 Gene sequence fetch cancelled');
        throw error;
      }

      console.error('❌ Error fetching genomic sequence:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('404')) {
        throw new Error(`Gene ID "${geneId}" not found in ${assembly} assembly`);
      } else if (error.message?.includes('timeout')) {
        throw new Error(`Request timed out - try again or use a different assembly`);
      }
      
      throw error;
    }
  }

  // Combined optimized method for getting gene sequence by symbol
  async getGenomicSequenceBySymbol(
    geneSymbol: string,
    assembly: 'GRCh38' | 'GRCh37' = 'GRCh38',
    onProgress?: ProgressCallback,
    signal?: AbortSignal
  ): Promise<GenomicSequenceResult> {
    try {
      onProgress?.('🔍 Resolving gene symbol...', 10);

      // Use batch requester for symbol lookup
      const geneInfo = await batchRequester.add(() =>
        this.lookupGeneBySymbol(geneSymbol, assembly, signal)
      );

      // Continue with the gene ID
      return this.getGenomicSequenceById(geneInfo.id, assembly, onProgress, signal);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 Gene symbol lookup cancelled');
        throw error;
      }

      console.error('❌ Error fetching genomic sequence by symbol:', error);
      
      if (error.message?.includes('404')) {
        throw new Error(`Gene symbol "${geneSymbol}" not found. Please check spelling or try a different symbol.`);
      }
      
      throw error;
    }
  }

  // Intelligent cache warm-up - only warm up related genes when needed
  private intelligentWarmUp(triggerGene: string): void {
    if (this.cacheWarmedUp) return;
    
    // Define related gene groups
    const geneGroups: Record<string, string[]> = {
      'cancer': ['BRCA1', 'BRCA2', 'TP53'],
      'cardiovascular': ['APOE', 'LDLR'],
      'blood': ['HBB', 'HBA1'],
      'respiratory': ['CFTR'],
      'neurological': ['HTT', 'APP']
    };
    
    // Find which group the trigger gene belongs to
    let relatedGenes: string[] = [];
    for (const [category, genes] of Object.entries(geneGroups)) {
      if (genes.includes(triggerGene.toUpperCase())) {
        relatedGenes = genes.filter(g => g !== triggerGene.toUpperCase());
        break;
      }
    }
    
    // If no related genes found, skip warm-up
    if (relatedGenes.length === 0) {
      console.log(`📋 No related genes to warm up for ${triggerGene}`);
      return;
    }
    
    this.cacheWarmedUp = true;
    
    // Warm up related genes in background with longer delays
    setTimeout(async () => {
      console.log(`🔥 Warming up related genes for ${triggerGene}: ${relatedGenes.join(', ')}`);
      
      for (const gene of relatedGenes.slice(0, 2)) { // Limit to 2 genes max
        try {
          // Use a longer timeout for warm-up requests
          await Promise.race([
            this.lookupGeneBySymbol(gene, 'GRCh38'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Warm-up timeout')), 5000)
            )
          ]);
          
          // Longer delay between warm-up requests
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log(`⚠️ Warm-up failed for ${gene} (ignored)`);
        }
      }
      
      console.log(`✅ Related gene warm-up completed for ${triggerGene}`);
    }, 3000); // Longer initial delay
  }
  
  // Manual cache warm-up (optional, for explicit use)
  async warmUpCommonGenes(): Promise<void> {
    if (this.cacheWarmedUp) {
      console.log('📋 Cache already warmed up');
      return;
    }
    
    const essentialGenes = ['BRCA1', 'TP53', 'HBB']; // Reduced set
    this.cacheWarmedUp = true;
    
    console.log('🔥 Manual cache warm-up starting...');
    
    const results = await Promise.allSettled(
      essentialGenes.map(async (gene) => {
        try {
          return await Promise.race([
            this.lookupGeneBySymbol(gene, 'GRCh38'),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 10000)
            )
          ]);
        } catch (error) {
          console.warn(`⚠️ Failed to warm up ${gene}`);
          throw error;
        }
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    console.log(`✅ Manual warm-up completed: ${successful}/${essentialGenes.length} genes cached`);
  }

  // Get cache statistics
  getCacheStats() {
    const ensemblStats = ensemblCache.getStats();
    const geneStats = geneCache.getStats();
    
    return {
      ensembl: ensemblStats,
      genes: geneStats,
      total: {
        entries: ensemblStats.validEntries + geneStats.validEntries,
        pending: ensemblStats.pendingRequests + geneStats.pendingRequests,
        warmedUp: this.cacheWarmedUp
      }
    };
  }

  // Clear caches
  clearCaches(): void {
    ensemblCache.clear();
    geneCache.clear();
    this.cacheWarmedUp = false; // Reset warm-up flag
    console.log('🧹 Ensembl caches cleared');
  }
  
  // Disable cache warm-up entirely
  disableWarmUp(): void {
    this.cacheWarmedUp = true; // Prevent any warm-up
    console.log('🚫 Cache warm-up disabled');
  }
  
  // Get warm-up status
  isWarmUpComplete(): boolean {
    return this.cacheWarmedUp;
  }
}

// Export singleton instance
export const ensemblAPI = new EnsemblAPIService();