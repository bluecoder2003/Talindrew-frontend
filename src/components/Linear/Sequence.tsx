import React from 'react';
import { svgText } from './styles';

interface SequenceProps {
  bpColors: { [key: number | string]: string };
  charWidth: number;
  id: string;
  inputRef: (id: string, ref: any) => void;
  lineHeight: number;
  seq: string;
  seqFontSize: number;
  start: number;
  y: number;
}

/**
 * Sequence renders the actual DNA/RNA/protein sequence characters
 */
export const Sequence: React.FC<SequenceProps> = ({
  bpColors,
  charWidth,
  id,
  inputRef,
  lineHeight,
  seq,
  seqFontSize,
  start,
  y,
}) => {
  React.useEffect(() => {
    inputRef(id, {
      end: start + seq.length,
      ref: id,
      start: start,
      type: 'SEQ',
      viewer: 'LINEAR',
    });
  }, [id, inputRef, start, seq.length]);

  // Split sequence into individual characters for rendering
  const characters = seq.split('');

  return (
    <g data-testid="la-vz-seq">
      {characters.map((char, i) => {
        const x = i * charWidth;
        const color = bpColors[i + start] || bpColors[char] || 'inherit';
        
        return (
          <text
            key={`${id}-char-${i}`}
            style={{
              ...svgText,
              fill: color,
              fontSize: `${seqFontSize}px`,
            }}
            x={x}
            y={y}
            textAnchor="start"
            dominantBaseline="middle"
          >
            {char}
          </text>
        );
      })}
    </g>
  );
};