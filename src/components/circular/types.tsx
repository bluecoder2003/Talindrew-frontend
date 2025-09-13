// TypeScript types and interfaces for the circular viewer

export interface Coor {
  x: number;
  y: number;
}

export interface Size {
  height: number;
  width: number;
}

export interface Range {
  start: number;
  end: number;
  direction?: -1 | 1;
}

export interface Highlight extends Range {
  color?: string;
}

export interface HighlightProp extends Range {
  color?: string;
}

export interface CutSite {
  id: string;
  start: number;
  end: number;
  fcut: number;
  rcut: number;
  enzyme: {
    id?: string;
    name: string;
    color?: string;
  };
}

export interface Annotation {
  id: string;
  start: number;
  end: number;
  name: string;
  type?: string;
  color: string;
  direction?: -1 | 1;
}

export interface SelectionContext {
  start?: number;
  end?: number;
  clockwise?: boolean;
  ref?: string;
}

export interface CentralIndexContext {
  circular: number;
  setCentralIndex: (viewer: string, index: number) => void;
}

export type InputRefFunc = (
  id: string,
  ref: {
    ref?: string;
    start?: number;
    end?: number;
    direction?: -1 | 1;
    name?: string;
    type?: string;
    viewer?: string;
  }
) => (element: SVGElement | null) => void;