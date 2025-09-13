import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Calculator, Scissors, RotateCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface SequenceUtilsProps {
  sequence: string;
  sequenceType: 'dna' | 'rna' | 'protein';
}

export const SequenceUtils: React.FC<SequenceUtilsProps> = ({
  sequence,
  sequenceType,
}) => {
  const [reverseComplement, setReverseComplement] = useState('');
  const [translation, setTranslation] = useState('');
  const [selectedFrame, setSelectedFrame] = useState('1');
  const [copiedText, setCopiedText] = useState('');

  const getComplementBase = (base: string): string => {
    const complements: { [key: string]: string } = {
      'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
      'a': 't', 't': 'a', 'g': 'c', 'c': 'g',
      'U': 'A', 'u': 'a'
    };
    return complements[base] || base;
  };

  const getReverseComplement = () => {
    if (sequenceType === 'protein') {
      toast.error('Reverse complement not applicable to protein sequences');
      return;
    }
    
    const complement = sequence
      .split('')
      .map(getComplementBase)
      .reverse()
      .join('');
    
    setReverseComplement(complement);
  };

  const getGeneticCode = (): { [key: string]: string } => {
    return {
      'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
      'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
      'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
      'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
      'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
      'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
      'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
      'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
      'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
      'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
      'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
      'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
      'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
      'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
      'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
      'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
    };
  };

  const translateSequence = () => {
    if (sequenceType === 'protein') {
      toast.error('Translation not applicable to protein sequences');
      return;
    }
    
    const frame = parseInt(selectedFrame) - 1;
    const startPos = frame;
    const geneticCode = getGeneticCode();
    
    let dnaSeq = sequence.toUpperCase();
    if (sequenceType === 'rna') {
      dnaSeq = dnaSeq.replace(/U/g, 'T');
    }
    
    let protein = '';
    for (let i = startPos; i < dnaSeq.length - 2; i += 3) {
      const codon = dnaSeq.slice(i, i + 3);
      if (codon.length === 3) {
        protein += geneticCode[codon] || 'X';
      }
    }
    
    setTranslation(protein);
  };

  const calculateMolecularWeight = () => {
    const weights = {
      dna: { A: 331, T: 322, G: 347, C: 307 },
      rna: { A: 347, U: 324, G: 363, C: 323 },
      protein: {
        A: 89, R: 174, N: 132, D: 133, C: 121, Q: 146, E: 147,
        G: 75, H: 155, I: 131, L: 131, K: 146, M: 149, F: 165,
        P: 115, S: 105, T: 119, W: 204, Y: 181, V: 117
      }
    };
    
    let totalWeight = 0;
    const weightMap = weights[sequenceType] as { [key: string]: number };
    
    for (const char of sequence.toUpperCase()) {
      totalWeight += weightMap[char] || 0;
    }
    
    return totalWeight;
  };

  const getSequenceComposition = () => {
    const composition: { [key: string]: number } = {};
    const total = sequence.length;
    
    for (const char of sequence.toUpperCase()) {
      composition[char] = (composition[char] || 0) + 1;
    }
    
    const percentages: { [key: string]: string } = {};
    for (const [char, count] of Object.entries(composition)) {
      percentages[char] = ((count / total) * 100).toFixed(1);
    }
    
    return { composition, percentages, total };
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const { composition, percentages } = getSequenceComposition();
  const molecularWeight = calculateMolecularWeight();

  return (
    <div className="space-y-6 w-full">
      {/* Analysis Tools */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Sequence Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 w-full">
          {/* Molecular Weight and Composition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div className="w-full">
              <h4 className="font-medium mb-2">Molecular Weight</h4>
              <div className="text-2xl font-bold">
                {molecularWeight.toLocaleString()} Da
              </div>
            </div>
            
            <div className="w-full">
              <h4 className="font-medium mb-2">Composition</h4>
              <div className="flex flex-wrap gap-2 w-full">
                {Object.entries(percentages).map(([char, percent]) => (
                  <Badge key={char} variant="outline">
                    {char}: {percent}%
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          {sequenceType !== 'protein' && (
            <>
              <Separator />
              
              {/* GC Content */}
              <div className="w-full">
                <h4 className="font-medium mb-2">GC Content</h4>
                <div className="text-xl font-semibold">
                  {(() => {
                    const gcCount = (sequence.match(/[GCgc]/g) || []).length;
                    return ((gcCount / sequence.length) * 100).toFixed(1);
                  })()}%
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Sequence Tools */}
      {sequenceType !== 'protein' && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Sequence Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 w-full">
            {/* Reverse Complement */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2 w-full">
                <h4 className="font-medium">Reverse Complement</h4>
                <Button variant="outline" size="sm" onClick={getReverseComplement}>
                  <RotateCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
              {reverseComplement && (
                <div className="relative w-full">
                  <Textarea
                    value={reverseComplement}
                    readOnly
                    className="font-mono text-sm"
                    rows={3}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(reverseComplement, 'Reverse complement')}
                  >
                    {copiedText === 'Reverse complement' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Translation */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2 w-full">
                <h4 className="font-medium">Translation</h4>
                <div className="flex items-center gap-2 w-full max-w-fit">
                  <Select value={selectedFrame} onValueChange={setSelectedFrame}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Frame +1</SelectItem>
                      <SelectItem value="2">Frame +2</SelectItem>
                      <SelectItem value="3">Frame +3</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={translateSequence}>
                    Translate
                  </Button>
                </div>
              </div>
              {translation && (
                <div className="relative w-full">
                  <Textarea
                    value={translation}
                    readOnly
                    className="font-mono text-sm"
                    rows={3}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(translation, 'Translation')}
                  >
                    {copiedText === 'Translation' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Composition */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Detailed Composition</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {Object.entries(composition).map(([char, count]) => (
              <div key={char} className="text-center p-3 border rounded w-full">
                <div className="text-2xl font-bold">{char}</div>
                <div className="text-sm text-muted-foreground">{count} ({percentages[char]}%)</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};