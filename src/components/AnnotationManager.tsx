import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Plus, Edit, Trash2, Tag, Save, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { Annotation } from './SeqViewer';

export interface AnnotationManagerProps {
  annotations: Annotation[];
  sequenceLength: number;
  onAnnotationsChange: (annotations: Annotation[]) => void;
}

export const AnnotationManager: React.FC<AnnotationManagerProps> = ({
  annotations,
  sequenceLength,
  onAnnotationsChange,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start: 1,
    end: 10,
    type: 'gene' as const,
    color: '#3B82F6',
    direction: 'forward' as const,
    description: '',
  });

  const annotationTypes = [
    { value: 'gene', label: 'Gene', color: '#3B82F6' },
    { value: 'promoter', label: 'Promoter', color: '#10B981' },
    { value: 'terminator', label: 'Terminator', color: '#EF4444' },
    { value: 'origin', label: 'Origin', color: '#8B5CF6' },
    { value: 'custom', label: 'Custom', color: '#6B7280' },
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      start: 1,
      end: 10,
      type: 'gene',
      color: '#3B82F6',
      direction: 'forward',
      description: '',
    });
    setEditingAnnotation(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (annotation: Annotation) => {
    setFormData({
      name: annotation.name,
      start: annotation.start,
      end: annotation.end,
      type: annotation.type,
      color: annotation.color,
      direction: annotation.direction || 'forward',
      description: '',
    });
    setEditingAnnotation(annotation);
    setIsDialogOpen(true);
  };

  const validateAnnotation = () => {
    if (!formData.name.trim()) {
      toast.error('Annotation name is required');
      return false;
    }

    if (formData.start < 1 || formData.start > sequenceLength) {
      toast.error(`Start position must be between 1 and ${sequenceLength}`);
      return false;
    }

    if (formData.end < 1 || formData.end > sequenceLength) {
      toast.error(`End position must be between 1 and ${sequenceLength}`);
      return false;
    }

    if (formData.start > formData.end) {
      toast.error('Start position must be less than or equal to end position');
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateAnnotation()) return;

    const newAnnotation: Annotation = {
      id: editingAnnotation?.id || `annotation-${Date.now()}`,
      name: formData.name.trim(),
      start: formData.start,
      end: formData.end,
      type: formData.type,
      color: formData.color,
      direction: formData.direction,
    };

    let updatedAnnotations;
    if (editingAnnotation) {
      updatedAnnotations = annotations.map(ann =>
        ann.id === editingAnnotation.id ? newAnnotation : ann
      );
      toast.success('Annotation updated successfully');
    } else {
      updatedAnnotations = [...annotations, newAnnotation];
      toast.success('Annotation added successfully');
    }

    onAnnotationsChange(updatedAnnotations);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (annotationId: string) => {
    const updatedAnnotations = annotations.filter(ann => ann.id !== annotationId);
    onAnnotationsChange(updatedAnnotations);
    toast.success('Annotation deleted successfully');
  };

  const handleTypeChange = (type: string) => {
    const typeInfo = annotationTypes.find(t => t.value === type);
    setFormData(prev => ({
      ...prev,
      type: type as any,
      color: typeInfo?.color || prev.color,
    }));
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Annotations
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Add Annotation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-black border-gray-800">
              <DialogHeader className="bg-black border-b border-gray-800">
                <DialogTitle className="text-white">
                  {editingAnnotation ? 'Edit Annotation' : 'Add New Annotation'}
                </DialogTitle>
                <DialogDescription className="text-gray-300">
                  {editingAnnotation 
                    ? 'Modify the properties of the selected annotation.' 
                    : 'Create a new annotation to mark features in your sequence.'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 text-white">
                <div className="space-y-2">
                  <Label htmlFor="ann-name" className="text-white">Name</Label>
                  <Input
                    id="ann-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Annotation name"
                    className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ann-start" className="text-white">Start Position</Label>
                    <Input
                      id="ann-start"
                      type="number"
                      min="1"
                      max={sequenceLength}
                      value={formData.start}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        start: parseInt(e.target.value) || 1 
                      }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ann-end" className="text-white">End Position</Label>
                    <Input
                      id="ann-end"
                      type="number"
                      min="1"
                      max={sequenceLength}
                      value={formData.end}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        end: parseInt(e.target.value) || 1 
                      }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ann-type" className="text-white">Type</Label>
                  <Select value={formData.type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      {annotationTypes.map(type => (
                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700 focus:bg-gray-700">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: type.color }}
                            />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ann-direction" className="text-white">Direction</Label>
                  <Select value={formData.direction} onValueChange={(value: any) => 
                    setFormData(prev => ({ ...prev, direction: value }))
                  }>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600 text-white">
                      <SelectItem value="forward" className="text-white hover:bg-gray-700 focus:bg-gray-700">Forward</SelectItem>
                      <SelectItem value="reverse" className="text-white hover:bg-gray-700 focus:bg-gray-700">Reverse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ann-color" className="text-white">Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="ann-color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-10 h-10 rounded border border-gray-600 bg-gray-800"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3B82F6"
                      className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleClose} className="border-gray-600 text-white hover:bg-gray-800">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} className="bg-white text-black hover:bg-gray-200">
                    <Save className="w-4 h-4 mr-2" />
                    {editingAnnotation ? 'Update' : 'Add'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {annotations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No annotations added yet</p>
            <p className="text-sm">Click "Add Annotation" to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: annotation.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{annotation.name}</span>
                      <Badge variant="outline">{annotation.type}</Badge>
                      {annotation.direction && (
                        <Badge variant="secondary" className="text-xs">
                          {annotation.direction}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Position: {annotation.start} - {annotation.end} 
                      ({annotation.end - annotation.start + 1} bp)
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(annotation)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(annotation.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};