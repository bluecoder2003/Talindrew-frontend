import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Upload, FileText, Dna, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export interface SeqEditorProps {
  onSequenceSubmit: (data: {
    sequence: string;
    name: string;
    type: 'dna' | 'rna' | 'protein';
    description?: string;
  }) => void;
}

export const SeqEditor: React.FC<SeqEditorProps> = ({ onSequenceSubmit }) => {
  const [sequence, setSequence] = useState('');
  const [name, setName] = useState('');
  const [sequenceType, setSequenceType] = useState<'dna' | 'rna' | 'protein'>('dna');
  const [description, setDescription] = useState('');
  const [inputMode, setInputMode] = useState<'manual' | 'file' | 'examples'>('manual');

  const validateSequence = (seq: string, type: 'dna' | 'rna' | 'protein'): boolean => {
    const cleanSeq = seq.replace(/\s/g, '').toUpperCase();
    
    const patterns = {
      dna: /^[ATGCNRYSWKMBDHV]+$/,
      rna: /^[AUGCNRYSWKMBDHV]+$/,
      protein: /^[ACDEFGHIKLMNPQRSTVWY*]+$/
    };
    
    return patterns[type].test(cleanSeq);
  };

  const formatSequence = (seq: string): string => {
    return seq.replace(/\s/g, '').toUpperCase();
  };

  const handleSequenceChange = (value: string) => {
    setSequence(value);
  };

  const handleSubmit = () => {
    const cleanSequence = formatSequence(sequence);
    
    if (!cleanSequence) {
      toast.error('Please enter a sequence');
      return;
    }
    
    if (!name.trim()) {
      toast.error('Please enter a sequence name');
      return;
    }
    
    if (!validateSequence(cleanSequence, sequenceType)) {
      toast.error(`Invalid ${sequenceType.toUpperCase()} sequence`);
      return;
    }
    
    onSequenceSubmit({
      sequence: cleanSequence,
      name: name.trim(),
      type: sequenceType,
      description: description.trim()
    });
    
    toast.success('Sequence loaded successfully');
  };

  const handleReset = () => {
    setSequence('');
    setName('');
    setDescription('');
    setSequenceType('dna');
  };

  const loadExample = (type: 'dna' | 'rna' | 'protein') => {
    const examples = {
      dna: {
        name: 'Lambda DNA fragment',
        sequence: 'AGCTTGGCACTGGCCGTCGTTTTACAACGTCGTGACTGGGAAAACCCTGGCGTTACCCAACTTAATCGCCTTGCAGCACATCCCCCTTTCGCCAGCTGGCGTAATAGCGAAGAGGCCCGCACCGATCGCCCTTCCCAACAGTTGCGCAGCCTGAATGGCGAATGGCGCCTGATGCGGTATTTTCTCCTTACGCATCTGTGCGGTATTTCACACCGCATATGGTGCACTCTCAGTACAATCTGCTCTGATGCCGCATAGTTAAGCCAGCCCCGACACCCGCCAACACCCGCTGACGCGCCCTGACGGGCTTGTCTGCTCCCGGCATCCGCTTACAGACAAGCTGTGACCGTCTCCGGGAGCTGCATGTGTCAGAGGTTTTCACCGTCATCACCGAAACGCGCGA',
        description: 'A fragment from bacteriophage lambda DNA'
      },
      rna: {
        name: 'tRNA sequence',
        sequence: 'GCGGAUUUAGCUCAGUUGGGAGAGCGCCAGACUGAAGAUCUGGAGGUCCUGUGUUCGAUCCACAGAAUUCGCA',
        description: 'Transfer RNA sequence'
      },
      protein: {
        name: 'Insulin A chain',
        sequence: 'GIVEQCCTSICSLYQLENYCN',
        description: 'Human insulin A chain sequence'
      }
    };
    
    const example = examples[type];
    setSequenceType(type);
    setSequence(example.sequence);
    setName(example.name);
    setDescription(example.description);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      let sequence = '';
      let name = file.name.replace(/\.(fa|fasta|txt|seq)$/, '');
      
      // Simple FASTA parser
      if (content.startsWith('>')) {
        const lines = content.split('\n');
        name = lines[0].slice(1).trim() || name;
        sequence = lines.slice(1).join('').replace(/\s/g, '');
      } else {
        sequence = content.replace(/\s/g, '');
      }
      
      setSequence(sequence);
      setName(name);
    };
    reader.readAsText(file);
  };

  const getSequenceStats = () => {
    const cleanSeq = formatSequence(sequence);
    if (!cleanSeq) return null;
    
    const length = cleanSeq.length;
    const stats: any = { length };
    
    if (sequenceType !== 'protein') {
      const counts = {
        A: (cleanSeq.match(/A/g) || []).length,
        T: (cleanSeq.match(/T/g) || []).length,
        U: (cleanSeq.match(/U/g) || []).length,
        G: (cleanSeq.match(/G/g) || []).length,
        C: (cleanSeq.match(/C/g) || []).length,
      };
      
      const gcContent = ((counts.G + counts.C) / length * 100).toFixed(1);
      stats.gcContent = gcContent;
      stats.composition = counts;
    } else {
      // Protein stats
      const hydrophobic = (cleanSeq.match(/[AILVFWMPGCY]/g) || []).length;
      const polar = (cleanSeq.match(/[STNQ]/g) || []).length;
      const charged = (cleanSeq.match(/[RHKDE]/g) || []).length;
      
      stats.hydrophobic = ((hydrophobic / length) * 100).toFixed(1);
      stats.polar = ((polar / length) * 100).toFixed(1);
      stats.charged = ((charged / length) * 100).toFixed(1);
    }
    
    return stats;
  };

  const stats = getSequenceStats();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dna className="w-5 h-5" />
          Sequence Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={inputMode} onValueChange={(value: any) => setInputMode(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">Manual Input</TabsTrigger>
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-[16px] mx-[0px]">
              <div className="space-y-2">
                <Label htmlFor="name">Sequence Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter sequence name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Sequence Type</Label>
                <Select value={sequenceType} onValueChange={(value: any) => setSequenceType(value)}>
                  <SelectTrigger className="dark:bg-background dark:border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-background dark:border-border dark:text-foreground">
                    <SelectItem value="dna" className="dark:text-foreground dark:hover:bg-accent dark:focus:bg-accent">DNA</SelectItem>
                    <SelectItem value="rna" className="dark:text-foreground dark:hover:bg-accent dark:focus:bg-accent">RNA</SelectItem>
                    <SelectItem value="protein" className="dark:text-foreground dark:hover:bg-accent dark:focus:bg-accent">Protein</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sequence">Sequence</Label>
              <Textarea
                id="sequence"
                value={sequence}
                onChange={(e) => handleSequenceChange(e.target.value)}
                placeholder={`Enter ${sequenceType.toUpperCase()} sequence...`}
                className="font-mono text-sm min-h-32"
                style={{ fontSize: '14px' }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter sequence description..."
                className="min-h-20"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <div className="space-y-2">
                <h3 className="font-medium">Upload Sequence File</h3>
                <p className="text-sm text-muted-foreground">
                  Supports FASTA, TXT, and SEQ formats
                </p>
                <input
                  type="file"
                  accept=".fa,.fasta,.txt,.seq"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileText className="w-4 h-4 mr-2" />
                    Choose File
                  </label>
                </Button>
              </div>
            </div>
            
            {sequence && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="file-name">Sequence Name</Label>
                  <Input
                    id="file-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="file-type">Sequence Type</Label>
                  <Select value={sequenceType} onValueChange={(value: any) => setSequenceType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dna">DNA</SelectItem>
                      <SelectItem value="rna">RNA</SelectItem>
                      <SelectItem value="protein">Protein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="examples" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => loadExample('dna')}>
                <CardContent className="p-4 text-center">
                  <Badge className="mb-2">DNA</Badge>
                  <h4 className="font-medium">Lambda DNA</h4>
                  <p className="text-sm text-muted-foreground">Bacteriophage sequence</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => loadExample('rna')}>
                <CardContent className="p-4 text-center">
                  <Badge className="mb-2">RNA</Badge>
                  <h4 className="font-medium">tRNA</h4>
                  <p className="text-sm text-muted-foreground">Transfer RNA sequence</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => loadExample('protein')}>
                <CardContent className="p-4 text-center">
                  <Badge className="mb-2">Protein</Badge>
                  <h4 className="font-medium">Insulin A</h4>
                  <p className="text-sm text-muted-foreground">Human insulin chain</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Sequence Statistics */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sequence Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium">Length</div>
                  <div className="text-2xl font-bold">{stats.length}</div>
                </div>
                
                {sequenceType !== 'protein' && stats.gcContent && (
                  <div>
                    <div className="text-sm font-medium">GC Content</div>
                    <div className="text-2xl font-bold">{stats.gcContent}%</div>
                  </div>
                )}
                
                {sequenceType === 'protein' && (
                  <>
                    <div>
                      <div className="text-sm font-medium">Hydrophobic</div>
                      <div className="text-2xl font-bold">{stats.hydrophobic}%</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Polar</div>
                      <div className="text-2xl font-bold">{stats.polar}%</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Charged</div>
                      <div className="text-2xl font-bold">{stats.charged}%</div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          
          <Button onClick={handleSubmit} disabled={!sequence || !name}>
            <Save className="w-4 h-4 mr-2" />
            Load Sequence
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};