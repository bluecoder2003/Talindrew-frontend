// Restriction Enzyme Analysis Web Worker
// This worker handles the computationally intensive restriction enzyme cut site detection
// in a separate thread to avoid blocking the main UI thread

console.log('Restriction Worker: Starting initialization...');

// Restriction enzyme database with recognition sequences and cut positions
const RESTRICTION_ENZYMES = {
  EcoRI: {
    name: "EcoRI",
    sequence: "GAATTC",
    cutPosition: 1, // Cut between G and AATTC
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  BamHI: {
    name: "BamHI", 
    sequence: "GGATCC",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  HindIII: {
    name: "HindIII",
    sequence: "AAGCTT", 
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  XhoI: {
    name: "XhoI",
    sequence: "CTCGAG",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB", 
    temperature: 37
  },
  SacI: {
    name: "SacI",
    sequence: "GAGCTC",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  KpnI: {
    name: "KpnI",
    sequence: "GGTACC",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  XbaI: {
    name: "XbaI",
    sequence: "TCTAGA",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  SpeI: {
    name: "SpeI",
    sequence: "ACTAGT",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  NotI: {
    name: "NotI",
    sequence: "GCGGCCGC",
    cutPosition: 2,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  SalI: {
    name: "SalI",
    sequence: "GTCGAC", 
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  PstI: {
    name: "PstI",
    sequence: "CTGCAG",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  SmaI: {
    name: "SmaI",
    sequence: "CCCGGG",
    cutPosition: 3,
    overhang: "blunt",
    supplier: "NEB",
    temperature: 25
  },
  ApaI: {
    name: "ApaI",
    sequence: "GGGCCC",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 25
  },
  BglII: {
    name: "BglII",
    sequence: "AGATCT",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  ClaI: {
    name: "ClaI",
    sequence: "ATCGAT",
    cutPosition: 2,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  EcoRV: {
    name: "EcoRV",
    sequence: "GATATC",
    cutPosition: 3,
    overhang: "blunt",
    supplier: "NEB", 
    temperature: 37
  },
  HaeIII: {
    name: "HaeIII",
    sequence: "GGCC",
    cutPosition: 2,
    overhang: "blunt",
    supplier: "NEB",
    temperature: 37
  },
  MluI: {
    name: "MluI",
    sequence: "ACGCGT",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  NcoI: {
    name: "NcoI",
    sequence: "CCATGG",
    cutPosition: 1,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  NdeI: {
    name: "NdeI",
    sequence: "CATATG",
    cutPosition: 2,
    overhang: "5'",
    supplier: "NEB",
    temperature: 37
  },
  PvuII: {
    name: "PvuII",
    sequence: "CAGCTG",
    cutPosition: 3,
    overhang: "blunt",
    supplier: "NEB",
    temperature: 37
  }
};

function findEnzymeInSequence(sequence, enzyme) {
  const sites = [];
  const recognitionSite = enzyme.sequence.toUpperCase();
  const reverseComplement = getReverseComplement(recognitionSite);
  
  // Search forward strand
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
  
  // Search reverse strand
  index = 0;
  while ((index = sequence.indexOf(reverseComplement, index)) !== -1) {
    sites.push({
      enzyme: enzyme.name,
      position: index,
      cutPosition: index + enzyme.cutPosition,
      strand: "reverse", 
      sequence: reverseComplement,
      overhang: enzyme.overhang,
      temperature: enzyme.temperature
    });
    index++;
  }
  
  return sites;
}

function getReverseComplement(sequence) {
  const complement = {
    'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
    'a': 't', 't': 'a', 'g': 'c', 'c': 'g'
  };
  
  return sequence
    .split('')
    .map(base => complement[base] || base)
    .reverse()
    .join('');
}

function findCutSites(sequence, options = {}) {
  console.log('Restriction Worker: Starting analysis for sequence length:', sequence.length);
  
  const upperSequence = sequence.toUpperCase();
  const allCutSites = [];
  
  // Get enzyme list (can be filtered by options)
  const enzymeList = options.enzymes ? 
    Object.entries(RESTRICTION_ENZYMES).filter(([key]) => options.enzymes.includes(key)) :
    Object.entries(RESTRICTION_ENZYMES);
  
  let processedCount = 0;
  const totalEnzymes = enzymeList.length;
  
  console.log(`Restriction Worker: Processing ${totalEnzymes} enzymes`);
  
  for (const [enzymeKey, enzyme] of enzymeList) {
    try {
      console.log(`Restriction Worker: Processing ${enzyme.name}...`);
      
      const cutSites = findEnzymeInSequence(upperSequence, enzyme);
      allCutSites.push(...cutSites);
      
      processedCount++;
      
      // Send progress update every few enzymes
      if (processedCount % 3 === 0 || processedCount === totalEnzymes) {
        const progress = (processedCount / totalEnzymes) * 100;
        self.postMessage({
          type: 'PROGRESS',
          data: { 
            progress: Math.min(progress, 95),
            message: `Analyzed ${processedCount}/${totalEnzymes} enzymes (${allCutSites.length} sites found)...`
          }
        });
      }
      
    } catch (error) {
      console.error(`Restriction Worker: Error processing enzyme ${enzymeKey}:`, error);
      self.postMessage({
        type: 'ERROR',
        data: { error: `Error processing ${enzymeKey}: ${error.message}` }
      });
    }
  }
  
  // Sort by position
  allCutSites.sort((a, b) => a.position - b.position);
  
  console.log(`Restriction Worker: Found ${allCutSites.length} cut sites`);
  return allCutSites;
}

function createAnnotationsFromCutSites(cutSites) {
  return cutSites.map((site, index) => ({
    id: `cut_${site.enzyme}_${site.position}`,
    start: site.position,
    end: site.position + site.sequence.length,
    name: site.enzyme,
    type: "cut_site",
    color: getEnzymeColor(site.enzyme),
    direction: site.strand === "forward" ? "forward" : "reverse",
    cutPosition: site.cutPosition,
    overhang: site.overhang,
    temperature: site.temperature,
    description: `${site.enzyme} cut site at position ${site.position + 1} (${site.strand} strand)`
  }));
}

function getEnzymeColor(enzymeName) {
  // Generate consistent colors for enzymes
  const colors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6",
    "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"
  ];
  
  // Simple hash function to assign consistent colors
  let hash = 0;
  for (let i = 0; i < enzymeName.length; i++) {
    hash = enzymeName.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

// Process messages from main thread
self.onmessage = function(e) {
  console.log('Restriction Worker: Received message:', e.data.type);
  
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'FIND_CUT_SITES':
        const { sequence, options = {} } = data;
        
        console.log('Restriction Worker: Starting cut site analysis for sequence length:', sequence.length);
        
        // Send initial progress update
        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 0, message: 'Starting restriction enzyme analysis...' },
          id
        });
        
        const cutSites = findCutSites(sequence, options);
        
        // Send progress update
        self.postMessage({
          type: 'PROGRESS', 
          data: { progress: 90, message: 'Creating annotations...' },
          id
        });
        
        const annotations = createAnnotationsFromCutSites(cutSites);
        
        // Send results
        self.postMessage({
          type: 'CUT_SITES_FOUND',
          data: { cutSites, annotations },
          id
        });
        
        console.log('Restriction Worker: Completed analysis');
        break;
        
      case 'GET_ENZYMES':
        // Send available enzymes list
        self.postMessage({
          type: 'ENZYMES_LIST',
          data: { enzymes: Object.keys(RESTRICTION_ENZYMES) },
          id
        });
        break;
        
      default:
        console.warn('Restriction Worker: Unknown message type:', type);
        self.postMessage({
          type: 'ERROR',
          data: { error: `Unknown message type: ${type}` },
          id
        });
    }
  } catch (error) {
    console.error('Restriction Worker: Error processing message:', error);
    self.postMessage({
      type: 'ERROR',
      data: { error: error.message, stack: error.stack },
      id
    });
  }
};

console.log('Restriction Worker: Initialization complete');

// Send ready signal
self.postMessage({ type: 'READY' });