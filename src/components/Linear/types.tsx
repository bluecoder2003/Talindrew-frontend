import { Annotation, CutSite, Highlight, Range, Size, Coor } from '../circular/types';

/** Range is a single element with a range and direction in the viewer */
export interface NameRange extends Range {
  color?: string;
  id: string;
  name: string;
}

/** PrimerProp is a single primer to visualize above/below the linear viewer. */
export interface PrimerProp {
  color?: string;
  direction: 1 | -1;
  end: number;
  id?: string;
  name: string;
  start: number;
}

/** Primer is a single primer for PCR. */
export interface Primer extends NameRange {
  color: string;
  direction: 1 | -1;
}

/** Translation is a single translated CDS. */
export interface Translation extends NameRange {
  AAseq: string;
  direction: -1 | 1;
}

/** SeqBlock represents a single block of sequence in the linear viewer */
export interface SeqBlockProps {
  annotationRows: Annotation[][];
  bpsPerBlock: number;
  charWidth: number;
  children?: React.ReactNode;
  compSeq: string;
  cutSiteRows: CutSite[][];
  elementHeight: number;
  fullSeq: string;
  handleMouseEvent: (e: React.MouseEvent) => void;
  highlightRows: Highlight[][];
  id: string;
  inputRef: (id: string, ref: any) => void;
  lineHeight: number;
  onUnmount: (id: string) => void;
  primers: Primer[];
  searchRows: NameRange[][];
  seq: string;
  seqFontSize: number;
  showComplement: boolean;
  showIndex: boolean;
  size: Size;
  start: number;
  translationRows: Translation[][];
}

/** LinearProps for the main Linear component */
export interface LinearProps {
  annotations: Annotation[];
  bpColors: { [key: number | string]: string };
  bpsPerBlock: number;
  charWidth: number;
  compSeq: string;
  cutSites: CutSite[];
  elementHeight: number;
  handleMouseEvent: (e: React.MouseEvent) => void;
  highlights: Highlight[];
  inputRef: (id: string, ref: any) => void;
  lineHeight: number;
  name: string;
  onUnmount: (id: string) => void;
  primers: Primer[];
  search: NameRange[];
  seq: string;
  seqFontSize: number;
  seqType: 'dna' | 'rna' | 'aa' | 'unknown';
  showComplement: boolean;
  showIndex: boolean;
  size: Size;
  translations: Translation[];
  zoom: { linear: number };
}

export type SeqType = 'dna' | 'rna' | 'aa' | 'unknown';