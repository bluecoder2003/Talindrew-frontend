import React from 'react';
import { annotation, annotationLabel } from './styles';
import { Annotation } from '../circular/types';

interface AnnotationsProps {
  annotationRows: Annotation[][];
  charWidth: number;
  elementHeight: number;
  inputRef: (id: string, ref: any) => void;
  lineHeight: number;
  seqFontSize: number;
  start: number;
  yOffset: number;
}

/**
 * Annotations renders annotation blocks and labels for the linear viewer
 */
export const Annotations: React.FC<AnnotationsProps> = ({
  annotationRows,
  charWidth,
  elementHeight,
  inputRef,
  lineHeight,
  seqFontSize,
  start,
  yOffset,
}) => {
  // Register all annotations for interaction on mount
  React.useEffect(() => {
    annotationRows.forEach((row) => {
      row.forEach((ann) => {
        const isForward = ann.direction === 'forward' || ann.direction === 1;
        inputRef(ann.id, {
          end: ann.end,
          ref: ann.id,
          start: ann.start,
          type: 'ANNOTATION',
          viewer: 'LINEAR',
          direction: isForward ? 1 : -1,
          name: ann.name,
        });
      });
    });
  }, [annotationRows, inputRef]);

  if (!annotationRows.length) return null;

  return (
    <g className="la-vz-annotations">
      {annotationRows.map((row, rowIndex) => {
        const y = yOffset + (rowIndex * elementHeight);
        
        return (
          <g key={`annotation-row-${rowIndex}`}>
            {row.map((ann) => {
              const relativeStart = Math.max(0, ann.start - start);
              const relativeEnd = Math.min(ann.end - start, (ann.end - start));
              
              if (relativeStart >= relativeEnd) return null;

              const x = relativeStart * charWidth;
              const width = (relativeEnd - relativeStart) * charWidth;
              const isForward = ann.direction === 'forward' || ann.direction === 1;

              return (
                <g key={ann.id}>
                  {/* Annotation rectangle */}
                  <rect
                    style={{
                      ...annotation,
                      fill: ann.color || '#9DEAED',
                      stroke: ann.color || '#9DEAED',
                    }}
                    x={x}
                    y={y}
                    width={width}
                    height={elementHeight - 2}
                    rx={2}
                    ry={2}
                  />
                  
                  {/* Direction arrow */}
                  {isForward ? (
                    // Forward arrow
                    <polygon
                      style={{
                        ...annotation,
                        fill: ann.color || '#9DEAED',
                        stroke: ann.color || '#9DEAED',
                      }}
                      points={`${x + width - 8},${y + 2} ${x + width - 2},${y + elementHeight / 2} ${x + width - 8},${y + elementHeight - 4}`}
                    />
                  ) : (
                    // Reverse arrow
                    <polygon
                      style={{
                        ...annotation,
                        fill: ann.color || '#9DEAED',
                        stroke: ann.color || '#9DEAED',
                      }}
                      points={`${x + 8},${y + 2} ${x + 2},${y + elementHeight / 2} ${x + 8},${y + elementHeight - 4}`}
                    />
                  )}
                  
                  {/* Annotation label */}
                  {width > 30 && (
                    <text
                      style={{
                        ...annotationLabel,
                        fontSize: `${Math.min(seqFontSize, 10)}px`,
                      }}
                      x={x + width / 2}
                      y={y + elementHeight / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {ann.name.length > 12 ? `${ann.name.substring(0, 12)}...` : ann.name}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};