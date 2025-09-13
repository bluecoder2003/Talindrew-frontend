import React from 'react';
import { selection, selectionEdge } from './styles';

interface SelectionProps {
  charWidth: number;
  height: number;
  selectionEnd: number;
  selectionStart: number;
  start: number;
  width: number;
  y: number;
}

/**
 * Selection renders the visual selection highlight in the linear viewer
 */
export const Selection: React.FC<SelectionProps> = ({
  charWidth,
  height,
  selectionEnd,
  selectionStart,
  start,
  width,
  y,
}) => {
  // Calculate relative positions
  const relativeStart = Math.max(0, selectionStart - start);
  const relativeEnd = Math.min(selectionEnd - start, width / charWidth);
  
  if (relativeStart >= relativeEnd) return null;

  const x = relativeStart * charWidth;
  const selectionWidth = (relativeEnd - relativeStart) * charWidth;

  return (
    <g className="la-vz-selection" data-testid="la-vz-selection-block">
      {/* Selection highlight */}
      <rect
        style={selection}
        x={x}
        y={y}
        width={selectionWidth}
        height={height}
      />
      
      {/* Selection start edge */}
      {relativeStart >= 0 && (
        <rect
          style={selectionEdge}
          x={x - 1}
          y={y}
          width={2}
          height={height}
          data-testid="la-vz-selection-edge"
        />
      )}
      
      {/* Selection end edge */}
      {relativeEnd <= width / charWidth && (
        <rect
          style={selectionEdge}
          x={x + selectionWidth - 1}
          y={y}
          width={2}
          height={height}
          data-testid="la-vz-selection-edge"
        />
      )}
    </g>
  );
};