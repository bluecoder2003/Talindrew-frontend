// Utility functions for the circular viewer

export const CHAR_WIDTH = 7; // Character width in pixels

/**
 * Stack elements into non-overlapping rows
 */
export const stackElements = <T extends { start: number; end: number }>(
  elements: T[],
  seqLength: number
): T[][] => {
  if (!elements.length) return [];

  const sortedElements = [...elements].sort((a, b) => a.start - b.start);
  const rows: T[][] = [];

  for (const element of sortedElements) {
    let placed = false;
    
    // Try to place in existing rows
    for (const row of rows) {
      const canPlace = row.every(existing => {
        // Check if elements overlap
        const elementEnd = element.end < element.start ? element.end + seqLength : element.end;
        const existingEnd = existing.end < existing.start ? existing.end + seqLength : existing.end;
        
        const elementStart = element.start;
        const existingStart = existing.start;
        
        // No overlap if one ends before the other starts
        return elementEnd <= existingStart || existingEnd <= elementStart;
      });
      
      if (canPlace) {
        row.push(element);
        placed = true;
        break;
      }
    }
    
    // Create new row if couldn't place in existing rows
    if (!placed) {
      rows.push([element]);
    }
  }
  
  return rows;
};

/**
 * Deep equality comparison
 */
export const isEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  if (!a || !b || (typeof a !== 'object' && typeof b !== 'object')) {
    return a === b;
  }
  
  if (a === null || a === undefined || b === null || b === undefined) {
    return false;
  }
  
  if (a.prototype !== b.prototype) return false;
  
  let keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) {
    return false;
  }
  
  return keys.every(k => isEqual(a[k], b[k]));
};

/**
 * Color manipulation utilities
 */
export const COLOR_BORDER_MAP: { [key: string]: string } = {
  '#FF6B6B': '#D63031',
  '#4ECDC4': '#00B894',
  '#45B7D1': '#0984E3',
  '#96CEB4': '#6C5CE7',
  '#FFEAA7': '#FDCB6E',
  '#DDA0DD': '#A29BFE',
  '#98D8C8': '#00CEC9',
  '#F7DC6F': '#E17055',
};

export const darkerColor = (color: string): string => {
  if (COLOR_BORDER_MAP[color]) {
    return COLOR_BORDER_MAP[color];
  }
  
  // Simple darkening function
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const darkerR = Math.max(0, r - 40);
  const darkerG = Math.max(0, g - 40);
  const darkerB = Math.max(0, b - 40);
  
  return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
};