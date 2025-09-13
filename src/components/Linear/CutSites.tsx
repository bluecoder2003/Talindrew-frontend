import React from 'react';
import { cutSite, cutSiteHighlight, svgText } from './styles';
import { CutSite } from '../circular/types';

interface CutSitesProps {
  charWidth: number;
  cutSiteRows: CutSite[][];
  elementHeight: number;
  inputRef: (id: string, ref: any) => void;
  lineHeight: number;
  seqFontSize: number;
  start: number;
  yOffset: number;
}

/**
 * CutSites renders restriction enzyme cut sites in the linear viewer
 */
export const CutSites: React.FC<CutSitesProps> = ({
  charWidth,
  cutSiteRows,
  elementHeight,
  inputRef,
  lineHeight,
  seqFontSize,
  start,
  yOffset,
}) => {
  // Register all cut sites for interaction on mount
  React.useEffect(() => {
    cutSiteRows.forEach((row) => {
      row.forEach((cutSiteData) => {
        inputRef(cutSiteData.id, {
          end: cutSiteData.end,
          ref: cutSiteData.id,
          start: cutSiteData.start,
          type: 'ENZYME',
          viewer: 'LINEAR',
          direction: cutSiteData.direction,
          name: cutSiteData.name,
        });
      });
    });
  }, [cutSiteRows, inputRef]);

  if (!cutSiteRows.length) return null;

  return (
    <g className="la-vz-cut-sites">
      {cutSiteRows.map((row, rowIndex) => {
        const y = yOffset + (rowIndex * elementHeight);
        
        return (
          <g key={`cutsite-row-${rowIndex}`}>
            {row.map((cutSiteData) => {
              const position = cutSiteData.fcut - start;
              
              if (position < 0 || position > (cutSiteData.end - start)) return null;

              const x = position * charWidth;

              return (
                <g key={cutSiteData.id}>
                  {/* Cut site line */}
                  <line
                    style={cutSite}
                    x1={x}
                    x2={x}
                    y1={y}
                    y2={y + elementHeight}
                  />
                  
                  {/* Enzyme name label */}
                  <text
                    style={{
                      ...svgText,
                      fontSize: `${Math.min(seqFontSize - 1, 9)}px`,
                      fill: 'rgb(115, 119, 125)',
                    }}
                    x={x + 2}
                    y={y + 12}
                    textAnchor="start"
                    dominantBaseline="middle"
                  >
                    {cutSiteData.name}
                  </text>
                  
                  {/* Invisible click target for better interaction */}
                  <rect
                    style={{
                      ...cutSiteHighlight,
                      cursor: 'pointer',
                    }}
                    x={x - 3}
                    y={y}
                    width={6}
                    height={elementHeight}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};