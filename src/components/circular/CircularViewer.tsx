import React, { useState } from 'react';
import { CentralIndexContext, SelectionContext } from './contexts';
import type { CentralIndexContextType, SelectionContextType } from './contexts';

// Types
export interface Annotation {
  id: string;
  start: number;
  end: number;
  name: string;
  type: string;
  color: string;
  direction?: 1 | -1;
}

export interface Coor {
  x: number;
  y: number;
}

export interface Size {
  height: number;
  width: number;
}

// GenArcFunc type
export type GenArcFunc = (args: {
  arrowFWD?: boolean;
  arrowREV?: boolean;
  innerRadius: number;
  largeArc: boolean;
  length: number;
  offset?: number;
  outerRadius: number;
  sweepFWD?: boolean;
}) => string;

// Constants
export const CHAR_WIDTH = 7;
export const RENDER_SEQ_LENGTH_CUTOFF = 250;

// Color utilities
export const COLOR_BORDER_MAP: { [key: string]: string } = {
  '#ff0000': '#cc0000',
  '#00ff00': '#00cc00',
  '#0000ff': '#0000cc',
  '#ffff00': '#cccc00',
  '#ff00ff': '#cc00cc',
  '#00ffff': '#00cccc',
};

export const darkerColor = (color: string): string => {
  return COLOR_BORDER_MAP[color] || color;
};

// Input ref function type
export type InputRefFunc = (id: string, meta: any) => React.RefCallback<any>;

// Main circular viewer component
interface CircularViewerProps {
  annotations: Annotation[];
  sequence: string;
  name: string;
  size: Size;
  showComplement?: boolean;
  showIndex?: boolean;
  rotateOnScroll?: boolean;
}

const CircularViewer: React.FC<CircularViewerProps> = ({
  annotations,
  sequence,
  name,
  size,
  showComplement = false,
  showIndex = true,
  rotateOnScroll = false,
}) => {
  const [centralIndex, setCentralIndexState] = useState(0);
  const [selection, setSelection] = useState<SelectionContextType>({});

  const setCentralIndex = (viewer: string, index: number) => {
    if (viewer === 'CIRCULAR') {
      setCentralIndexState(index);
    }
  };

  const center = { x: size.width / 2, y: size.height / 2 };
  const radius = Math.min(size.width, size.height) * 0.3;

  // Dummy input ref function for now
  const inputRef: InputRefFunc = (id: string, meta: any) => (ref: any) => {};

  const handleMouseEvent = (e: React.MouseEvent) => {
    // Handle mouse events for selection
  };

  return (
    <CentralIndexContext.Provider value={{ circular: centralIndex, setCentralIndex }}>
      <SelectionContext.Provider value={selection}>
        <div className="circular-viewer-container">
          <svg width={size.width} height={size.height}>
            <circle
              cx={size.width / 2}
              cy={size.height / 2}
              r={radius}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            <text
              x={size.width / 2}
              y={size.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#333"
            >
              {name}
            </text>
          </svg>
        </div>
      </SelectionContext.Provider>
    </CentralIndexContext.Provider>
  );
};

// Export the CircularViewer component
export { CircularViewer };

// Export contexts for use in child components
export { CentralIndexContext, SelectionContext } from './contexts';