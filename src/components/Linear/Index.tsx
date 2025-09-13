import React from 'react';
import { indexLine, indexTick, indexTickLabel } from './styles';

interface IndexProps {
  bpsPerBlock: number;
  charWidth: number;
  elementHeight: number;
  lineHeight: number;
  seqBlockRef: React.RefObject<HTMLDivElement>;
  showIndex: boolean;
  size: { width: number; height: number };
  start: number;
}

/**
 * Index renders the numbered index along the top of each sequence block
 */
export const Index: React.FC<IndexProps> = ({
  bpsPerBlock,
  charWidth,
  elementHeight,
  lineHeight,
  showIndex,
  size,
  start,
}) => {
  if (!showIndex) return null;

  const { width } = size;
  const height = elementHeight;
  const indexSpacing = Math.max(1, Math.round(bpsPerBlock / 10));
  const indices: number[] = [];

  // Create tick marks every indexSpacing bases
  for (let i = 0; i <= bpsPerBlock; i += indexSpacing) {
    const position = start + i;
    if (position % indexSpacing === 0 || i === 0) {
      indices.push(position);
    }
  }

  return (
    <div className="sequence-index" style={{ height: `${height}px`, marginBottom: '2px' }}>
      <svg width={width} height={height}>
        {/* Main horizontal line */}
        <line
          style={indexLine}
          x1={0}
          x2={width}
          y1={height - 1}
          y2={height - 1}
        />
        
        {indices.map((position, i) => {
          const x = i * indexSpacing * charWidth;
          if (x > width) return null;

          return (
            <g key={`index-${position}`}>
              {/* Tick mark */}
              <line
                style={indexTick}
                x1={x}
                x2={x}
                y1={height - 5}
                y2={height - 1}
              />
              
              {/* Index number */}
              <text
                style={indexTickLabel}
                x={x}
                y={height - 8}
                textAnchor="middle"
              >
                {position + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};