import React, { Suspense } from 'react';
import { Loader2, Dna } from 'lucide-react';
import { Card, CardContent } from './ui/card';

// Lazy load heavy components
const SeqViewer = React.lazy(() => import('./SeqViewer').then(module => ({
  default: module.SeqViewer
})));

const RestrictionEnzymeAnalysis = React.lazy(() => 
  import('./RestrictionEnzymes').then(module => ({
    default: module.RestrictionEnzymeAnalysis
  }))
);

const DiseaseDetectorComponent = React.lazy(() => 
  import('./DiseaseDetector').then(module => ({
    default: module.DiseaseDetectorComponent
  }))
);

const SequenceUtils = React.lazy(() => import('./SequenceUtils').then(module => ({
  default: module.SequenceUtils
})));

// Loading fallback component
const LoadingFallback = ({ message = 'Loading component...' }: { message?: string }) => (
  <Card className="border-muted">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
        <Dna className="w-12 h-12 text-primary relative z-10 animate-pulse" />
        <Loader2 className="w-5 h-5 text-primary animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20" />
      </div>
      <p className="text-foreground text-center mb-3">{message}</p>
      <div className="w-40 h-1 bg-muted rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full animate-pulse" />
      </div>
    </CardContent>
  </Card>
);

// Lazy wrapper components with specific loading messages
export const LazySeqViewer = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading sequence viewer..." />}>
    <SeqViewer {...props} />
  </Suspense>
);

export const LazyRestrictionEnzymeAnalysis = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading enzyme analysis..." />}>
    <RestrictionEnzymeAnalysis {...props} />
  </Suspense>
);

export const LazyDiseaseDetectorComponent = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading disease detector..." />}>
    <DiseaseDetectorComponent {...props} />
  </Suspense>
);

export const LazySequenceUtils = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading analysis tools..." />}>
    <SequenceUtils {...props} />
  </Suspense>
);