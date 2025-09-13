import React from 'react';
import { SeqBlockProps } from './types';
import { seqBlock } from './styles';
import { Index } from './Index';
import { Sequence } from './Sequence';
import { Annotations } from './Annotations';
import { CutSites } from './CutSites';
import { Selection } from './Selection';
import { Find } from './Find';
import { complement } from './utils';

/**
 * SeqBlock is a single block of the linear sequence viewer.
 * It renders a slice of the sequence with all associated elements.
 */
export const SeqBlock: React.FC<SeqBlockProps> = ({
  annotationRows,
  bpsPerBlock,
  charWidth,
  compSeq,
  cutSiteRows,
  elementHeight,
  fullSeq,
  handleMouseEvent,
  highlightRows,
  id,
  inputRef,
  lineHeight,
  onUnmount,
  primers,
  searchRows,
  seq,
  seqFontSize,
  showComplement,
  showIndex,
  size,
  start,
  translationRows,
}) => {
  const seqBlockRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    return () => {
      onUnmount(id);
    };
  }, [id, onUnmount]);

  const { width } = size;
  
  // Calculate height based on content
  let currentY = 0;
  const spacing = 4;
  
  // Index height
  const indexHeight = showIndex ? elementHeight : 0;
  currentY += indexHeight + spacing;
  
  // Annotation rows height
  const annotationHeight = annotationRows.length * elementHeight;
  const annotationsY = currentY;
  currentY += annotationHeight + spacing;
  
  // Cut sites height
  const cutSitesHeight = cutSiteRows.length * elementHeight;
  const cutSitesY = currentY;
  currentY += cutSitesHeight + spacing;
  
  // Main sequence height
  const sequenceY = currentY;
  currentY += lineHeight + spacing;
  
  // Complement sequence height
  const complementY = showComplement ? currentY : 0;
  if (showComplement) {
    currentY += lineHeight + spacing;
  }
  
  const totalHeight = currentY;
  
  // Get complement sequence slice
  const complementSeq = showComplement ? complement(seq, 'dna') : '';

  return (
    <div
      ref={seqBlockRef}
      id={id}
      style={seqBlock}
      onMouseDown={handleMouseEvent}
      onMouseMove={handleMouseEvent}
      onMouseUp={handleMouseEvent}
    >
      <svg width={width} height={totalHeight}>
        {/* Index */}
        {showIndex && (
          <g transform={`translate(0, 0)`}>
            <Index
              bpsPerBlock={bpsPerBlock}
              charWidth={charWidth}
              elementHeight={elementHeight}
              lineHeight={lineHeight}
              seqBlockRef={seqBlockRef}
              showIndex={showIndex}
              size={size}
              start={start}
            />
          </g>
        )}
        
        {/* Annotations */}
        {annotationRows.length > 0 && (
          <Annotations
            annotationRows={annotationRows}
            charWidth={charWidth}
            elementHeight={elementHeight}
            inputRef={inputRef}
            lineHeight={lineHeight}
            seqFontSize={seqFontSize}
            start={start}
            yOffset={annotationsY}
          />
        )}
        
        {/* Cut Sites */}
        {cutSiteRows.length > 0 && (
          <CutSites
            charWidth={charWidth}
            cutSiteRows={cutSiteRows}
            elementHeight={elementHeight}
            inputRef={inputRef}
            lineHeight={lineHeight}
            seqFontSize={seqFontSize}
            start={start}
            yOffset={cutSitesY}
          />
        )}
        
        {/* Search results */}
        {searchRows.length > 0 && (
          <Find
            charWidth={charWidth}
            height={lineHeight}
            inputRef={inputRef}
            searchRows={searchRows}
            start={start}
            y={sequenceY}
          />
        )}
        
        {/* Main sequence */}
        <Sequence
          bpColors={{}}
          charWidth={charWidth}
          id={`${id}-seq`}
          inputRef={inputRef}
          lineHeight={lineHeight}
          seq={seq}
          seqFontSize={seqFontSize}
          start={start}
          y={sequenceY + lineHeight / 2}
        />
        
        {/* Complement sequence */}
        {showComplement && complementSeq && (
          <g data-testid="la-vz-comp-seq">
            <Sequence
              bpColors={{}}
              charWidth={charWidth}
              id={`${id}-comp-seq`}
              inputRef={inputRef}
              lineHeight={lineHeight}
              seq={complementSeq}
              seqFontSize={seqFontSize}
              start={start}
              y={complementY + lineHeight / 2}
            />
          </g>
        )}
      </svg>
    </div>
  );
};