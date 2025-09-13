import React from 'react';

export interface Annotation {
  id: string;
  start: number;
  end: number;
  name: string;
  type: string;
  color: string;
  direction?: 1 | -1;
}

export interface Size {
  width: number;
  height: number;
}

interface CircularViewerProps {
  annotations: Annotation[];
  sequence: string;
  name: string;
  size: Size;
  showComplement?: boolean;
  showIndex?: boolean;
  rotateOnScroll?: boolean;
}

export const CircularViewer: React.FC<CircularViewerProps> = ({
  annotations,
  sequence,
  name,
  size,
  showComplement = false,
  showIndex = true,
  rotateOnScroll = false,
}) => {
  const radius = Math.min(size.width, size.height) * 0.3;
  const centerX = size.width / 2;
  const centerY = size.height / 2;

  return (
    <div className="circular-viewer-container">
      <svg width={size.width} height={size.height}>
        <defs>
          <radialGradient id="circleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </radialGradient>
        </defs>

        {/* Background */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 40}
          fill="url(#circleGradient)"
          stroke="none"
        />

        {/* Main DNA circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="4"
        />

        {/* Annotations */}
        {annotations.map((annotation, index) => {
          const startAngle = ((annotation.start - 1) / sequence.length) * 2 * Math.PI - Math.PI / 2;
          const endAngle = ((annotation.end - 1) / sequence.length) * 2 * Math.PI - Math.PI / 2;
          
          const annotationRadius = radius + 20 + (index % 3) * 15;
          const startX = centerX + annotationRadius * Math.cos(startAngle);
          const startY = centerY + annotationRadius * Math.sin(startAngle);
          const endX = centerX + annotationRadius * Math.cos(endAngle);
          const endY = centerY + annotationRadius * Math.sin(endAngle);
          
          const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
          const sweepFlag = endAngle > startAngle ? 1 : 0;

          return (
            <path
              key={annotation.id}
              d={`M ${startX} ${startY} A ${annotationRadius} ${annotationRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`}
              fill="none"
              stroke={annotation.color}
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.8"
            />
          );
        })}

        {/* Center label */}
        <circle
          cx={centerX}
          cy={centerY}
          r="50"
          fill="white"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        
        <text
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="16"
          fontWeight="bold"
          fill="#333"
        >
          {name.length > 12 ? name.slice(0, 12) + '...' : name}
        </text>
        <text
          x={centerX}
          y={centerY + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill="#666"
        >
          {sequence.length.toLocaleString()} bp
        </text>
      </svg>
    </div>
  );
};