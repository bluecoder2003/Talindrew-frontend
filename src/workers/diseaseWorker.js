// Disease Detection Web Worker
// This worker handles the computationally intensive disease mutation detection
// in a separate thread to avoid blocking the main UI thread

// Import disease detection logic
// Note: We need to copy the disease detection logic here since workers can't import ES modules directly

const DISEASE_MARKERS = {
  sicklecell: {
    name: "Sickle Cell Anemia",
    normalSequence: "GAGGAG", // Normal β-globin GAG codon
    mutantSequence: "GTGGAG", // Sickle cell GTG codon
    description: "β-globin gene mutation causing sickle-shaped red blood cells",
    severity: "high",
    chromosome: "11p15.4"
  },
  cysticfibrosis: {
    name: "Cystic Fibrosis",
    normalSequence: "ATCTTCGGTTAG", // Normal CFTR sequence around F508
    mutantSequence: "ATCGGTTAG", // ΔF508 deletion (missing TTC)
    description: "CFTR gene deletion causing chloride channel dysfunction",
    severity: "high",
    chromosome: "7q31.2"
  },
  huntington: {
    name: "Huntington's Disease",
    normalSequence: "CAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAG", // Normal CAG repeats (16)
    mutantSequence: "CAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAG", // Expanded CAG repeats (40+)
    description: "HTT gene expansion causing neurodegeneration",
    severity: "high",
    chromosome: "4p16.3"
  },
  downsyndrome: {
    name: "Down Syndrome",
    normalSequence: "GGCCGGCCGGCC", // Normal chromosome 21 marker
    mutantSequence: "GGCCGGCCGGCCGGCC", // Trisomy 21 marker
    description: "Chromosome 21 trisomy causing intellectual disability",
    severity: "moderate",
    chromosome: "21"
  },
  turner: {
    name: "Turner Syndrome",
    normalSequence: "ATCGATCGATCG", // Normal X chromosome marker
    mutantSequence: "ATCGATCG", // Missing X chromosome marker
    description: "X chromosome monosomy affecting females",
    severity: "moderate",
    chromosome: "X"
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
  const mutations = [];
  const upperSequence = sequence.toUpperCase();
  
  // Process diseases in chunks to allow for progress updates
  const diseases = Object.entries(DISEASE_MARKERS);
  
  for (const [key, marker] of diseases) {
    try {
      // Check for mutant sequence
      const mutantMatches = findSequenceMatches(
        upperSequence, 
        marker.mutantSequence.toUpperCase(),
        Math.floor(marker.mutantSequence.length * 0.1) // Allow 10% mismatches
      );
      
      if (mutantMatches.length > 0) {
        for (const match of mutantMatches) {
          mutations.push({
            id: `${key}_${match.position}`,
            marker: marker,
            position: match.position,
            sequence: match.sequence,
            type: "pathogenic",
            confidence: match.similarity,
            description: `${marker.name} mutation detected at position ${match.position + 1}`
          });
        }
      }
      
      // For CAG repeat diseases like Huntington's, check for expanded repeats
      if (key === 'huntington') {
        const cagPattern = /CAG/g;
        let match;
        let cagCount = 0;
        let lastPos = 0;
        
        while ((match = cagPattern.exec(upperSequence)) !== null) {
          if (match.index === lastPos + 3) {
            cagCount++;
          } else {
            if (cagCount > 35) { // Pathogenic threshold
              mutations.push({
                id: `huntington_cag_${lastPos - (cagCount * 3)}`,
                marker: DISEASE_MARKERS.huntington,
                position: lastPos - (cagCount * 3),
                sequence: 'CAG'.repeat(cagCount),
                type: "expansion",
                confidence: 95,
                description: `Expanded CAG repeats (${cagCount}) detected - Huntington's Disease`
              });
            }
            cagCount = 1;
          }
          lastPos = match.index;
        }
        
        // Check final run
        if (cagCount > 35) {
          mutations.push({
            id: `huntington_cag_${lastPos - (cagCount * 3)}`,
            marker: DISEASE_MARKERS.huntington,
            position: lastPos - (cagCount * 3),
            sequence: 'CAG'.repeat(cagCount),
            type: "expansion",
            confidence: 95,
            description: `Expanded CAG repeats (${cagCount}) detected - Huntington's Disease`
          });
        }
      }
    } catch (error) {
      console.error(`Error processing disease ${key}:`, error);
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

// Process messages from main thread
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    switch (type) {
      case 'DETECT_MUTATIONS':
        const { sequence, options = {} } = data;
        
        // Send progress update
        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 0, message: 'Starting disease detection...' },
          id
        });
        
        const mutations = detectMutations(sequence);
        
        // Send progress update
        self.postMessage({
          type: 'PROGRESS',
          data: { progress: 50, message: 'Creating annotations...' },
          id
        });
        
        const annotations = createAnnotationsFromMutations(mutations);
        
        // Send results
        self.postMessage({
          type: 'MUTATIONS_DETECTED',
          data: { mutations, annotations },
          id
        });
        break;
        
      default:
        self.postMessage({
          type: 'ERROR',
          data: { error: `Unknown message type: ${type}` },
          id
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      data: { error: error.message, stack: error.stack },
      id
    });
  }
};

// Send ready signal
self.postMessage({ type: 'READY' });