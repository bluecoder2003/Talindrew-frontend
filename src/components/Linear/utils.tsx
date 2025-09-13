import { NameRange, Translation } from './types';
import { SeqType } from './types';

/**
 * Create a random 10 digit string ID
 */
export const randomID = (n = 10) => {
  const add = 1;
  let max = 12 - add;
  max = Math.pow(10, n + add);
  const min = max / 10;
  const number = Math.floor(Math.random() * (max - min + 1)) + min;
  return String(number).substring(add);
};

/**
 * Take an array of elements and create a 2D array where non-overlapping elements are in
 * the same row.
 */
export const stackElements = <T extends NameRange>(elements: T[], seqL: number): T[][] =>
  [...elements]
    .sort((a, b) => a.end - b.end)
    .sort((a, b) => a.start - b.start)
    .reduce((acc: T[][], a) => {
      const insertIndex = acc.findIndex(elements => {
        if (a.end === a.start) {
          return false;
        }
        const last = elements[elements.length - 1];
        if (last.end <= last.start) {
          return last.end + seqL <= a.start;
        }
        if (a.end > a.start) {
          return last.end <= a.start;
        }
        const first = elements[0];
        return last.end < a.start && a.end < first.start;
      });

      if (insertIndex > -1) {
        acc[insertIndex].push(a);
      } else {
        acc.push([a]);
      }
      return acc;
    }, []);

/**
 * given an array of arrays of an element, fragment the element into seq blocks
 */
export const createMultiRows = <T extends NameRange>(elements: T[][], rowLength: number, rowCount: number): T[][][] => {
  const newArr: T[][][] = new Array(rowCount);

  // initialize the nested rows in each block
  for (let i = 0; i < rowCount; i += 1) {
    newArr[i] = [];
    for (let j = 0; j < elements.length; j += 1) {
      newArr[i][j] = [];
    }
  }

  // for each row of input
  for (let i = 0; i < elements.length; i += 1) {
    // for each element in that row
    for (let j = 0; j < elements[i].length; j += 1) {
      // if the element doesn't cross the zero index
      if (elements[i][j].start < elements[i][j].end) {
        let k = Math.max(0, Math.floor(elements[i][j].start / rowLength));
        const end = Math.floor((elements[i][j].end - 1) / rowLength);

        while (k <= end && k < rowCount) {
          newArr[k][i].push(elements[i][j]);
          k += 1;
        }
      } else if (elements[i][j].end < elements[i][j].start) {
        let e = Math.floor((elements[i][j].end - 1) / rowLength);
        if (elements[i][j].end === 0) {
          e = -1;
        }
        while (e >= 0 && e < newArr.length) {
          newArr[e][i].push(elements[i][j]);
          e -= 1;
        }

        let s = Math.floor(elements[i][j].start / rowLength);
        while (s < rowCount) {
          newArr[s][i].push(elements[i][j]);
          s += 1;
        }
      } else if (elements[i][j].end === elements[i][j].start) {
        for (let a = 0; a < newArr.length; a += 1) {
          newArr[a][i].push(elements[i][j]);
        }

        if (elements[i][j].end === 0) {
          continue;
        }

        const s = Math.floor(elements[i][j].start / rowLength);
        newArr[s][i].push(elements[i][j]);
      }
    }
  }

  for (let i = 0; i < rowCount; i += 1) {
    newArr[i] = newArr[i].filter(a => a[0]);
  }
  return newArr;
};

/**
 * Given an array of elements and an interval, bin elements into rows.
 */
export const createSingleRows = <T extends NameRange>(
  elements: T[],
  rowLength: number,
  rowCount: number,
  duplicateIdsAllowed = true
): T[][] => {
  const newArr: T[][] = new Array(rowCount);

  for (let i = 0; i < rowCount; i += 1) {
    newArr[i] = [];
  }

  for (let i = 0; i < elements.length; i += 1) {
    const { end, start } = elements[i];

    if (start < end) {
      let k = Math.floor(start / rowLength);
      const rowEnd = Math.floor((end - 1) / rowLength);

      while (k <= rowEnd && k < rowCount) {
        newArr[k].push(elements[i]);
        k += 1;
      }
    } else {
      let e = Math.floor(end / rowLength);
      while (e >= 0) {
        newArr[e].push(elements[i]);
        e -= 1;
      }

      let s = Math.floor(start / rowLength);
      while (s < rowCount) {
        if (duplicateIdsAllowed || newArr[s].every(el => el.id !== elements[i].id)) {
          newArr[s].push(elements[i]);
        }
        s += 1;
      }
    }
  }

  return newArr;
};

/**
 * Reverse complement map for DNA/RNA
 */
const dnaComp = {
  a: 't', A: 'T',
  t: 'a', T: 'A',
  g: 'c', G: 'C',
  c: 'g', C: 'G',
  u: 'a', U: 'A',
  n: 'n', N: 'N',
  r: 'y', R: 'Y',
  y: 'r', Y: 'R',
  s: 's', S: 'S',
  w: 'w', W: 'W',
  k: 'm', K: 'M',
  m: 'k', M: 'K',
  b: 'v', B: 'V',
  v: 'b', V: 'B',
  d: 'h', D: 'H',
  h: 'd', H: 'D',
  x: 'x', X: 'X',
};

/**
 * Return the complement of a sequence
 */
export const complement = (seq: string, seqType: SeqType): string => {
  if (seqType === 'aa') return '';
  
  let result = '';
  for (let i = 0; i < seq.length; i++) {
    const char = seq[i];
    result += dnaComp[char] || char;
  }
  return result;
};

/**
 * Guess sequence type based on content
 */
export const guessType = (seq: string): SeqType => {
  const testSeq = seq.substring(0, 1000).toLowerCase();
  if (/^[atgcn.]+$/.test(testSeq)) {
    return 'dna';
  } else if (/^[augcn.]+$/.test(testSeq)) {
    return 'rna';
  } else if (/^[acdefghiklmnpqrstvwy*]+$/i.test(testSeq)) {
    return 'aa';
  }
  return 'unknown';
};

/**
 * Parse directionality from various formats
 */
export const directionality = (direction: number | string | undefined): -1 | 0 | 1 => {
  if (!direction) return 0;
  
  const fwd = new Set(['FWD', 'fwd', 'FORWARD', 'forward', 'FOR', 'for', 'TOP', 'top', '1', 1]);
  const rev = new Set(['REV', 'rev', 'REVERSE', 'reverse', 'BOTTOM', 'bottom', '-1', -1]);
  
  if (fwd.has(direction)) return 1;
  if (rev.has(direction)) return -1;
  return 0;
};

/**
 * Create translations for the linear viewer
 */
export const createTranslations = (translations: NameRange[], seq: string, seqType: SeqType): Translation[] => {
  return translations.map(t => ({
    ...t,
    AAseq: 'MOCK_TRANSLATION', // Simplified for now
    direction: t.direction > 0 ? 1 : -1,
  })) as Translation[];
};