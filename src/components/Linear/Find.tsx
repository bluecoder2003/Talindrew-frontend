import React from 'react';
import { search } from './styles';
import { NameRange } from './types';

interface FindProps {
  charWidth: number;
  height: number;
  inputRef: (id: string, ref: any) => void;
  searchRows: NameRange[][];
  start: number;
  y: number;
}

/**
 * Find renders search result highlights in the linear viewer
 */
export const Find: React.FC<FindProps> = ({
  charWidth,
  height,
  inputRef,
  searchRows,
  start,
  y,
}) => {
  // Register all search results for interaction on mount
  React.useEffect(() => {
    searchRows.forEach((row) => {
      row.forEach((result) => {
        inputRef(result.id, {
          end: result.end,
          ref: result.id,
          start: result.start,
          type: 'FIND',
          viewer: 'LINEAR',
          direction: result.direction,
          name: result.name,
        });
      });
    });
  }, [searchRows, inputRef]);

  if (!searchRows.length) return null;

  return (
    <g className="la-vz-find">
      {searchRows.map((row, rowIndex) => 
        row.map((result) => {
          const relativeStart = Math.max(0, result.start - start);
          const relativeEnd = Math.min(result.end - start, result.end - result.start);
          
          if (relativeStart >= relativeEnd) return null;

          const x = relativeStart * charWidth;
          const width = (relativeEnd - relativeStart) * charWidth;

          return (
            <rect
              key={result.id}
              style={search}
              x={x}
              y={y}
              width={width}
              height={height}
            />
          );
        })
      )}
    </g>
  );
};