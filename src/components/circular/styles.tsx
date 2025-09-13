// Style objects for the circular viewer components

export const viewerCircular: React.CSSProperties = {
  overflow: 'visible',
};

export const annotation: React.CSSProperties = {
  fillOpacity: '0.7',
  strokeOpacity: '1.0',
  strokeWidth: '1px',
};

export const annotationLabel: React.CSSProperties = {
  fill: 'white',
  fontSize: '12px',
  fontFamily: 'monospace',
  textAnchor: 'middle',
  dominantBaseline: 'middle',
  cursor: 'pointer',
};

export const svgText: React.CSSProperties = {
  fill: 'white',
  fontSize: '12px',
  fontFamily: 'monospace',
};

export const selection: React.CSSProperties = {
  fill: 'rgba(0, 123, 255, 0.3)',
  stroke: 'rgba(0, 123, 255, 0.8)',
  strokeWidth: '1px',
};

export const selectionEdge: React.CSSProperties = {
  fill: 'none',
  stroke: 'rgba(0, 123, 255, 0.8)',
  strokeWidth: '2px',
};

export const search: React.CSSProperties = {
  fill: 'rgba(255, 255, 0, 0.5)',
  stroke: 'rgba(255, 193, 7, 0.8)',
  strokeWidth: '1px',
};

export const indexLine: React.CSSProperties = {
  fill: 'none',
  stroke: 'white',
  strokeWidth: '2px',
};

export const indexTick: React.CSSProperties = {
  fill: 'none',
  stroke: 'white',
  strokeWidth: '1px',
};

export const indexTickLabel: React.CSSProperties = {
  fill: 'white',
  fontSize: '10px',
  fontFamily: 'monospace',
  textAnchor: 'middle',
};

export const cutSite: React.CSSProperties = {
  fill: 'none',
  stroke: 'red',
  strokeWidth: '2px',
};

export const cutSiteHighlight: React.CSSProperties = {
  fill: 'rgba(255, 0, 0, 0.2)',
  stroke: 'red',
  strokeWidth: '1px',
};

export const circularLabel: React.CSSProperties = {
  fill: 'white',
  fontSize: '12px',
  fontFamily: 'monospace',
  cursor: 'pointer',
  textDecoration: 'none',
};

export const circularLabelLine: React.CSSProperties = {
  fill: 'none',
  stroke: 'white',
  strokeWidth: '1px',
};