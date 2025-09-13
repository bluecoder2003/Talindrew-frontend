// Inline Worker Creation as fallback when external worker files can't be loaded
// This creates workers using blob URLs with embedded JavaScript code

export function createInlineDiseaseWorker(): Worker | null {
  console.log('🔧 Creating inline disease worker...');
  
  // Check if Worker is supported
  if (typeof Worker === 'undefined') {
    console.error('❌ Web Workers not supported in this environment');
    return null;
  }
  
  try {
    const workerCode = `
// Inline Disease Detection Web Worker
console.log('Inline Disease Worker: Starting initialization...');

const DISEASE_MARKERS = {
  sicklecell: {
    name: "Sickle Cell Anemia",
    normalSequence: "GAGGAG",
    mutantSequence: "GTGGAG",
    description: "β-globin gene mutation causing sickle-shaped red blood cells",
    severity: "high",
    chromosome: "11p15.4"
  },
  cysticfibrosis: {
    name: "Cystic Fibrosis",
    normalSequence: "ATCTTCGGTTAG",
    mutantSequence: "ATCGGTTAG",
    description: "CFTR gene deletion causing chloride channel dysfunction",
    severity: "high",
    chromosome: "7q31.2"
  },
  huntington: {
    name: "Huntington's Disease",
    normalSequence: "CAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAG",
    mutantSequence: "CAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAG",
    description: "HTT gene expansion causing neurodegeneration",
    severity: "high",
    chromosome: "4p16.3"
  }
};

function findSequenceMatches(sequence, pattern, allowMismatches = 1) {
  const matches = [];
  const seqLength = sequence.length;
  const patternLength = pattern.length;
  
  for (let i = 0; i <= seqLength - patternLength; i++) {
    const subseq = sequence.slice(i, i + patternLength);
    const mismatches = countMismatches(subseq, pattern);
    
    if (mismatches <= allowMismatches) {
      matches.push({
        position: i,
        sequence: subseq,
        mismatches: mismatches,
        similarity: ((patternLength - mismatches) / patternLength) * 100
      });
    }
  }
  
  return matches;
}

function countMismatches(seq1, seq2) {
  if (seq1.length !== seq2.length) return Math.abs(seq1.length - seq2.length);
  
  let mismatches = 0;
  for (let i = 0; i < seq1.length; i++) {
    if (seq1[i] !== seq2[i]) mismatches++;
  }
  return mismatches;
}

function detectMutations(sequence) {
  console.log('Inline Disease Worker: Starting mutation detection');
  
  const mutations = [];
  const upperSequence = sequence.toUpperCase();
  const diseases = Object.entries(DISEASE_MARKERS);
  
  for (const [key, marker] of diseases) {
    try {
      const mutantMatches = findSequenceMatches(
        upperSequence, 
        marker.mutantSequence.toUpperCase(),
        Math.floor(marker.mutantSequence.length * 0.1)
      );
      
      if (mutantMatches.length > 0) {
        for (const match of mutantMatches) {
          mutations.push({
            id: \`\${key}_\${match.position}\`,
            marker: marker,
            position: match.position,
            sequence: match.sequence,
            type: "pathogenic",
            confidence: match.similarity,
            description: \`\${marker.name} mutation detected at position \${match.position + 1}\`
          });
        }
      }
    } catch (error) {
      console.error(\`Inline Disease Worker: Error processing disease \${key}:\`, error);
    }
  }
  
  return mutations;
}

function createAnnotationsFromMutations(mutations) {
  return mutations.map(mutation => ({
    id: mutation.id,
    start: mutation.position,
    end: mutation.position + mutation.sequence.length,
    name: mutation.marker.name,
    type: "mutation",
    color: mutation.type === "pathogenic" ? "#EF4444" : "#F59E0B",
    direction: "forward",
    confidence: mutation.confidence,
    description: mutation.description
  }));
}

self.onmessage = function(e) {
  console.log('Inline Disease Worker: Received message:', e.data.type);
  
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'DETECT_MUTATIONS':
        const { sequence, options = {} } = data;
        
        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 0, message: 'Starting disease detection...' },
          id
        });
        
        const mutations = detectMutations(sequence);
        
        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 90, message: 'Creating annotations...' },
          id
        });
        
        const annotations = createAnnotationsFromMutations(mutations);
        
        self.postMessage({
          type: 'MUTATIONS_DETECTED',
          data: { mutations, annotations },
          id
        });
        
        console.log('Inline Disease Worker: Completed analysis');
        break;
        
      default:
        self.postMessage({
          type: 'ERROR',
          data: { error: \`Unknown message type: \${type}\` },
          id
        });
    }
  } catch (error) {
    console.error('Inline Disease Worker: Error:', error);
    self.postMessage({
      type: 'ERROR',
      data: { error: error.message },
      id
    });
  }
};

console.log('Inline Disease Worker: Initialization complete');
self.postMessage({ type: 'READY' });
`;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    
    // Clean up the blob URL when worker is terminated
    const originalTerminate = worker.terminate.bind(worker);
    worker.terminate = function() {
      URL.revokeObjectURL(workerUrl);
      originalTerminate();
    };
    
    console.log('✅ Successfully created inline disease worker');
    return worker;
  } catch (error) {
    console.error('❌ Failed to create inline disease worker:', error);
    return null;
  }
}

export function createInlineRestrictionWorker(): Worker | null {
  console.log('🔧 Creating inline restriction worker...');
  
  // Check if Worker is supported
  if (typeof Worker === 'undefined') {
    console.error('❌ Web Workers not supported in this environment');
    return null;
  }
  
  try {
    const workerCode = `
// Inline Restriction Enzyme Worker
console.log('Inline Restriction Worker: Starting initialization...');

const RESTRICTION_ENZYMES = {
  EcoRI: { name: "EcoRI", sequence: "GAATTC", cutPosition: 1, overhang: "5'", temperature: 37 },
  BamHI: { name: "BamHI", sequence: "GGATCC", cutPosition: 1, overhang: "5'", temperature: 37 },
  HindIII: { name: "HindIII", sequence: "AAGCTT", cutPosition: 1, overhang: "5'", temperature: 37 },
  XhoI: { name: "XhoI", sequence: "CTCGAG", cutPosition: 1, overhang: "5'", temperature: 37 },
  SacI: { name: "SacI", sequence: "GAGCTC", cutPosition: 1, overhang: "5'", temperature: 37 }
};

function findEnzymeInSequence(sequence, enzyme) {
  const sites = [];
  const recognitionSite = enzyme.sequence.toUpperCase();
  
  let index = 0;
  while ((index = sequence.indexOf(recognitionSite, index)) !== -1) {
    sites.push({
      enzyme: enzyme.name,
      position: index,
      cutPosition: index + enzyme.cutPosition,
      strand: "forward",
      sequence: recognitionSite,
      overhang: enzyme.overhang,
      temperature: enzyme.temperature
    });
    index++;
  }
  
  return sites;
}

function findCutSites(sequence, options = {}) {
  console.log('Inline Restriction Worker: Starting analysis');
  
  const upperSequence = sequence.toUpperCase();
  const allCutSites = [];
  
  const enzymeList = options.enzymes ? 
    Object.entries(RESTRICTION_ENZYMES).filter(([key]) => options.enzymes.includes(key)) :
    Object.entries(RESTRICTION_ENZYMES);
  
  for (const [enzymeKey, enzyme] of enzymeList) {
    try {
      const cutSites = findEnzymeInSequence(upperSequence, enzyme);
      allCutSites.push(...cutSites);
    } catch (error) {
      console.error(\`Error processing enzyme \${enzymeKey}:\`, error);
    }
  }
  
  allCutSites.sort((a, b) => a.position - b.position);
  return allCutSites;
}

function createAnnotationsFromCutSites(cutSites) {
  return cutSites.map((site, index) => ({
    id: \`cut_\${site.enzyme}_\${site.position}\`,
    start: site.position,
    end: site.position + site.sequence.length,
    name: site.enzyme,
    type: "cut_site",
    color: "#3B82F6",
    direction: site.strand === "forward" ? "forward" : "reverse",
    cutPosition: site.cutPosition,
    overhang: site.overhang,
    temperature: site.temperature,
    description: \`\${site.enzyme} cut site at position \${site.position + 1}\`
  }));
}

self.onmessage = function(e) {
  console.log('Inline Restriction Worker: Received message:', e.data.type);
  
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'FIND_CUT_SITES':
        const { sequence, options = {} } = data;
        
        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 0, message: 'Starting restriction enzyme analysis...' },
          id
        });
        
        const cutSites = findCutSites(sequence, options);
        
        self.postMessage({
          type: 'PROGRESS', 
          data: { progress: 90, message: 'Creating annotations...' },
          id
        });
        
        const annotations = createAnnotationsFromCutSites(cutSites);
        
        self.postMessage({
          type: 'CUT_SITES_FOUND',
          data: { cutSites, annotations },
          id
        });
        
        console.log('Inline Restriction Worker: Completed analysis');
        break;
        
      case 'GET_ENZYMES':
        self.postMessage({
          type: 'ENZYMES_LIST',
          data: { enzymes: Object.keys(RESTRICTION_ENZYMES) },
          id
        });
        break;
        
      default:
        self.postMessage({
          type: 'ERROR',
          data: { error: \`Unknown message type: \${type}\` },
          id
        });
    }
  } catch (error) {
    console.error('Inline Restriction Worker: Error:', error);
    self.postMessage({
      type: 'ERROR',
      data: { error: error.message },
      id
    });
  }
};

console.log('Inline Restriction Worker: Initialization complete');
self.postMessage({ type: 'READY' });
`;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);
    
    // Clean up the blob URL when worker is terminated
    const originalTerminate = worker.terminate.bind(worker);
    worker.terminate = function() {
      URL.revokeObjectURL(workerUrl);
      originalTerminate();
    };
    
    console.log('✅ Successfully created inline restriction worker');
    return worker;
  } catch (error) {
    console.error('❌ Failed to create inline restriction worker:', error);
    return null;
  }
}