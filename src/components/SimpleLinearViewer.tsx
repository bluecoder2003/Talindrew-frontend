import React, { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ZoomIn, ZoomOut, Search, Eye, EyeOff, Palette } from "lucide-react";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";

export interface Annotation {
  id: string;
  start: number;
  end: number;
  name: string;
  type: string;
  color: string;
  direction?: "forward" | "reverse" | "none";
  description?: string;
}

interface SimpleLinearViewerProps {
  sequence: string;
  sequenceType: "dna" | "rna" | "protein";
  name?: string;
  annotations?: Annotation[];
  showComplement?: boolean;
  showIndices?: boolean;
}

export const SimpleLinearViewer: React.FC<SimpleLinearViewerProps> = ({
  sequence,
  sequenceType,
  name = "Sequence",
  annotations = [],
  showComplement = true,
  showIndices = true,
}) => {
  const [zoom, setZoom] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [showComplementInternal, setShowComplementInternal] = useState(showComplement);
  const [showIndicesInternal, setShowIndicesInternal] = useState(showIndices);
  const [showColorLegend, setShowColorLegend] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Base colors for DNA/RNA
  const baseColors = {
    'A': '#E53E3E', // Red
    'T': '#3182CE', // Blue  
    'U': '#3182CE', // Blue (for RNA)
    'G': '#38A169', // Green
    'C': '#D69E2E', // Orange/Yellow
    'a': '#E53E3E',
    't': '#3182CE',
    'u': '#3182CE',
    'g': '#38A169',
    'c': '#D69E2E',
  };

  // Generate complement sequence
  const getComplement = (base: string): string => {
    const complements: { [key: string]: string } = {
      'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
      'a': 't', 't': 'a', 'g': 'c', 'c': 'g',
      'U': 'A', 'u': 'a'
    };
    return complements[base] || base;
  };

  const complementSequence = useMemo(() => {
    return sequence.split('').map(base => getComplement(base)).join('');
  }, [sequence]);

  // Search functionality
  const searchMatches = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const matches = [];
    const regex = new RegExp(searchTerm, 'gi');
    let match;
    
    while ((match = regex.exec(sequence)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + searchTerm.length - 1,
        length: searchTerm.length
      });
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }
    
    return matches;
  }, [sequence, searchTerm]);

  // Unique annotation types for legend
  const annotationTypes = useMemo(() => {
    const types = new Map<string, { color: string, count: number }>();
    
    annotations.forEach(ann => {
      const existing = types.get(ann.type) || { color: ann.color, count: 0 };
      types.set(ann.type, { color: ann.color, count: existing.count + 1 });
    });
    
    return Array.from(types.entries()).map(([type, data]) => ({
      type,
      color: data.color,
      count: data.count
    }));
  }, [annotations]);

  // Check if position is in annotation
  const getAnnotationAtPosition = (position: number) => {
    return annotations.find(ann => position >= ann.start && position <= ann.end);
  };

  // Check if position is in search match
  const isSearchMatch = (position: number) => {
    return searchMatches.some(match => position >= match.start && position <= match.end);
  };

  // Render single line sequence
  const renderSequence = () => {
    return (
      <div className="sequence-container">
        {/* Position indicators */}
        {showIndicesInternal && (
          <div className="flex items-center mb-2">
            <div className="w-12 text-xs text-muted-foreground text-right mr-2">
              Pos:
            </div>
            <div className="text-xs text-muted-foreground">
              {Array.from({ length: Math.ceil(sequence.length / 10) }, (_, i) => {
                const pos = i * 10 + 1;
                return pos <= sequence.length ? (
                  <span 
                    key={i} 
                    className="inline-block text-center" 
                    style={{ width: `${10 * (zoom * 0.6)}px` }}
                  >
                    {pos}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}
        
        {/* Annotations track */}
        <div className="flex items-center mb-2">
          <div className="w-12 mr-2"></div>
          <div className="relative h-4" style={{ width: `${sequence.length * (zoom * 0.6)}px` }}>
            {annotations.map(ann => {
              const width = (ann.end - ann.start + 1) * (zoom * 0.6);
              const left = ann.start * (zoom * 0.6);
              
              return (
                <div
                  key={ann.id}
                  className="absolute h-3 rounded text-xs text-white flex items-center justify-center cursor-pointer hover:opacity-80 shadow-sm"
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    backgroundColor: ann.color,
                    fontSize: Math.max(8, zoom * 0.5) + 'px',
                    minWidth: '2px'
                  }}
                  title={`${ann.name} (${ann.start}-${ann.end}) - ${ann.description || ann.type}`}
                >
                  {width > 20 ? ann.name.slice(0, Math.floor(width / 8)) : ''}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Main sequence */}
        <div className="flex items-center mb-2">
          <div className="w-12 text-xs text-muted-foreground text-right mr-2">
            {showIndicesInternal ? '1' : ''}
          </div>
          <div 
            className="font-mono"
            style={{ fontSize: `${zoom}px`, letterSpacing: '1px' }}
          >
            {sequence.split('').map((base, i) => {
              const annotation = getAnnotationAtPosition(i);
              const isMatch = isSearchMatch(i);
              const baseColor = baseColors[base as keyof typeof baseColors] || '#6B7280';
              
              return (
                <span
                  key={i}
                  style={{ 
                    color: baseColor,
                    backgroundColor: isMatch ? '#FEF08A' : 'transparent',
                    fontWeight: annotation ? 'bold' : 'normal'
                  }}
                  title={annotation ? `Position ${i + 1}: ${base} - ${annotation.name} (${annotation.type})` : `Position ${i + 1}: ${base}`}
                >
                  {base}
                </span>
              );
            })}
          </div>
          <div className="w-12 text-xs text-muted-foreground text-left ml-2">
            {showIndicesInternal ? sequence.length : ''}
          </div>
        </div>
        
        {/* Complement sequence */}
        {showComplementInternal && sequenceType !== "protein" && (
          <div className="flex items-center">
            <div className="w-12 text-xs text-muted-foreground text-right mr-2">
              {sequence.length}
            </div>
            <div 
              className="font-mono"
              style={{ fontSize: `${zoom}px`, letterSpacing: '1px' }}
            >
              {complementSequence.split('').map((base, i) => {
                const baseColor = baseColors[base as keyof typeof baseColors] || '#6B7280';
                
                return (
                  <span
                    key={i}
                    style={{ color: baseColor, opacity: 0.7 }}
                    title={`Position ${i + 1}: ${base} (complement)`}
                  >
                    {base}
                  </span>
                );
              })}
            </div>
            <div className="w-12 text-xs text-muted-foreground text-left ml-2">
              1
            </div>
          </div>
        )}
      </div>
    );
  };

  const ColorLegend = () => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Color Legend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Base colors */}
          <div>
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Base Colors</h4>
            <div className="space-y-1">
              {Object.entries(baseColors).filter(([base]) => base === base.toUpperCase()).map(([base, color]) => (
                <div key={base} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded border"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-mono font-medium">{base}</span>
                  <span className="text-xs text-muted-foreground">
                    {base === 'A' ? 'Adenine' : 
                     base === 'T' ? 'Thymine' :
                     base === 'G' ? 'Guanine' : 
                     base === 'C' ? 'Cytosine' : base}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Annotation colors */}
          {annotationTypes.length > 0 && (
            <div>
              <h4 className="text-xs font-medium mb-2 text-muted-foreground">Annotations</h4>
              <div className="space-y-1">
                {annotationTypes.map(({ type, color, count }) => (
                  <div key={type} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Search and other indicators */}
          <div>
            <h4 className="text-xs font-medium mb-2 text-muted-foreground">Indicators</h4>
            <div className="space-y-1">
              {searchMatches.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-200 border" />
                  <span className="text-sm">Search matches</span>
                  <Badge variant="secondary" className="text-xs">
                    {searchMatches.length}
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-transparent border border-dashed" />
                <span className="text-sm">Bold = Annotated</span>
              </div>
              {showComplementInternal && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-400 opacity-70 border" />
                  <span className="text-sm">Complement (70% opacity)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full">
      {/* Controls */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{name}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{sequenceType.toUpperCase()}</Badge>
            <span>{sequence.length.toLocaleString()} bases</span>
            {annotations.length > 0 && (
              <span>• {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search sequence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            {searchMatches.length > 0 && (
              <Badge variant="secondary">
                {searchMatches.length} match{searchMatches.length !== 1 ? 'es' : ''}
              </Badge>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Zoom:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(8, zoom - 1))}
                disabled={zoom <= 8}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm w-8 text-center">{zoom}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(20, zoom + 1))}
                disabled={zoom >= 20}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            

            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={showIndicesInternal}
                  onCheckedChange={setShowIndicesInternal}
                />
                <Label className="text-sm">Indices</Label>
              </div>
              
              {sequenceType !== "protein" && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showComplementInternal}
                    onCheckedChange={setShowComplementInternal}
                  />
                  <Label className="text-sm">Complement</Label>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowColorLegend(!showColorLegend)}
              >
                <Palette className="w-4 h-4 mr-1" />
                {showColorLegend ? 'Hide' : 'Show'} Colors
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Color Legend */}
      {showColorLegend && <ColorLegend />}
      
      {/* Sequence Display */}
      <Card>
        <CardContent className="p-6">
          <div 
            ref={containerRef}
            className="overflow-x-auto overflow-y-visible"
            style={{ 
              maxWidth: '100%',
              minHeight: showComplementInternal ? '120px' : '80px'
            }}
          >
            {renderSequence()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};