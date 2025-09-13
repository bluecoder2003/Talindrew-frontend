import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c2fb82a9/health", (c) => {
  return c.json({ status: "ok" });
});

// Initialize disease sequences in the database
app.post("/make-server-c2fb82a9/init-disease-sequences", async (c) => {
  try {
    const diseaseSequences = {
      sicklecell: {
        sequence: 'ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTCTTTGAGTCCTTTGGGGATCTGTCCACTCCTGATGCTGTTATGGGCAACCCTAAGGTGAAGGCTCATGGCAAGAAAGTGCTCGGTGCCTTTAGTGATGGCCTGGCTCACCTGGACAACCTCAAGGGCACCTTTGCCACACTGAGTGAGCTGCACTGTGACAAGCTGCACGTGGATCCTGAGAACTTCAGGCTCCTGGGCAACGTGCTGGTCTGTGTGCTGGCCCATCACTTTGGCAAAGAATTCACCCCACCAGTGCAGGCTGCCTATCAGAAAGTGGTGGCTGGTGTGGCTAATGCCCTGGCCCACAAGTATCACTAAGCTCGCTTTCTTGCTGTCCAATTTCTATTAAAGGTTCCTTTGTTCCCTAAGTCCAACTACTAAACTGGGGGATATTATGAAGGGCCTTGAGCATCTGGATTCTGCCTAATAAAAAACATTTATTTTCATTGC',
        name: 'HBB Gene with Sickle Cell Mutation',
        type: 'dna',
        description: 'β-globin gene containing the GAG→GTG substitution causing sickle cell anemia'
      },
      cysticfibrosis: {
        sequence: 'ATGCAGAGGTCGCCTCTGGAAAAGGCCAGCGTTGCTGAAATCATTTGGTGTTTCCTATGATATAGATAACAGAAGCGTCATCAAAGCATGCCAACTAGAAGAGAATATCGATGAAGGGACCAATATTAAAGAAAATCCAATTCTGACCCACAGACATGATAAGATACATTGATAGGTTTTGGCAGATTCCCCGATTTAGACAGCAGGTGCCGAGCACCATTTCCGGGTTTAGCTATCACAGCAGCCTTCTCGGATTTAGACCCAGCAGTTAGCATTCCTTTAGGTGTATTAGTCGATATGCTTCCGCAGACCTTTGGATTACCAGGCCTAGCAGCGATAAATCCGAGAGTTAGAATCGTGAAGATGGTGCTTTTTAATATCGATTATCCTATCGTTACAAGGTACCACATTGGGGGTAGTCCGTCTGTTCAGAGGATCCCCTTGACAAGATGATGGCGACAGATTTGGAGAAGTTTATAACTAGAAGTAGAAGTATCGGAAGTCACAGTAAGGGTGGCTTAAATATTCGAAAGAGTAAACATACCCCGAAGCCCTAGTAGCTACGTATAGGACCACCATTTCCATTTTAACCATGGCAGCCAATAATGATCTTGTACAAGCTGTATTCAGCAAATGTAGGC',
        name: 'CFTR Gene with ΔF508 Mutation',
        type: 'dna',
        description: 'CFTR gene with the ΔF508 deletion causing cystic fibrosis'
      },
      huntington: {
        sequence: 'ATGGCGACCCTGGAAAAGCTGATGAAGGCCTTCGAGTCCCTCAAGTCCTTCCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAACAGCCGCCACCGCCGCCGCCGCCGCCGCCGCCTCCTCAGCTTCCTCAGCCGCCGCCGCAGGCACAGCCGCTGCTGCCTGGGAGCTGCAGAGATACCTACGGAAGGCTGGAGGAGCCTGATAGAGCGGGTGGAGGAAGAAGCGGAGGCGGATGAGGATGAAGAGGAGGATGAGGATGAGGATGAGGATGAGGAAGAAGAGGAAGATGAGGATGAG',
        name: 'HTT Gene with CAG Expansion',
        type: 'dna',
        description: "Huntingtin gene with expanded CAG repeats (>36) causing Huntington's disease"
      }
    };

    // Store each disease sequence
    for (const [key, sequence] of Object.entries(diseaseSequences)) {
      await kv.set(`disease_sequence:${key}`, sequence);
    }

    console.log('Disease sequences initialized successfully');
    return c.json({ success: true, message: 'Disease sequences initialized' });
  } catch (error) {
    console.error('Error initializing disease sequences:', error);
    return c.json({ error: 'Failed to initialize disease sequences' }, 500);
  }
});

// Get all disease sequences
app.get("/make-server-c2fb82a9/disease-sequences", async (c) => {
  try {
    const sequences = await kv.getByPrefix('disease_sequence:');
    
    // Transform the data to match expected format
    const diseaseSequences = {};
    sequences.forEach(item => {
      if (item && item.key && item.value) {
        const key = item.key.replace('disease_sequence:', '');
        diseaseSequences[key] = item.value;
      }
    });

    console.log('Retrieved disease sequences:', Object.keys(diseaseSequences));
    return c.json(diseaseSequences);
  } catch (error) {
    console.error('Error retrieving disease sequences:', error);
    return c.json({ error: 'Failed to retrieve disease sequences' }, 500);
  }
});

// Get specific disease sequence
app.get("/make-server-c2fb82a9/disease-sequences/:diseaseKey", async (c) => {
  try {
    const diseaseKey = c.req.param('diseaseKey');
    const sequence = await kv.get(`disease_sequence:${diseaseKey}`);
    
    if (!sequence) {
      return c.json({ error: 'Disease sequence not found' }, 404);
    }

    console.log(`Retrieved disease sequence: ${diseaseKey}`);
    return c.json(sequence);
  } catch (error) {
    console.error('Error retrieving disease sequence:', error);
    return c.json({ error: 'Failed to retrieve disease sequence' }, 500);
  }
});

// NCBI E-utilities integration endpoints

// Search for genes by disease name
app.get("/make-server-c2fb82a9/ncbi/search-genes", async (c) => {
  try {
    const diseaseQuery = c.req.query('disease');
    const retmax = c.req.query('retmax') || '10';
    
    if (!diseaseQuery) {
      return c.json({ error: 'Disease query parameter is required' }, 400);
    }

    // Construct search term with human organism filter
    const searchTerm = encodeURIComponent(`${diseaseQuery}[title] AND homo sapiens[organism]`);
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=${searchTerm}&retmode=json&retmax=${retmax}`;
    
    console.log('Searching NCBI genes for:', diseaseQuery);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NCBI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error searching NCBI genes:', error);
    return c.json({ error: 'Failed to search NCBI genes' }, 500);
  }
});

// Get gene details by gene ID
app.get("/make-server-c2fb82a9/ncbi/gene-details/:geneId", async (c) => {
  try {
    const geneId = c.req.param('geneId');
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`;
    
    console.log('Fetching gene details for ID:', geneId);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NCBI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching gene details:', error);
    return c.json({ error: 'Failed to fetch gene details' }, 500);
  }
});

// Search for variants by disease name
app.get("/make-server-c2fb82a9/ncbi/search-variants", async (c) => {
  try {
    const diseaseQuery = c.req.query('disease');
    const retmax = c.req.query('retmax') || '10';
    
    if (!diseaseQuery) {
      return c.json({ error: 'Disease query parameter is required' }, 400);
    }

    const searchTerm = encodeURIComponent(diseaseQuery);
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=clinvar&term=${searchTerm}&retmode=json&retmax=${retmax}`;
    
    console.log('Searching NCBI variants for:', diseaseQuery);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NCBI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error searching NCBI variants:', error);
    return c.json({ error: 'Failed to search NCBI variants' }, 500);
  }
});

// Get variant details by variant ID
app.get("/make-server-c2fb82a9/ncbi/variant-details/:variantId", async (c) => {
  try {
    const variantId = c.req.param('variantId');
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=clinvar&id=${variantId}&retmode=json`;
    
    console.log('Fetching variant details for ID:', variantId);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NCBI API error: ${response.status}`);
    }
    
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    console.error('Error fetching variant details:', error);
    return c.json({ error: 'Failed to fetch variant details' }, 500);
  }
});

// Fetch nucleotide sequence by accession
app.get("/make-server-c2fb82a9/ncbi/sequence/:accession", async (c) => {
  try {
    const accession = c.req.param('accession');
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=${accession}&report=fasta&retmode=text`;
    
    console.log('Fetching sequence for accession:', accession);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NCBI API error: ${response.status}`);
    }
    
    const fastaText = await response.text();
    return c.text(fastaText);
  } catch (error) {
    console.error('Error fetching sequence:', error);
    return c.json({ error: 'Failed to fetch sequence' }, 500);
  }
});

// Populate diseases database from NCBI
app.post("/make-server-c2fb82a9/populate-diseases", async (c) => {
  try {
    console.log('Starting disease population from NCBI...');
    
    // Comprehensive list of genetic diseases to populate
    const commonDiseases = [
      // Common monogenic disorders
      { name: 'cystic fibrosis', primaryGene: 'CFTR' },
      { name: 'sickle cell anemia', primaryGene: 'HBB' }, 
      { name: 'huntington disease', primaryGene: 'HTT' },
      { name: 'duchenne muscular dystrophy', primaryGene: 'DMD' },
      { name: 'beta thalassemia', primaryGene: 'HBB' },
      { name: 'alpha thalassemia', primaryGene: 'HBA1' },
      { name: 'hemophilia A', primaryGene: 'F8' },
      { name: 'hemophilia B', primaryGene: 'F9' },
      
      // Metabolic disorders
      { name: 'phenylketonuria', primaryGene: 'PAH' },
      { name: 'tay sachs disease', primaryGene: 'HEXA' },
      { name: 'gaucher disease', primaryGene: 'GBA' },
      { name: 'fabry disease', primaryGene: 'GLA' },
      { name: 'pompe disease', primaryGene: 'GAA' },
      { name: 'wilson disease', primaryGene: 'ATP7B' },
      
      // Connective tissue disorders
      { name: 'marfan syndrome', primaryGene: 'FBN1' },
      { name: 'ehlers danlos syndrome', primaryGene: 'COL5A1' },
      { name: 'osteogenesis imperfecta', primaryGene: 'COL1A1' },
      
      // Neurological disorders
      { name: 'spinal muscular atrophy', primaryGene: 'SMN1' },
      { name: 'myotonic dystrophy', primaryGene: 'DMPK' },
      { name: 'neurofibromatosis type 1', primaryGene: 'NF1' },
      { name: 'friedreich ataxia', primaryGene: 'FXN' },
      { name: 'charcot marie tooth disease', primaryGene: 'PMP22' },
      
      // Kidney disorders
      { name: 'polycystic kidney disease', primaryGene: 'PKD1' },
      { name: 'alport syndrome', primaryGene: 'COL4A5' },
      
      // Cancer predisposition
      { name: 'hereditary breast cancer', primaryGene: 'BRCA1' },
      { name: 'lynch syndrome', primaryGene: 'MLH1' },
      { name: 'familial adenomatous polyposis', primaryGene: 'APC' },
      
      // Eye disorders
      { name: 'retinitis pigmentosa', primaryGene: 'RHO' },
      { name: 'leber congenital amaurosis', primaryGene: 'CEP290' },
      
      // Hearing disorders
      { name: 'usher syndrome', primaryGene: 'MYO7A' },
      { name: 'pendred syndrome', primaryGene: 'SLC26A4' },
      
      // Immunodeficiency
      { name: 'severe combined immunodeficiency', primaryGene: 'ADA' },
      { name: 'chronic granulomatous disease', primaryGene: 'CYBB' }
    ];

    const diseaseData = {};
    const failedDiseases = [];
    
    for (const diseaseInfo of commonDiseases) {
      try {
        const disease = diseaseInfo.name;
        
        // Try searching with gene symbol first (more specific)
        let searchTerm = encodeURIComponent(`${diseaseInfo.primaryGene}[Gene Name] AND homo sapiens[organism]`);
        let searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=${searchTerm}&retmode=json&retmax=3`;
        
        let searchResponse = await fetch(searchUrl);
        let searchData = null;
        
        if (searchResponse.ok) {
          searchData = await searchResponse.json();
        }
        
        // If gene symbol search fails, try disease name
        if (!searchData || !searchData.esearchresult || searchData.esearchresult.idlist.length === 0) {
          searchTerm = encodeURIComponent(`${disease}[title] AND homo sapiens[organism]`);
          searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=gene&term=${searchTerm}&retmode=json&retmax=3`;
          
          searchResponse = await fetch(searchUrl);
          if (searchResponse.ok) {
            searchData = await searchResponse.json();
          }
        }
        
        if (searchData && searchData.esearchresult && searchData.esearchresult.idlist.length > 0) {
          // Get details for the first gene
          const geneId = searchData.esearchresult.idlist[0];
          const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=gene&id=${geneId}&retmode=json`;
          
          const detailsResponse = await fetch(detailsUrl);
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            const geneDetails = detailsData.result[geneId];
            
            if (geneDetails) {
              const diseaseKey = disease.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
              diseaseData[diseaseKey] = {
                name: disease,
                geneSymbol: geneDetails.name || diseaseInfo.primaryGene,
                primaryGene: diseaseInfo.primaryGene,
                description: geneDetails.summary || geneDetails.description || `Genetic disorder associated with mutations in the ${diseaseInfo.primaryGene} gene`,
                chromosome: geneDetails.chromosome || '',
                maplocation: geneDetails.maplocation || '',
                geneId: geneId,
                organism: 'Homo sapiens',
                category: categorizeDisease(disease),
                prevalence: getPrevalenceInfo(disease),
                inheritance: getInheritancePattern(disease)
              };
            }
          }
        } else {
          failedDiseases.push(disease);
        }
        
        // Add delay to respect NCBI rate limits (3 requests per second)
        await new Promise(resolve => setTimeout(resolve, 350));
      } catch (error) {
        console.error(`Error processing disease ${diseaseInfo.name}:`, error);
        failedDiseases.push(diseaseInfo.name);
        continue;
      }
    }

    // Store in database
    for (const [key, data] of Object.entries(diseaseData)) {
      await kv.set(`ncbi_disease:${key}`, data);
    }

    console.log(`Successfully populated ${Object.keys(diseaseData).length} diseases`);
    if (failedDiseases.length > 0) {
      console.log(`Failed to populate: ${failedDiseases.join(', ')}`);
    }
    
    return c.json({ 
      success: true, 
      message: `Populated ${Object.keys(diseaseData).length} diseases`,
      diseases: Object.keys(diseaseData),
      failed: failedDiseases,
      total: commonDiseases.length
    });
  } catch (error) {
    console.error('Error populating diseases:', error);
    return c.json({ error: 'Failed to populate diseases' }, 500);
  }
});

// Helper function to categorize diseases (would normally be outside but keeping inline for simplicity)
function categorizeDisease(disease) {
  const categories = {
    'metabolic': ['phenylketonuria', 'tay sachs', 'gaucher', 'fabry', 'pompe', 'wilson'],
    'blood': ['sickle cell', 'thalassemia', 'hemophilia'],
    'neurological': ['huntington', 'spinal muscular', 'myotonic', 'neurofibromatosis', 'friedreich', 'charcot'],
    'muscular': ['duchenne', 'myotonic dystrophy'],
    'connective tissue': ['marfan', 'ehlers danlos', 'osteogenesis'],
    'respiratory': ['cystic fibrosis'],
    'kidney': ['polycystic kidney', 'alport'],
    'cancer': ['hereditary breast', 'lynch', 'familial adenomatous'],
    'eye': ['retinitis', 'leber'],
    'hearing': ['usher', 'pendred'],
    'immune': ['immunodeficiency', 'granulomatous']
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => disease.toLowerCase().includes(keyword))) {
      return category;
    }
  }
  return 'genetic disorder';
}

function getPrevalenceInfo(disease) {
  const prevalence = {
    'cystic fibrosis': '1 in 2,500-3,500',
    'sickle cell anemia': '1 in 365 African Americans',
    'huntington disease': '1 in 10,000-15,000',
    'duchenne muscular dystrophy': '1 in 3,500-5,000 males',
    'hemophilia A': '1 in 5,000 males',
    'phenylketonuria': '1 in 10,000-15,000',
    'tay sachs disease': '1 in 3,500 Ashkenazi Jews',
    'marfan syndrome': '1 in 5,000',
    'spinal muscular atrophy': '1 in 6,000-10,000'
  };
  return prevalence[disease] || 'Rare';
}

function getInheritancePattern(disease) {
  const patterns = {
    'cystic fibrosis': 'Autosomal recessive',
    'sickle cell anemia': 'Autosomal recessive',
    'huntington disease': 'Autosomal dominant',
    'duchenne muscular dystrophy': 'X-linked recessive',
    'hemophilia A': 'X-linked recessive',
    'hemophilia B': 'X-linked recessive',
    'phenylketonuria': 'Autosomal recessive',
    'tay sachs disease': 'Autosomal recessive',
    'marfan syndrome': 'Autosomal dominant',
    'spinal muscular atrophy': 'Autosomal recessive'
  };
  return patterns[disease] || 'Variable';
}

// Get all diseases from database
app.get("/make-server-c2fb82a9/diseases", async (c) => {
  try {
    const diseases = await kv.getByPrefix('ncbi_disease:');
    
    const diseaseList = {};
    diseases.forEach(item => {
      if (item && item.key && item.value) {
        const key = item.key.replace('ncbi_disease:', '');
        diseaseList[key] = item.value;
      }
    });

    console.log('Retrieved diseases:', Object.keys(diseaseList));
    return c.json(diseaseList);
  } catch (error) {
    console.error('Error retrieving diseases:', error);
    return c.json({ error: 'Failed to retrieve diseases' }, 500);
  }
});

// Search diseases by name with fuzzy search
app.get("/make-server-c2fb82a9/diseases/search", async (c) => {
  try {
    const query = c.req.query('q')?.toLowerCase();
    const fuzzy = c.req.query('fuzzy') === 'true';
    
    if (!query) {
      return c.json({ error: 'Query parameter q is required' }, 400);
    }

    const diseases = await kv.getByPrefix('ncbi_disease:');
    
    if (fuzzy) {
      // Implement basic fuzzy search logic
      const fuzzifyString = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const fuzzyQuery = fuzzifyString(query);
      
      const fuzzyMatches = diseases
        .filter(item => {
          if (!item || !item.value) return false;
          const disease = item.value;
          const name = fuzzifyString(disease.name || '');
          const gene = fuzzifyString(disease.geneSymbol || '');
          const desc = fuzzifyString(disease.description || '');
          
          // Calculate similarity using Levenshtein-like approach
          return name.includes(fuzzyQuery) || 
                 gene.includes(fuzzyQuery) ||
                 desc.includes(fuzzyQuery) ||
                 calculateSimilarity(name, fuzzyQuery) > 0.6 ||
                 calculateSimilarity(gene, fuzzyQuery) > 0.7;
        })
        .map(item => {
          const key = item.key.replace('ncbi_disease:', '');
          return { key, ...item.value };
        });

      console.log(`Fuzzy disease search for '${query}' returned ${fuzzyMatches.length} results`);
      return c.json(fuzzyMatches);
    } else {
      const filteredDiseases = diseases
        .filter(item => {
          if (!item || !item.value) return false;
          const disease = item.value;
          return disease.name?.toLowerCase().includes(query) || 
                 disease.geneSymbol?.toLowerCase().includes(query) ||
                 disease.description?.toLowerCase().includes(query);
        })
        .map(item => {
          const key = item.key.replace('ncbi_disease:', '');
          return { key, ...item.value };
        });

      console.log(`Disease search for '${query}' returned ${filteredDiseases.length} results`);
      return c.json(filteredDiseases);
    }
  } catch (error) {
    console.error('Error searching diseases:', error);
    return c.json({ error: 'Failed to search diseases' }, 500);
  }
});

// Helper function for similarity calculation
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Ensembl REST API Integration

// Search Ensembl gene by symbol
app.get("/make-server-c2fb82a9/ensembl/gene/:symbol", async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const species = c.req.query('species') || 'homo_sapiens';
    
    // Validate and sanitize the symbol
    if (!symbol || symbol.trim().length === 0) {
      return c.json({ error: 'Gene symbol is required' }, 400);
    }
    
    const sanitizedSymbol = encodeURIComponent(symbol.trim().toUpperCase());
    const url = `https://rest.ensembl.org/lookup/symbol/${species}/${sanitizedSymbol}?content-type=application/json`;
    
    console.log('Fetching Ensembl gene for symbol:', symbol, 'URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Talindrew/1.0 (Educational genetics tool)'
      },
      method: 'GET'
    });
    
    console.log('Ensembl gene lookup response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Gene not found:', symbol);
        return c.json({ error: 'Gene not found' }, 404);
      }
      
      // Log detailed error information
      const responseText = await response.text();
      console.error('Ensembl gene lookup error:', {
        symbol: symbol,
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      throw new Error(`Ensembl API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched gene data for:', symbol);
    return c.json(data);
  } catch (error) {
    console.error('Error fetching Ensembl gene:', error);
    
    // Provide specific error messages
    if (error.message.includes('400')) {
      return c.json({ 
        error: 'Invalid gene symbol format. Please use standard HGNC gene symbols.',
        details: error.message 
      }, 400);
    }
    
    return c.json({ 
      error: 'Failed to fetch gene from Ensembl',
      details: error.message 
    }, 500);
  }
});

// Get phenotypes for a gene from Ensembl
app.get("/make-server-c2fb82a9/ensembl/phenotypes/:symbol", async (c) => {
  try {
    const symbol = c.req.param('symbol');
    const species = c.req.query('species') || 'homo_sapiens';
    
    const url = `https://rest.ensembl.org/phenotype/gene/${species}/${symbol}?content-type=application/json`;
    
    console.log('Fetching Ensembl phenotypes for:', symbol);
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return c.json({ phenotypes: [] }); // Return empty array if no phenotypes found
      }
      throw new Error(`Ensembl API error: ${response.status}`);
    }
    
    const data = await response.json();
    return c.json({ phenotypes: data });
  } catch (error) {
    console.error('Error fetching Ensembl phenotypes:', error);
    return c.json({ error: 'Failed to fetch phenotypes from Ensembl' }, 500);
  }
});

// Get gene sequence from Ensembl
app.get("/make-server-c2fb82a9/ensembl/sequence/:geneId", async (c) => {
  try {
    const geneId = c.req.param('geneId');
    const species = c.req.query('species') || 'homo_sapiens';
    const type = c.req.query('type') || 'genomic'; // genomic, cds, cdna, protein
    
    // Validate geneId
    if (!geneId || geneId.trim().length === 0) {
      return c.json({ error: 'Gene ID is required' }, 400);
    }
    
    const sanitizedGeneId = encodeURIComponent(geneId.trim());
    const url = `https://rest.ensembl.org/sequence/id/${sanitizedGeneId}?content-type=application/json&type=${type}`;
    
    console.log('Fetching Ensembl sequence for:', geneId, 'type:', type, 'URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Talindrew/1.0 (Educational genetics tool)'
      },
      method: 'GET'
    });
    
    console.log('Ensembl sequence response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Sequence not found for:', geneId);
        return c.json({ error: 'Sequence not found' }, 404);
      }
      
      // Log error details
      const responseText = await response.text();
      console.error('Ensembl sequence error:', {
        geneId: geneId,
        type: type,
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      throw new Error(`Ensembl API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched sequence for:', geneId, 'length:', data.seq?.length || 'unknown');
    return c.json(data);
  } catch (error) {
    console.error('Error fetching Ensembl sequence:', error);
    
    if (error.message.includes('400')) {
      return c.json({ 
        error: 'Invalid gene ID format. Please use valid Ensembl gene IDs.',
        details: error.message 
      }, 400);
    }
    
    return c.json({ 
      error: 'Failed to fetch sequence from Ensembl',
      details: error.message 
    }, 500);
  }
});

// Search Ensembl for genes by term
app.get("/make-server-c2fb82a9/ensembl/search", async (c) => {
  try {
    const query = c.req.query('q');
    const species = c.req.query('species') || 'homo_sapiens';
    
    if (!query) {
      return c.json({ error: 'Query parameter q is required' }, 400);
    }
    
    // Sanitize the query to ensure it's valid for URL encoding
    const sanitizedQuery = encodeURIComponent(query.trim());
    
    // Use the Ensembl REST API lookup endpoint with proper error handling
    const url = `https://rest.ensembl.org/lookup/symbol/${species}/${sanitizedQuery}?content-type=application/json`;
    
    console.log('Searching Ensembl for:', query, 'URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Talindrew/1.0 (Educational genetics tool)'
      },
      method: 'GET'
    });
    
    console.log('Ensembl response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Gene not found in Ensembl, returning empty results');
        return c.json({ results: [] });
      }
      
      // Log response details for debugging
      const responseText = await response.text();
      console.error('Ensembl API error details:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      });
      
      throw new Error(`Ensembl API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Ensembl search successful for:', query);
    return c.json({ results: [data] });
  } catch (error) {
    console.error('Error searching Ensembl:', error);
    
    // Provide more specific error messages
    if (error.message.includes('400')) {
      return c.json({ 
        error: 'Invalid gene symbol or search term. Please check the spelling and try again.',
        details: error.message 
      }, 400);
    }
    
    return c.json({ 
      error: 'Failed to search Ensembl database',
      details: error.message 
    }, 500);
  }
});

// Create normalized disease entry from Ensembl data
app.post("/make-server-c2fb82a9/ensembl/create-disease", async (c) => {
  try {
    const body = await c.req.json();
    const { geneSymbol, phenotypes, geneData } = body;
    
    if (!geneSymbol || !geneData) {
      return c.json({ error: 'geneSymbol and geneData are required' }, 400);
    }
    
    // Create normalized disease data
    const diseaseKey = geneSymbol.toLowerCase().replace(/[^a-z0-9]/g, '');
    const diseaseData = {
      name: `${geneSymbol} Gene Associated Disorders`,
      geneSymbol: geneSymbol,
      primaryGene: geneSymbol,
      description: geneData.description || `Gene associated with various genetic disorders`,
      chromosome: geneData.seq_region_name || '',
      maplocation: `${geneData.start}-${geneData.end}`,
      geneId: geneData.id,
      organism: 'Homo sapiens',
      category: 'genetic disorder',
      prevalence: 'Variable',
      inheritance: 'Variable',
      phenotypes: phenotypes || [],
      location: `${geneData.seq_region_name}:${geneData.start}-${geneData.end}`,
      source: 'Ensembl'
    };
    
    // Store in database
    await kv.set(`ensembl_disease:${diseaseKey}`, diseaseData);
    
    console.log('Created Ensembl disease entry for:', geneSymbol);
    return c.json({ success: true, diseaseKey, data: diseaseData });
  } catch (error) {
    console.error('Error creating Ensembl disease:', error);
    return c.json({ error: 'Failed to create disease from Ensembl data' }, 500);
  }
});

// Setup database tables endpoint
app.post("/make-server-c2fb82a9/setup-database", async (c) => {
  try {
    console.log('Setting up genetic diseases database structure...');
    
    // Note: In a real Supabase environment, you would run this SQL directly in the Supabase dashboard
    // This endpoint documents the required database structure
    const databaseSchema = {
      table_name: "genetic_diseases",
      description: "Table for storing genetic disease information",
      sql_commands: [
        `CREATE TABLE IF NOT EXISTS genetic_diseases (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          disease_key TEXT NOT NULL UNIQUE,
          name TEXT,
          gene_symbol TEXT,
          primary_gene TEXT,
          description TEXT,
          chromosome TEXT,
          maplocation TEXT,
          gene_id TEXT,
          organism TEXT DEFAULT 'Homo sapiens',
          category TEXT,
          prevalence TEXT,
          inheritance TEXT,
          phenotypes JSONB,
          location TEXT,
          source TEXT DEFAULT 'NCBI',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
        `CREATE INDEX IF NOT EXISTS idx_disease_key ON genetic_diseases (disease_key);`,
        `CREATE INDEX IF NOT EXISTS idx_gene_symbol ON genetic_diseases (gene_symbol);`,
        `CREATE INDEX IF NOT EXISTS idx_category ON genetic_diseases (category);`,
        `CREATE INDEX IF NOT EXISTS idx_source ON genetic_diseases (source);`,
        // Enable trigram extension for fuzzy search (requires superuser)
        // `CREATE EXTENSION IF NOT EXISTS pg_trgm;`,
        // `CREATE INDEX IF NOT EXISTS idx_disease_name_trgm ON genetic_diseases USING GIN (name gin_trgm_ops);`,
        // `CREATE INDEX IF NOT EXISTS idx_disease_desc_trgm ON genetic_diseases USING GIN (description gin_trgm_ops);`
      ],
      kv_alternative: "Since direct SQL execution is not available, we're using KV store with prefixed keys for data storage"
    };

    // For now, we'll continue using the KV store approach
    // Store the schema documentation
    await kv.set('database_schema:genetic_diseases', databaseSchema);

    console.log('Database schema documentation stored');
    return c.json({ 
      success: true, 
      message: 'Database schema documented',
      schema: databaseSchema,
      note: "Using KV store implementation. For full SQL capabilities, execute the provided SQL commands in Supabase dashboard."
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return c.json({ error: 'Failed to setup database' }, 500);
  }
});

// Enhanced disease storage with normalized format
app.post("/make-server-c2fb82a9/store-disease", async (c) => {
  try {
    const body = await c.req.json();
    const { diseaseKey, diseaseData } = body;
    
    if (!diseaseKey || !diseaseData) {
      return c.json({ error: 'diseaseKey and diseaseData are required' }, 400);
    }

    // Normalize the disease data to match expected format
    const normalizedData = {
      disease_key: diseaseKey,
      name: diseaseData.name || '',
      gene_symbol: diseaseData.geneSymbol || diseaseData.gene_symbol || '',
      primary_gene: diseaseData.primaryGene || diseaseData.primary_gene || '',
      description: diseaseData.description || '',
      chromosome: diseaseData.chromosome || '',
      maplocation: diseaseData.maplocation || '',
      gene_id: diseaseData.geneId || diseaseData.gene_id || '',
      organism: diseaseData.organism || 'Homo sapiens',
      category: diseaseData.category || 'genetic disorder',
      prevalence: diseaseData.prevalence || 'Unknown',
      inheritance: diseaseData.inheritance || 'Variable',
      phenotypes: diseaseData.phenotypes || [],
      location: diseaseData.location || `${diseaseData.chromosome}:${diseaseData.maplocation}`,
      source: diseaseData.source || 'Manual',
      sequence: diseaseData.sequence || '', // Optional sequence data
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store in KV with consistent key format
    await kv.set(`genetic_disease:${diseaseKey}`, normalizedData);

    console.log('Stored disease:', diseaseKey);
    return c.json({ 
      success: true, 
      diseaseKey, 
      data: normalizedData 
    });
  } catch (error) {
    console.error('Error storing disease:', error);
    return c.json({ error: 'Failed to store disease' }, 500);
  }
});

// Bulk import diseases from JSON
app.post("/make-server-c2fb82a9/import-diseases", async (c) => {
  try {
    const body = await c.req.json();
    const { diseases } = body;
    
    if (!diseases || typeof diseases !== 'object') {
      return c.json({ error: 'diseases object is required' }, 400);
    }

    const results = [];
    const errors = [];

    for (const [key, diseaseData] of Object.entries(diseases)) {
      try {
        const normalizedData = {
          disease_key: key,
          name: diseaseData.name || '',
          gene_symbol: diseaseData.geneSymbol || diseaseData.gene_symbol || '',
          primary_gene: diseaseData.primaryGene || diseaseData.primary_gene || '',
          description: diseaseData.description || '',
          chromosome: diseaseData.chromosome || '',
          maplocation: diseaseData.maplocation || '',
          gene_id: diseaseData.geneId || diseaseData.gene_id || '',
          organism: diseaseData.organism || 'Homo sapiens',
          category: diseaseData.category || 'genetic disorder',
          prevalence: diseaseData.prevalence || 'Unknown',
          inheritance: diseaseData.inheritance || 'Variable',
          phenotypes: diseaseData.phenotypes || [],
          location: diseaseData.location || `${diseaseData.chromosome}:${diseaseData.maplocation}`,
          source: diseaseData.source || 'Import',
          sequence: diseaseData.sequence || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await kv.set(`genetic_disease:${key}`, normalizedData);
        results.push(key);
      } catch (error) {
        errors.push({ key, error: error.message });
      }
    }

    console.log(`Imported ${results.length} diseases, ${errors.length} errors`);
    return c.json({ 
      success: true, 
      imported: results.length,
      errors: errors.length,
      results,
      errors 
    });
  } catch (error) {
    console.error('Error importing diseases:', error);
    return c.json({ error: 'Failed to import diseases' }, 500);
  }
});

// Enhanced diseases retrieval with better formatting
app.get("/make-server-c2fb82a9/diseases-enhanced", async (c) => {
  try {
    // Get both NCBI and manually stored diseases
    const ncbiDiseases = await kv.getByPrefix('ncbi_disease:');
    const geneticDiseases = await kv.getByPrefix('genetic_disease:');
    const ensemblDiseases = await kv.getByPrefix('ensembl_disease:');
    
    const allDiseases = {};
    
    // Process NCBI diseases
    ncbiDiseases.forEach(item => {
      if (item && item.key && item.value) {
        const key = item.key.replace('ncbi_disease:', '');
        allDiseases[key] = { ...item.value, source: 'NCBI' };
      }
    });
    
    // Process genetic diseases
    geneticDiseases.forEach(item => {
      if (item && item.key && item.value) {
        const key = item.key.replace('genetic_disease:', '');
        allDiseases[key] = { ...item.value, source: item.value.source || 'Database' };
      }
    });
    
    // Process Ensembl diseases
    ensemblDiseases.forEach(item => {
      if (item && item.key && item.value) {
        const key = item.key.replace('ensembl_disease:', '');
        allDiseases[key] = { ...item.value, source: 'Ensembl' };
      }
    });

    console.log('Retrieved enhanced diseases:', Object.keys(allDiseases));
    return c.json(allDiseases);
  } catch (error) {
    console.error('Error retrieving enhanced diseases:', error);
    return c.json({ error: 'Failed to retrieve diseases' }, 500);
  }
});

Deno.serve(app.fetch);