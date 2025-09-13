import React, { useState, useEffect, useMemo, useCallback, startTransition, useRef } from "react";
import {
  projectId,
  publicAnonKey,
} from "./utils/supabase/info";

import {
  useEnzymeDetection,
  useDiseaseDetection,
} from "./utils/talindrew-hooks";
import {
  SeqViewer,
  type Annotation,
} from "./components/SeqViewer";
import { SeqEditor } from "./components/SeqEditor";
import {
  DiseaseDetector,
  type DetectedMutation,
} from "./components/DiseaseDetector";

// Interface for API-detected mutations (different from local DetectedMutation)
interface ApiDetectedMutation {
  id: string;
  position: number;
  originalBase: string;
  mutatedBase: string;
  marker: {
    name: string;
    sequence: string;
    type: 'disease';
    position: number;
    description: string;
    clinvarId?: string;
  };
  confidence: 'high' | 'medium' | 'low';
}
import {
  RestrictionEnzymeAnalyzer,
} from "./components/RestrictionEnzymes";
import { DiseaseSearchOptimized } from "./components/DiseaseSearchOptimized";
import {
  LazySeqViewer,
  LazyRestrictionEnzymeAnalysis,
  LazyDiseaseDetectorComponent,
  LazySequenceUtils,
} from "./components/LazyViewer";
import { GeneAnalysisComponent } from "./components/GeneAnalysisComponent";
// Import Figma components
import { imgVectorStroke, imgSvg, imgSvg1, imgSvg2, imgSvg3, imgSvg4, imgSvg5, imgSvg6, imgLine1, imgSvg7, imgVector, imgVector1, imgVector2, imgVector3, imgVector4, imgVector5, imgSvg8, imgVector6, imgVector7, imgSvg9, imgLine2, imgVector8, imgVector9, imgVector10, imgVector11, imgVector12 } from "./imports/svg-pmxj6";
import BackgroundBorder from "./imports/BackgroundBorder";
import Frame50 from "./imports/Frame50";
import ReactIconsBiBiLoaderCircle from "./imports/ReactIconsBiBiLoaderCircle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Alert, AlertDescription } from "./components/ui/alert";
import { Progress } from "./components/ui/progress";
import {
  Dna,
  Edit,
  Eye,
  Download,
  Upload,
  Calculator,
  AlertTriangle,
  ShieldCheck,
  Scissors,
  Info,
  Search,
  Menu,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./components/ui/tooltip";
import { Toaster } from "./components/ui/sonner";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";

interface SequenceData {
  sequence: string;
  name: string;
  type: "dna" | "rna" | "protein";
  description?: string;
}

export default function App() {
  const [currentSequence, setCurrentSequence] =
    useState<SequenceData | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(
    [],
  );
  const [diseaseAnnotations, setDiseaseAnnotations] = useState<
    Annotation[]
  >([]);
  const [restrictionAnnotations, setRestrictionAnnotations] =
    useState<Annotation[]>([]);
  const [detectedMutations, setDetectedMutations] = useState<
    ApiDetectedMutation[]
  >([]);
  const [viewMode, setViewMode] = useState<
    "linear" | "circular"
  >("linear");
  const [activeTab, setActiveTab] = useState("editor");
  const [isAnalyzingDiseases, setIsAnalyzingDiseases] =
    useState(false);
  const [isAnalyzingRestriction, setIsAnalyzingRestriction] =
    useState(false);
  const [diseaseSequences, setDiseaseSequences] = useState<
    Record<string, SequenceData>
  >({});
  const [isLoadingSequences, setIsLoadingSequences] =
    useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isViewModeChanging, setIsViewModeChanging] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Performance refs
  const viewModeTimeoutRef = useRef<NodeJS.Timeout>();
  const sequenceProcessingRef = useRef<boolean>(false);
  
  // API progress states
  const [diseaseProgress, setDiseaseProgress] = useState<{ progress: number; message: string }>({ progress: 0, message: '' });
  const [restrictionProgress, setRestrictionProgress] = useState<{ progress: number; message: string }>({ progress: 0, message: '' });
  
  // API task cancellation
  const diseaseTaskRef = useRef<AbortController | null>(null);
  const restrictionTaskRef = useRef<AbortController | null>(null);
  
  // Sequence tracking for analysis prevention
  const lastAnalyzedSequenceRef = useRef<string | null>(null);

  // API hooks for enzyme and disease detection
  const enzymeDetection = useEnzymeDetection();
  const diseaseDetection = useDiseaseDetection();

  // Helper functions for API result conversion - memoized to prevent re-renders
  const extractDiseaseName = useCallback((description: string): string => {
    // Extract disease name from description
    if (description.toLowerCase().includes('cystic fibrosis')) return 'Cystic Fibrosis';
    if (description.toLowerCase().includes('sickle')) return 'Sickle Cell Anemia';
    if (description.toLowerCase().includes('huntington')) return "Huntington's Disease";
    if (description.toLowerCase().includes('tay-sachs')) return 'Tay-Sachs Disease';
    if (description.toLowerCase().includes('gaucher')) return 'Gaucher Disease';
    return 'Genetic Variant';
  }, []);

  const getColorForDisease = useCallback((diseaseName: string): string => {
    switch (diseaseName) {
      case 'Sickle Cell Anemia': return '#DC2626';
      case 'Cystic Fibrosis': return '#EA580C';
      case "Huntington's Disease": return '#7C3AED';
      case 'Tay-Sachs Disease': return '#DB2777';
      case 'Gaucher Disease': return '#059669';
      default: return '#EF4444';
    }
  }, []);

  const getColorForEnzyme = useCallback((enzymeName: string): string => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    // Use consistent color for each enzyme based on name hash
    let hash = 0;
    for (let i = 0; i < enzymeName.length; i++) {
      hash = ((hash << 5) - hash + enzymeName.charCodeAt(i)) & 0xffffffff;
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Initialize disease sequences on component mount
  useEffect(() => {
    initializeDiseaseSequences();
  }, []);

  // Initialize API-based analysis system
  useEffect(() => {
    console.log('🚀 Initializing Talindrew Gene API analysis system...');
    console.log('📋 Using cloud-based analysis for enhanced accuracy and performance');
    console.log('⚡ API endpoints: detect-enzymes, detect-diseases, analyze');
    console.log('🌐 Base URL: https://talindrew.glowzaar.com/api/v1');
    
    // Cleanup function for API requests
    return () => {
      if (diseaseTaskRef.current) {
        diseaseTaskRef.current.abort();
        diseaseTaskRef.current = null;
      }
      if (restrictionTaskRef.current) {
        restrictionTaskRef.current.abort();
        restrictionTaskRef.current = null;
      }
    };
  }, []);

  const initializeDiseaseSequences = async () => {
    try {
      setIsLoadingSequences(true);

      // First, try to get existing sequences
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/disease-sequences`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const sequences = await response.json();

        // Check if we have any sequences
        if (Object.keys(sequences).length === 0) {
          console.log(
            "No disease sequences found, initializing...",
          );
          await initializeSequencesInDB();
          // Retry fetching after initialization
          const retryResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/disease-sequences`,
            {
              headers: {
                Authorization: `Bearer ${publicAnonKey}`,
                "Content-Type": "application/json",
              },
            },
          );
          if (retryResponse.ok) {
            const retrySequences = await retryResponse.json();
            setDiseaseSequences(retrySequences);
          }
        } else {
          setDiseaseSequences(sequences);
        }
      } else {
        console.log(
          "Disease sequences not found, initializing...",
        );
        await initializeSequencesInDB();
        // Retry fetching after initialization
        const retryResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/disease-sequences`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (retryResponse.ok) {
          const retrySequences = await retryResponse.json();
          setDiseaseSequences(retrySequences);
        }
      }
    } catch (error) {
      console.error("Error fetching disease sequences:", error);
      // Fallback to hardcoded sequences if database fails
      setDiseaseSequences(getHardcodedDiseaseSequences());
    } finally {
      setIsLoadingSequences(false);
    }
  };

  const initializeSequencesInDB = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c2fb82a9/init-disease-sequences`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          "Failed to initialize disease sequences",
        );
      }

      console.log("Disease sequences initialized successfully");
    } catch (error) {
      console.error(
        "Error initializing disease sequences:",
        error,
      );
      throw error;
    }
  };

  const getHardcodedDiseaseSequences = () => {
    return {
      sicklecell: {
        sequence:
          "ATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGGTGGTGAGGCCCTGGGCAGGCTGCTGGTGGTCTACCCTTGGACCCAGAGGTTCTTTGAGTCCTTTGGGGATCTGTCCACTCCTGATGCTGTTATGGGCAACCCTAAGGTGAAGGCTCATGGCAAGAAAGTGCTCGGTGCCTTTAGTGATGGCCTGGCTCACCTGGACAACCTCAAGGGCACCTTTGCCACACTGAGTGAGCTGCACTGTGACAAGCTGCACGTGGATCCTGAGAACTTCAGGCTCCTGGGCAACGTGCTGGTCTGTGTGCTGGCCCATCACTTTGGCAAAGAATTCACCCCACCAGTGCAGGCTGCCTATCAGAAAGTGGTGGCTGGTGTGGCTAATGCCCTGGCCCACAAGTATCACTAAGCTCGCTTTCTTGCTGTCCAATTTCTATTAAAGGTTCCTTTGTTCCCTAAGTCCAACTACTAAACTGGGGGATATTATGAAGGGCCTTGAGCATCTGGATTCTGCCTAATAAAAAACATTTATTTTCATTGC",
        name: "HBB Gene with Sickle Cell Mutation",
        type: "dna" as const,
        description:
          "β-globin gene containing the GAG→GTG substitution causing sickle cell anemia",
      },
      cysticfibrosis: {
        sequence:
          "ATGCAGAGGTCGCCTCTGGAAAAGGCCAGCGTTGCTGAAATCATTTGGTGTTTCCTATGATATAGATAACAGAAGCGTCATCAAAGCATGCCAACTAGAAGAGAATATCGATGAAGGGACCAATATTAAAGAAAATCCAATTCTGACCCACAGACATGATAAGATACATTGATAGGTTTTGGCAGATTCCCCGATTTAGACAGCAGGTGCCGAGCACCATTTCCGGGTTTAGCTATCACAGCAGCCTTCTCGGATTTAGACCCAGCAGTTAGCATTCCTTTAGGTGTATTAGTCGATATGCTTCCGCAGACCTTTGGATTACCAGGCCTAGCAGCGATAAATCCGAGAGTTAGAATCGTGAAGATGGTGCTTTTTAATATCGATTATCCTATCGTTACAAGGTACCACATTGGGGGTAGTCCGTCTGTTCAGAGGATCCCCTTGACAAGATGATGGCGACAGATTTGGAGAAGTTTATAACTAGAAGTAGAAGTATCGGAAGTCACAGTAAGGGTGGCTTAAATATTCGAAAGAGTAAACATACCCCGAAGCCCTAGTAGCTACGTATAGGACCACCATTTCCATTTTAACCATGGCAGCCAATAATGATCTTGTACAAGCTGTATTCAGCAAATGTAGGC",
        name: "CFTR Gene with ΔF508 Mutation",
        type: "dna" as const,
        description:
          "CFTR gene with the ΔF508 deletion causing cystic fibrosis",
      },
      huntington: {
        sequence:
          "ATGGCGACCCTGGAAAAGCTGATGAAGGCCTTCGAGTCCCTCAAGTCCTTCCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAACAGCCGCCACCGCCGCCGCCGCCGCCGCCGCCTCCTCAGCTTCCTCAGCCGCCGCCGCAGGCACAGCCGCTGCTGCCTGGGAGCTGCAGAGATACCTACGGAAGGCTGGAGGAGCCTGATAGAGCGGGTGGAGGAAGAAGCGGAGGCGGATGAGGATGAAGAGGAGGATGAGGATGAGGATGAGGATGAGGAAGAAGAGGAAGATGAGGATGAG",
        name: "HTT Gene with CAG Expansion",
        type: "dna" as const,
        description:
          "Huntingtin gene with expanded CAG repeats (>36) causing Huntington's disease",
      },
    };
  };

  const handleSequenceFromNCBI = useCallback((
    sequence: string,
    name: string,
    description: string,
  ) => {
    const sequenceData: SequenceData = {
      sequence: sequence.toUpperCase(),
      name: `${name} (NCBI)`,
      type: "dna",
      description,
    };
    handleSequenceSubmit(sequenceData);
  }, []);

  const handleSequenceSubmit = useCallback((data: SequenceData) => {
    // Enhanced sequence size classification
    const sequenceLength = data.sequence.length;
    const isLargeSequence = sequenceLength > 50000;
    const isVeryLargeSequence = sequenceLength > 1000000; // 1M+ bp
    const isMegaSequence = sequenceLength > 5000000; // 5M+ bp
    
    sequenceProcessingRef.current = isLargeSequence;
    
    setIsOptimizing(true);
    
    // Log memory estimation for large sequences
    if (isLargeSequence) {
      const memoryEstimateMB = (sequenceLength * 2) / (1024 * 1024); // Rough estimate: 2 bytes per base pair
      console.log(`Loading sequence: ${(sequenceLength / 1000000).toFixed(2)}MB, estimated memory: ${memoryEstimateMB.toFixed(1)}MB`);
      if (sequenceLength > 5000000) {
        console.log(`Recommendation: Consider analyzing in smaller chunks for better performance`);
      }
    }
    
    // Adaptive processing based on sequence size
    if (isMegaSequence) {
      // 5M+ bp: Maximum caution with progressive loading
      console.warn(`Mega sequence detected: ${(sequenceLength / 1000000).toFixed(2)}MB - Using maximum optimization`);
      setCurrentSequence(null);
      
      // Extended delay for mega sequences
      setTimeout(() => {
        startTransition(() => {
          setCurrentSequence(data);
          sequenceProcessingRef.current = false;
          
          // Minimal state for mega sequences
          setAnnotations([]);
          setDiseaseAnnotations([]);
          setDetectedMutations([]);
          setRestrictionAnnotations([]);
          
          setActiveTab("viewer");
          setIsOptimizing(false);
        });
      }, 500); // Longer delay for UI preparation
    } else if (isVeryLargeSequence) {
      // 1M+ bp: Enhanced optimization
      console.log(`Very large sequence: ${(sequenceLength / 1000000).toFixed(2)}MB - Using enhanced optimization`);
      setCurrentSequence(null);
      
      setTimeout(() => {
        startTransition(() => {
          setCurrentSequence(data);
          sequenceProcessingRef.current = false;
          
          // Minimal initial state for very large sequences
          setAnnotations([]);
          setDiseaseAnnotations([]);
          setDetectedMutations([]);
          setRestrictionAnnotations([]);
          
          setActiveTab("viewer");
          setIsOptimizing(false);
        });
      }, 200);
    } else if (isLargeSequence) {
      // 50K+ bp: Standard large sequence handling
      setCurrentSequence(null);
      
      setTimeout(() => {
        startTransition(() => {
          setCurrentSequence(data);
          sequenceProcessingRef.current = false;
          
          // Minimal initial state for large sequences
          setAnnotations([]);
          setDiseaseAnnotations([]);
          setDetectedMutations([]);
          setRestrictionAnnotations([]);
          
          setActiveTab("viewer");
          setIsOptimizing(false);
        });
      }, 100);
    } else {
      // Use startTransition for non-urgent updates on smaller sequences
      startTransition(() => {
        setCurrentSequence(data);

        // Add sample annotations for the default sequence to demonstrate the circular view
        if (data.name === "pUC19 Plasmid") {
          const sampleAnnotations: Annotation[] = [
            {
              id: "ori",
              start: 1760,
              end: 2348,
              name: "ori",
              type: "origin",
              color: "#8B5CF6",
              direction: "forward",
            },
            {
              id: "ampr",
              start: 610,
              end: 1470,
              name: "ampR",
              type: "gene",
              color: "#EF4444",
              direction: "reverse",
            },
            {
              id: "lacz",
              start: 30,
              end: 395,
              name: "lacZ α",
              type: "gene",
              color: "#3B82F6",
              direction: "forward",
            },
            {
              id: "promoter1",
              start: 395,
              end: 425,
              name: "lac promoter",
              type: "promoter",
              color: "#10B981",
              direction: "forward",
            },
          ];
          setAnnotations(sampleAnnotations);
        } else {
          setAnnotations([]); // Reset annotations for other sequences
        }

        // Reset disease detection and restriction enzyme data
        setDiseaseAnnotations([]);
        setDetectedMutations([]);
        setRestrictionAnnotations([]);

        setActiveTab("viewer");
        setIsOptimizing(false);
        sequenceProcessingRef.current = false;
      });
    }
  }, []);

  // API-based disease analysis for enhanced accuracy
  useEffect(() => {
    if (currentSequence && currentSequence.type === "dna") {
      // Prevent duplicate analysis for the same sequence
      const sequenceKey = `${currentSequence.name}_${currentSequence.sequence.slice(0, 100)}`;
      if (lastAnalyzedSequenceRef.current === sequenceKey) {
        console.log('Skipping analysis - same sequence already being processed');
        return;
      }
      lastAnalyzedSequenceRef.current = sequenceKey;

      const sequenceLength = currentSequence.sequence.length;
      const isLargeSequence = sequenceLength > 100000;      // 100kb+
      const isVeryLargeSequence = sequenceLength > 1000000; // 1M+ bp
      const isMegaSequence = sequenceLength > 5000000;      // 5M+ bp
      
      setIsAnalyzingDiseases(true);
      setDiseaseProgress({ progress: 0, message: 'Initializing disease detection via API...' });

      // Enhanced thresholds for very large sequences
      if (isMegaSequence) {
        console.log(`Limiting disease analysis for mega sequence (${(sequenceLength / 1000000).toFixed(2)}MB) - analyzing first 1MB`);
      }

      // Cancel any pending disease analysis
      if (diseaseTaskRef.current) {
        console.log('Cancelling previous disease analysis...');
        diseaseTaskRef.current.abort();
      }

      // Clear previous results to prevent stale data from triggering handlers
      diseaseDetection.clear();

      const runDiseaseAnalysis = async () => {
        // Create new abort controller for this request
        const abortController = new AbortController();
        diseaseTaskRef.current = abortController;

        try {
          // Wait a bit if sequence is still processing
          if (sequenceProcessingRef.current) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Determine analysis sequence based on size
          let analysisSequence = currentSequence.sequence;
          if (isMegaSequence) {
            console.log(`Disease analysis for mega sequence (${(sequenceLength / 1000000).toFixed(2)}MB) - analyzing first 1MB`);
            analysisSequence = currentSequence.sequence.slice(0, 1000000);
          } else if (isVeryLargeSequence) {
            console.log(`Disease analysis for very large sequence (${(sequenceLength / 1000000).toFixed(2)}MB) - analyzing first 500kb`);
            analysisSequence = currentSequence.sequence.slice(0, 500000);
          } else if (isLargeSequence) {
            console.log(`Disease analysis for large sequence (${(sequenceLength / 1000).toFixed(0)}kb)`);
          }

          setDiseaseProgress({ progress: 20, message: 'Sending sequence to Talindrew API...' });
          
          // Use the disease detection hook to analyze the sequence
          await diseaseDetection.detect(currentSequence.name, analysisSequence);

          // Check if request was aborted
          if (abortController.signal.aborted) {
            return;
          }

          setDiseaseProgress({ progress: 80, message: 'Processing API response...' });

        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Disease analysis was cancelled');
            return;
          }
          
          console.error('Disease detection error:', error);
          setDetectedMutations([]);
          setDiseaseAnnotations([]);
          setDiseaseProgress({ progress: 0, message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
          setIsAnalyzingDiseases(false);
          diseaseTaskRef.current = null;
        }
      };

      // Delay analysis based on sequence size - API can handle larger sequences better
      const delay = isMegaSequence ? 1000 : (isVeryLargeSequence ? 800 : (isLargeSequence ? 500 : 300));
      const timer = setTimeout(runDiseaseAnalysis, delay);

      return () => {
        clearTimeout(timer);
        if (diseaseTaskRef.current) {
          diseaseTaskRef.current.abort();
          diseaseTaskRef.current = null;
        }
      };
    } else {
      setDetectedMutations([]);
      setDiseaseAnnotations([]);
      setIsAnalyzingDiseases(false);
      setDiseaseProgress({ progress: 0, message: '' });
      lastAnalyzedSequenceRef.current = null; // Reset sequence tracking
    }
  }, [currentSequence]); // REMOVED diseaseDetection.data and diseaseDetection.error from dependencies

  // Handle disease detection results
  useEffect(() => {
    if (diseaseDetection.data && diseaseTaskRef.current && !diseaseDetection.loading) {
      const apiResult = diseaseDetection.data;
      
      // Convert API results to internal format
      const mutations: ApiDetectedMutation[] = apiResult.disease_associations.map((assoc, index) => ({
        id: `mutation_${index}`,
        position: assoc.position,
        originalBase: assoc.reference_base,
        mutatedBase: assoc.alternative_base,
        marker: {
          name: extractDiseaseName(assoc.description),
          sequence: assoc.reference_base,
          type: 'disease' as const,
          position: assoc.position,
          description: assoc.description,
          clinvarId: assoc.clinvar_id
        },
        confidence: 'high' as const
      }));

      // Create annotations from mutations
      const diseaseAnns: Annotation[] = mutations.map(mutation => ({
        id: `disease_${mutation.id}`,
        start: mutation.position,
        end: mutation.position + (mutation.originalBase?.length || 1),
        name: mutation.marker.name,
        type: 'disease',
        color: getColorForDisease(mutation.marker.name),
        direction: 'forward' as const,
        description: mutation.marker.description
      }));

      setDetectedMutations(mutations);
      setDiseaseAnnotations(diseaseAnns);
      setDiseaseProgress({ progress: 100, message: `Found ${mutations.length} disease associations` });
      setIsAnalyzingDiseases(false);
      diseaseTaskRef.current = null;
      
      // Clear progress after a delay
      setTimeout(() => {
        setDiseaseProgress({ progress: 0, message: '' });
      }, 3000);
    }
  }, [diseaseDetection.data, extractDiseaseName, getColorForDisease]);

  // Handle disease detection errors
  useEffect(() => {
    if (diseaseDetection.error && diseaseTaskRef.current && !diseaseDetection.loading) {
      console.error('Disease API error:', diseaseDetection.error);
      setDetectedMutations([]);
      setDiseaseAnnotations([]);
      
      // Show user-friendly message for service unavailability
      if (diseaseDetection.error.includes('503') || diseaseDetection.error.includes('unavailable')) {
        setDiseaseProgress({ progress: 0, message: 'Disease detection service temporarily unavailable - please try again later' });
      } else {
        setDiseaseProgress({ progress: 0, message: `Analysis failed: ${diseaseDetection.error}` });
      }
      
      setIsAnalyzingDiseases(false);
      diseaseTaskRef.current = null;
    }
  }, [diseaseDetection.error]);

  // API-based restriction enzyme analysis for enhanced accuracy
  useEffect(() => {
    if (currentSequence && currentSequence.type === "dna") {
      const sequenceLength = currentSequence.sequence.length;
      const isLargeSequence = sequenceLength > 100000;      // 100kb+
      const isVeryLargeSequence = sequenceLength > 1000000; // 1M+ bp
      const isMegaSequence = sequenceLength > 5000000;      // 5M+ bp
      
      setIsAnalyzingRestriction(true);
      setRestrictionProgress({ progress: 0, message: 'Initializing restriction enzyme analysis via API...' });

      // Enhanced thresholds for very large sequences
      if (isMegaSequence) {
        console.log(`Limiting restriction enzyme analysis for mega sequence (${(sequenceLength / 1000000).toFixed(2)}MB) - analyzing first 2MB`);
      }

      // Cancel any pending restriction analysis
      if (restrictionTaskRef.current) {
        console.log('Cancelling previous restriction enzyme analysis...');
        restrictionTaskRef.current.abort();
      }

      // Clear previous results to prevent stale data from triggering handlers
      enzymeDetection.clear();

      const runRestrictionAnalysis = async () => {
        // Create new abort controller for this request
        const abortController = new AbortController();
        restrictionTaskRef.current = abortController;

        try {
          // Wait a bit if sequence is still processing
          if (sequenceProcessingRef.current) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Determine analysis sequence and enzymes based on size
          let analysisSequence = currentSequence.sequence;
          let enzymes: string[] | undefined;
          
          if (isMegaSequence) {
            console.log(`Restriction enzyme analysis for mega sequence (${(sequenceLength / 1000000).toFixed(2)}MB) - analyzing first 2MB`);
            analysisSequence = currentSequence.sequence.slice(0, 2000000);
            // Use common enzymes for mega sequences
            enzymes = ['EcoRI', 'BamHI', 'HindIII', 'XhoI', 'SacI', 'KpnI', 'XbaI', 'SpeI', 'NotI', 'SalI'];
          } else if (isVeryLargeSequence) {
            console.log(`Restriction enzyme analysis for very large sequence (${(sequenceLength / 1000000).toFixed(2)}MB) - analyzing first 1MB`);
            analysisSequence = currentSequence.sequence.slice(0, 1000000);
            // Use common enzymes for very large sequences
            enzymes = ['EcoRI', 'BamHI', 'HindIII', 'XhoI', 'SacI', 'KpnI', 'XbaI', 'SpeI', 'NotI', 'SalI', 'PstI', 'SmaI'];
          } else if (isLargeSequence) {
            console.log(`Restriction enzyme analysis for large sequence (${(sequenceLength / 1000).toFixed(0)}kb)`);
            // Use extended enzyme set for large sequences
            enzymes = ['EcoRI', 'BamHI', 'HindIII', 'XhoI', 'SacI', 'KpnI', 'XbaI', 'SpeI', 'NotI', 'SalI', 'PstI', 'SmaI', 'ApaI', 'ClaI', 'NcoI'];
          }

          setRestrictionProgress({ progress: 20, message: 'Sending sequence to Talindrew API...' });
          
          // Use the enzyme detection hook to analyze the sequence
          await enzymeDetection.detect(analysisSequence, enzymes);

          // Check if request was aborted
          if (abortController.signal.aborted) {
            return;
          }

          setRestrictionProgress({ progress: 80, message: 'Processing enzyme cut sites...' });

        } catch (error) {
          if (error.name === 'AbortError') {
            console.log('Restriction enzyme analysis was cancelled');
            return;
          }
          
          console.error('Restriction enzyme analysis error:', error);
          setRestrictionAnnotations([]);
          setRestrictionProgress({ progress: 0, message: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
          setIsAnalyzingRestriction(false);
          restrictionTaskRef.current = null;
        }
      };

      // Delay analysis based on sequence size (staggered with disease analysis)
      const delay = isMegaSequence ? 2000 : (isVeryLargeSequence ? 1500 : (isLargeSequence ? 1000 : 600));
      const timer = setTimeout(runRestrictionAnalysis, delay);

      return () => {
        clearTimeout(timer);
        if (restrictionTaskRef.current) {
          restrictionTaskRef.current.abort();
          restrictionTaskRef.current = null;
        }
      };
    } else {
      setRestrictionAnnotations([]);
      setIsAnalyzingRestriction(false);
      setRestrictionProgress({ progress: 0, message: '' });
    }
  }, [currentSequence]); // REMOVED enzymeDetection.data and enzymeDetection.error from dependencies

  // Handle enzyme detection results
  useEffect(() => {
    if (enzymeDetection.data && restrictionTaskRef.current && !enzymeDetection.loading) {
      const apiResult = enzymeDetection.data;
      
      // Convert API results to internal annotation format
      const restrictionAnns: Annotation[] = [];
      
      apiResult.cut_sites_found.forEach(cutSite => {
        cutSite.positions.forEach((position, index) => {
          restrictionAnns.push({
            id: `${cutSite.enzyme}_${position}`,
            start: position,
            end: position + 1,
            name: cutSite.enzyme,
            type: 'cut_site',
            color: getColorForEnzyme(cutSite.enzyme),
            direction: 'none' as const,
            description: `${cutSite.enzyme} cut site`
          });
        });
      });

      setRestrictionAnnotations(restrictionAnns);
      setRestrictionProgress({ progress: 100, message: `Found ${apiResult.total_cut_sites} cut sites from ${apiResult.enzymes_analyzed.length} enzymes` });
      setIsAnalyzingRestriction(false);
      restrictionTaskRef.current = null;
      
      // Clear progress after a delay
      setTimeout(() => {
        setRestrictionProgress({ progress: 0, message: '' });
      }, 3000);
    }
  }, [enzymeDetection.data, getColorForEnzyme]);

  // Handle enzyme detection errors
  useEffect(() => {
    if (enzymeDetection.error && restrictionTaskRef.current && !enzymeDetection.loading) {
      console.error('Enzyme API error:', enzymeDetection.error);
      setRestrictionAnnotations([]);
      
      // Show user-friendly message for service unavailability
      if (enzymeDetection.error.includes('503') || enzymeDetection.error.includes('unavailable')) {
        setRestrictionProgress({ progress: 0, message: 'Enzyme analysis service temporarily unavailable - please try again later' });
      } else {
        setRestrictionProgress({ progress: 0, message: `Analysis failed: ${enzymeDetection.error}` });
      }
      
      setIsAnalyzingRestriction(false);
      restrictionTaskRef.current = null;
    }
  }, [enzymeDetection.error]);

  const handleAnnotationsChange = (
    newAnnotations: Annotation[],
  ) => {
    setAnnotations(newAnnotations);
  };

  const handleAnnotationAdd = () => {
    // Annotation modal is now handled locally in SeqViewer component
    console.log("Annotation add triggered - handled in SeqViewer component");
  };

  // Optimized view mode change with debouncing and transitions for 1M+ sequences
  const handleViewModeChange = useCallback((newViewMode: "linear" | "circular") => {
    if (isViewModeChanging || viewMode === newViewMode) return;
    
    setIsViewModeChanging(true);
    
    // Clear any pending view mode changes
    if (viewModeTimeoutRef.current) {
      clearTimeout(viewModeTimeoutRef.current);
    }
    
    // Enhanced delay calculation for very large sequences
    let delay = 100;
    if (currentSequence) {
      const sequenceLength = currentSequence.sequence.length;
      if (sequenceLength > 5000000) delay = 1000;      // 5M+ bp: 1 second delay
      else if (sequenceLength > 1000000) delay = 500;  // 1M+ bp: 0.5 second delay
      else if (sequenceLength > 100000) delay = 300;   // 100k+ bp: 0.3 second delay
      
      if (sequenceLength > 1000000) {
        console.log(`View mode change for large sequence (${(sequenceLength / 1000000).toFixed(2)}MB) - using ${delay}ms delay`);
      }
    }
    
    viewModeTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        setViewMode(newViewMode);
        setIsViewModeChanging(false);
      });
    }, delay);
  }, [viewMode, isViewModeChanging, currentSequence]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (viewModeTimeoutRef.current) {
        clearTimeout(viewModeTimeoutRef.current);
      }
    };
  }, []);

  // Memoize expensive annotation combination to prevent unnecessary re-renders
  const allAnnotations = useMemo(() => {
    // For very large sequences, limit annotation processing
    const isLargeSequence = currentSequence && currentSequence.sequence.length > 50000;
    
    if (isLargeSequence && sequenceProcessingRef.current) {
      // Return previous annotations while processing
      return [...annotations];
    }
    
    // Disease mutations appear at the top of the list
    return [
      ...diseaseAnnotations,
      ...annotations,
      ...restrictionAnnotations,
    ];
  }, [annotations, diseaseAnnotations, restrictionAnnotations]);

  // Get unique diseases detected
  const uniqueDiseases = useMemo(() => {
    const diseaseSet = new Set();
    detectedMutations.forEach((mutation) => {
      diseaseSet.add(mutation.marker.name);
    });
    return Array.from(diseaseSet) as string[];
  }, [detectedMutations]);

  const handleExportSequence = () => {
    if (!currentSequence) return;

    const content = `>${currentSequence.name}\n${currentSequence.sequence}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentSequence.name}.fasta`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const defaultSequence: SequenceData = {
    sequence:
      "TTAATTAAGCTTGGCACTGGCCGTCGTTTTACAACGTCGTGACTGGGAAAACCCTGGCGTTACCCAACTTAATCGCCTTGCAGCACATCCCCCTTTCGCCAGCTGGCGTAATAGCGAAGAGGCCCGCACCGATCGCCCTTCCCAACAGTTGCGCAGCCTGAATGGCGAATGGCGCCTGATGCGGTATTTTCTCCTTACGCATCTGTGCGGTATTTCACACCGCATATGGTGCACTCTCAGTACAATCTGCTCTGATGCCGCATAGTTAAGCCAGCCCCGACACCCGCCAACACCCGCTGACGCGCCCTGACGGGCTTGTCTGCTCCCGGCATCCGCTTACAGACAAGCTGTGACCGTCTCCGGGAGCTGCATGTGTCAGAGGTTTTCACCGTCATCACCGAAACGCGCGATACGCATGATTGAACAAGATGGATTGCACGCAGGTTCTCCGGCCGCTTGGGTGGAGAGGCTATTCGGCTATGACTGGGCACAACAGACAATCGGCTGCTCTGATGCCGCCGTGTTCCGGCTGTCAGCGCAGGGGCGCCCGGTTCTTTTTGTCAAGACCGACCTGTCCGGTGCCCTGAATGAACTGCAGGACGAGGCAGCGCGGCTATCGTGGCTGGCCACGACGGGCGTTCCTTGCGCAGCTGTGCTCGACGTTGTCACTGAAGCGGGAAGGGACTGGCTGCTATTGGGCGAAGTGCCGGGGCAGGATCTCCTGTCATCTCACCTTGCTCCTGCCGAGAAAGTATCCATCATGGCTGATGCAATGCGGCGGCTGCATACGCTTGATCCGGCTACCTGCCCATTCGACCACCAAGCGAAACATCGCATCGAGCGAGCACGTACTCGGATGGAAGCCGGTCTTGTCGATCAGGATGATCTGGACGAAGAGCATCAGGGGCTCGCGCCAGCCGAACTGTTCGCCAGGCTCAAGGCGCGCATGCCCGACGGCGAGGATCTCGTCGTGACCCATGGCGATGCCTGCTTGCCGAATATCATGGTGGAAAATGGCCGCTTTTCTGGATTCATCGACTGTGGCCGGCTGGGTGTGGCGGACCGCTATCAGGACATAGCGTTGGCTACCCGTGATATTGCTGAAGAGCTTGGCGGCGAATGGGCTGACCGCTTCCTCGTGCTTTACGGTATCGCCGCTCCCGATTCGCAGCGCATCGCCTTCTATCGCCTTCTTGACGAGTTCTTCTGAATTATTAACGCTTACAATTTCCTGATGCGGTATTTTCTCCTTACGCATCTGTGCGGTATTTCACACCGCATAT",
    name: "pUC19 Plasmid",
    type: "dna",
    description:
      "A sample bacterial plasmid sequence for demonstration",
  };

  // Helper components using Figma design
  const ReactIconsHiHiOutlineSparkles = () => (
    <div className="relative size-full">
      <div className="absolute inset-[8.333%]">
        <img className="block max-w-none size-full" src={imgVectorStroke} />
      </div>
    </div>
  );

  const SidebarTab = ({ 
    isActive, 
    icon, 
    label, 
    onClick, 
    disabled = false,
    badge = null,
    tooltip = null,
    isMobile = false
  }: {
    isActive: boolean;
    icon: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    badge?: React.ReactNode;
    tooltip?: string;
    isMobile?: boolean;
  }) => {
    const handleClick = () => {
      if (!disabled) {
        onClick();
        if (isMobile) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    const tabContent = (
      <div 
        className={`
          relative rounded-[8px] w-full cursor-pointer transition-all min-w-0
          ${isActive ? 'bg-[#161618] border border-[#292929]' : 'hover:bg-[#0a0a0a]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={handleClick}
      >
        <div className="flex flex-row items-center relative size-full">
          <div className="box-border content-stretch flex gap-2 md:gap-4 items-center justify-start px-4 md:px-6 py-2.5 relative w-full">
            <div className={`relative shrink-0 size-4 ${!isActive ? 'filter grayscale opacity-60' : ''}`}>
              <img className="block max-w-none size-full" src={icon} />
            </div>
            <div className={`flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative text-[16px] text-center ${
              isActive ? 'text-[#ebebed]' : 'text-[#9a9a9a]'
            }`}>
              <p className="leading-[20px]">{label}</p>
            </div>
            {badge && <div className="ml-auto">{badge}</div>}
          </div>
        </div>
      </div>
    );

    if (disabled && tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {tabContent}
          </TooltipTrigger>
          <TooltipContent side={isMobile ? "bottom" : "right"}>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return tabContent;
  };

  const NavigationTabs = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="content-stretch flex flex-col gap-1.5 items-start justify-start relative shrink-0 w-full">
      <SidebarTab
        isActive={activeTab === "editor"}
        icon={imgSvg1}
        label="Editor"
        onClick={() => setActiveTab("editor")}
        isMobile={isMobile}
      />
      
      <SidebarTab
        isActive={activeTab === "search"}
        icon={imgSvg2}
        label="Search"
        onClick={() => setActiveTab("search")}
        isMobile={isMobile}
      />
      
      <SidebarTab
        isActive={activeTab === "viewer"}
        icon={imgSvg3}
        label="Viewer"
        onClick={() => setActiveTab("viewer")}
        disabled={!currentSequence}
        tooltip={!currentSequence ? "Please enter a DNA sequence or try out examples" : undefined}
        isMobile={isMobile}
      />
      
      <SidebarTab
        isActive={activeTab === "restriction"}
        icon={imgSvg4}
        label="Enzymes"
        onClick={() => setActiveTab("restriction")}
        disabled={!currentSequence || currentSequence.type !== "dna"}
        tooltip={!currentSequence ? "Please enter a DNA sequence or try out examples" : 
                currentSequence.type !== "dna" ? "DNA sequence required for enzyme analysis" : undefined}
        badge={restrictionAnnotations.length > 0 && (
          <Badge variant="secondary" className="ml-1 text-xs px-1 py-0 h-4">
            {restrictionAnnotations.length}
          </Badge>
        )}
        isMobile={isMobile}
      />
      
      <SidebarTab
        isActive={activeTab === "diseases"}
        icon={imgSvg5}
        label="Diseases"
        onClick={() => setActiveTab("diseases")}
        disabled={!currentSequence}
        tooltip={!currentSequence ? "Please enter a DNA sequence or try out examples" : undefined}
        badge={uniqueDiseases.length > 0 && (
          <Badge variant="destructive" className="ml-1 text-xs px-1 py-0 h-4">
            {uniqueDiseases.length}
          </Badge>
        )}
        isMobile={isMobile}
      />
      
      <SidebarTab
        isActive={activeTab === "analysis"}
        icon={imgSvg6}
        label="Analysis"
        onClick={() => setActiveTab("analysis")}
        disabled={!currentSequence}
        tooltip={!currentSequence ? "Please enter a DNA sequence or try out examples" : undefined}
        isMobile={isMobile}
      />
    </div>
  );

  return (
    <TooltipProvider>
      <div className="dark h-screen bg-[#111113] flex overflow-hidden">
        <Toaster />

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] border-b border-[#292929] px-4 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#161618] p-2 rounded-lg border border-[#292929]">
                <div className="size-6">
                  <Frame50 />
                </div>
              </div>
              <h1 className="text-lg font-medium text-white">Talindrew</h1>
            </div>
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-[#161618] active:bg-[#292929]">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[300px] bg-[#0f0f0f] border-l border-[#292929] p-0 overflow-y-auto">
                <SheetHeader className="px-6 py-4 border-b border-[#292929]">
                  <SheetTitle className="text-white text-left flex items-center justify-between">
                    Navigation
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-white hover:bg-[#161618] h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetTitle>
                </SheetHeader>
                <div className="p-4 md:p-6">
                  <NavigationTabs isMobile={true} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop Left Sidebar */}
        <div className="bg-[#0f0f0f] box-border content-stretch flex-col gap-5 items-center justify-start p-[20px] flex-shrink-0 fixed left-0 top-0 w-[284px] h-screen border-r border-[#292929] overflow-y-auto z-10 hidden md:flex">
          {/* Logo/Header */}
          <div className="bg-[#161618] relative rounded-[8px] shrink-0 w-full border border-[#292929]">
            <div className="flex flex-col justify-center overflow-clip relative size-full">
              <div className="box-border content-stretch flex flex-col gap-2.5 items-start justify-center p-[10px] relative w-full">
                <div className="content-stretch flex items-center justify-start relative shrink-0">
                  <div className="box-border content-stretch flex flex-col items-start justify-start pl-0 pr-3 py-0 relative shrink-0">
                    <div className="bg-[#0f0f0f] box-border content-stretch flex flex-col items-start justify-start p-[8px] relative rounded-[10px] shrink-0">
                      <div className="relative shrink-0 size-6">
                        <Frame50 />
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start justify-start relative">
                    <div className="flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] not-italic relative text-[18px] text-white">
                      <p className="leading-[32px]">Talindrew</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-0 relative shrink-0 w-full">
            <div className="absolute bottom-0 left-0 right-0 top-[-1px]">
              <img className="block max-w-none size-full" src={imgLine1} />
            </div>
          </div>

          {/* Navigation Tabs */}
          <NavigationTabs />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen md:ml-[284px] pt-[73px] md:pt-0 min-w-0">
          {/* Main Content */}
          <main className="flex-1 p-3 md:p-6 bg-[#111113] overflow-y-auto overflow-x-hidden h-full">
            <div className="space-y-4 md:space-y-6">

              {/* Tab Content */}
              {activeTab === "editor" && (
                <div className="space-y-6">
                  {/* Header */}
                  <BackgroundBorder />

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
                    {/* Quick Start */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="relative size-4">
                            <img className="block max-w-none size-full" src={imgVectorStroke} />
                          </div>
                          Quick Start
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-muted-foreground mb-4">
                            Try sample sequences to explore Talindrew features:
                          </p>
                          {isLoadingSequences && (
                            <div className="flex items-center space-x-2 mb-4 text-sm text-muted-foreground">
                              <Dna className="w-4 h-4 animate-spin" />
                              <span>Loading disease sequences from database...</span>
                            </div>
                          )}
                          <div className="grid grid-cols-1 gap-3">
                            <Button
                              variant="outline"
                              onClick={() => handleSequenceSubmit(defaultSequence)}
                              className="justify-start"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Load Sample Plasmid (pUC19)
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                diseaseSequences.sicklecell &&
                                handleSequenceSubmit(diseaseSequences.sicklecell)
                              }
                              className="justify-start text-[rgba(255,255,255,1)] border-red-300 hover:bg-red-50"
                              disabled={isLoadingSequences || !diseaseSequences.sicklecell}
                            >
                              <div className="w-4 h-4 mr-2">
                                <ReactIconsBiBiLoaderCircle />
                              </div>
                              {isLoadingSequences ? "Loading..." : "Sickle Cell Sequence"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                diseaseSequences.cysticfibrosis &&
                                handleSequenceSubmit(diseaseSequences.cysticfibrosis)
                              }
                              className="justify-start text-[rgba(255,255,255,1)] border-orange-300 hover:bg-orange-50"
                              disabled={isLoadingSequences || !diseaseSequences.cysticfibrosis}
                            >
                              <div className="w-4 h-4 mr-2">
                                <ReactIconsBiBiLoaderCircle />
                              </div>
                              {isLoadingSequences ? "Loading..." : "Cystic Fibrosis Sequence"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() =>
                                diseaseSequences.huntington &&
                                handleSequenceSubmit(diseaseSequences.huntington)
                              }
                              className="justify-start text-[rgba(255,255,255,1)] border-purple-300 hover:bg-purple-50"
                              disabled={isLoadingSequences || !diseaseSequences.huntington}
                            >
                              <div className="w-4 h-4 mr-2">
                                <ReactIconsBiBiLoaderCircle />
                              </div>
                              {isLoadingSequences ? "Loading..." : "Huntington's Sequence"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Disease Search Preview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Search className="w-5 h-5" />
                          Disease Search
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground mb-4">
                          Search genetic diseases and load sequences from NCBI database.
                        </p>
                        <Button onClick={() => setActiveTab("search")} className="w-full">
                          <Search className="w-4 h-4 mr-2" />
                          Open Disease Search
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <SeqEditor onSequenceSubmit={handleSequenceSubmit} />
                </div>
              )}

              {activeTab === "search" && (
                <div className="space-y-6">
                  <DiseaseSearchOptimized
                    onSequenceLoad={handleSequenceFromNCBI}
                    onDiseaseSelect={(disease) => {
                      console.log("Selected disease:", disease);
                      // Could implement further functionality here
                    }}
                  />
                </div>
              )}

              {activeTab === "viewer" && (
                <div className="space-y-6">
                  {currentSequence ? (
                    <>
                      {/* API Analysis Status */}
                      {(isAnalyzingDiseases || isAnalyzingRestriction) && (
                        <Alert className="mb-4">
                          <Dna className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Enhanced Analysis Active:</strong> Using Talindrew Gene API for accurate disease and enzyme detection. 
                            Large sequences may take 2-5 minutes to process completely.
                            {(diseaseProgress.message || restrictionProgress.message) && (
                              <div className="mt-2 space-y-1">
                                {diseaseProgress.message && (
                                  <div className="text-sm">Disease: {diseaseProgress.message}</div>
                                )}
                                {restrictionProgress.message && (
                                  <div className="text-sm">Enzymes: {restrictionProgress.message}</div>
                                )}
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* API Service Unavailable Warning */}
                      {((diseaseProgress.message && diseaseProgress.message.includes('unavailable')) || 
                        (restrictionProgress.message && restrictionProgress.message.includes('unavailable'))) && (
                        <Alert variant="destructive" className="mb-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Service Temporarily Unavailable:</strong> The Talindrew Gene API is currently experiencing issues (HTTP 503). 
                            This may be due to maintenance or high server load. Please try again in a few minutes.
                            <div className="mt-2">
                              <strong>Alternative:</strong> You can still use the local analysis features in the "Enzymes" and "Diseases" tabs for basic functionality.
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      <LazySeqViewer
                      sequence={currentSequence.sequence}
                      sequenceType={currentSequence.type}
                      name={currentSequence.name}
                      annotations={allAnnotations}
                      viewMode={viewMode}
                      showComplement={currentSequence.type !== "protein"}
                      showIndices={true}
                      detectedDiseases={uniqueDiseases}
                      onViewModeChange={handleViewModeChange}
                      isViewModeChanging={isViewModeChanging}
                      isOptimizing={isOptimizing || sequenceProcessingRef.current}
                      onAnnotationAdd={handleAnnotationAdd}
                      onAnnotationsChange={handleAnnotationsChange}
                    />
                    </>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Dna className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Sequence Loaded</h3>
                        <p className="text-muted-foreground text-center max-w-md px-4">
                          Please go to the Editor tab and input a sequence to start visualization.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === "restriction" && (
                <div className="space-y-6">
                  {currentSequence && currentSequence.type === "dna" ? (
                    <LazyRestrictionEnzymeAnalysis
                      sequence={currentSequence.sequence}
                      onCutSitesDetected={(annotations) => {
                        // This is handled by useEffect, but we keep the prop for consistency
                      }}
                    />
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Scissors className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No DNA Sequence Loaded</h3>
                        <p className="text-muted-foreground text-center max-w-md px-4">
                          Please load a DNA sequence first to analyze restriction enzyme cut sites.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === "diseases" && (
                <div className="space-y-6">
                  {currentSequence ? (
                    <div className="space-y-6">
                      {/* API Disease Detection Results */}
                      {detectedMutations.length > 0 ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5" />
                              API Disease Detection Results
                              <Badge variant="secondary" className="ml-2">
                                Enhanced Analysis
                              </Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-red-800 dark:text-red-200">
                                {detectedMutations.length} potential disease association{detectedMutations.length > 1 ? "s" : ""} detected via Talindrew Gene API.
                                Please consult with a genetic counselor for proper interpretation.
                              </AlertDescription>
                            </Alert>

                            {/* Group mutations by disease */}
                            {Object.entries(
                              detectedMutations.reduce(
                                (groups, mutation) => {
                                  const diseaseName = mutation.marker.name;
                                  if (!groups[diseaseName]) {
                                    groups[diseaseName] = {
                                      name: diseaseName,
                                      mutations: [],
                                    };
                                  }
                                  groups[diseaseName].mutations.push(mutation);
                                  return groups;
                                },
                                {} as Record<string, { name: string; mutations: typeof detectedMutations }>
                              )
                            ).map(([diseaseName, { mutations: diseaseMutations }]) => (
                              <Card
                                key={diseaseName}
                                className="border-l-4 border-l-red-500"
                              >
                                <CardContent className="pt-4">
                                  <div className="space-y-3">
                                    <div className="flex flex-col md:flex-row items-start justify-between">
                                      <div>
                                        <h4 className="font-semibold text-lg">
                                          {diseaseName}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          {diseaseMutations[0].marker.description}
                                        </p>
                                      </div>
                                      <div className="flex gap-2 pt-2 md:pt-0">
                                        <Badge
                                          variant={
                                            diseaseMutations[0].confidence === "high"
                                              ? "destructive"
                                              : "secondary"
                                          }
                                        >
                                          {diseaseMutations[0].confidence} confidence
                                        </Badge>
                                        <Badge variant="outline">
                                          API Detected
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Mutations Found:</strong>{" "}
                                        {diseaseMutations.length}
                                      </div>
                                      <div>
                                        <strong>Analysis Source:</strong>{" "}
                                        Talindrew API
                                      </div>
                                      {diseaseMutations[0].marker.clinvarId && (
                                        <div className="md:col-span-2">
                                          <strong>ClinVar ID:</strong>{" "}
                                          {diseaseMutations[0].marker.clinvarId}
                                        </div>
                                      )}
                                    </div>

                                    {/* Show all mutation positions */}
                                    <div className="bg-[rgba(24,24,24,1)] p-3 rounded text-sm">
                                      <strong>Detected Positions:</strong>
                                      <div className="mt-2 space-y-1">
                                        {diseaseMutations.map((mutation, idx) => (
                                          <div key={idx} className="text-xs">
                                            Position {mutation.position + 1}: {mutation.originalBase} → {mutation.mutatedBase}
                                            {mutation.confidence && (
                                              <span className="ml-2 px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">
                                                {mutation.confidence} confidence
                                              </span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="bg-[rgba(24,24,24,1)] p-3 rounded text-sm">
                                      <strong>Clinical significance:</strong>{" "}
                                      {diseaseMutations[0].marker.description}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </CardContent>
                        </Card>
                      ) : isAnalyzingDiseases ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Dna className="w-5 h-5 animate-spin" />
                              Analyzing for Disease Mutations via API...
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {diseaseProgress.message && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Progress:</span>
                                  <span>{diseaseProgress.progress}%</span>
                                </div>
                                <Progress value={diseaseProgress.progress} className="w-full" />
                                <p className="text-xs text-muted-foreground">{diseaseProgress.message}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Alert>
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            No disease associations detected via API analysis. 
                            {diseaseProgress.message && diseaseProgress.message.includes('failed') && (
                              <span className="block mt-2 text-red-600">
                                API Error: {diseaseProgress.message}
                              </span>
                            )}
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Local Pattern Analysis (Fallback) */}
                      <LazyDiseaseDetectorComponent
                        sequence={currentSequence.sequence}
                        onMutationsDetected={(annotations) => {
                          // This is handled by useEffect, but we keep the prop for consistency
                        }}
                      />
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 text-muted-foreground mb-4">
                          <ReactIconsBiBiLoaderCircle />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No Sequence Loaded</h3>
                        <p className="text-muted-foreground text-center max-w-md px-4">
                          Please load a sequence first to analyze for disease mutations.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {activeTab === "analysis" && (
                <div className="space-y-6">
                  {/* Comprehensive Gene Analysis */}
                  <GeneAnalysisComponent
                    initialGeneSymbol={currentSequence?.name.includes('Gene') ? 
                      currentSequence.name.split(' ')[0] : ''}
                    initialSequence={currentSequence?.sequence || ''}
                    onAnalysisComplete={(result) => {
                      console.log('Gene analysis complete:', result);
                    }}
                  />

                  {/* Traditional Sequence Utils */}
                  {currentSequence && (
                    <div className="w-full">
                      <LazySequenceUtils
                        sequence={currentSequence.sequence}
                        sequenceType={currentSequence.type}
                      />
                    </div>
                  )}
                  
                  {/* API Analysis Status */}
                  {(diseaseProgress.message || restrictionProgress.message) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="w-5 h-5" />
                          Analysis Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {diseaseProgress.message && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Disease Detection:</span>
                              <span>{diseaseProgress.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${diseaseProgress.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">{diseaseProgress.message}</p>
                          </div>
                        )}
                        {restrictionProgress.message && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Enzyme Analysis:</span>
                              <span>{restrictionProgress.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${restrictionProgress.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">{restrictionProgress.message}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}