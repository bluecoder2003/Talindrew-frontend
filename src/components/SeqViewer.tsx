import React, { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import {
  Search,
  Download,
  Settings,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  Eye,
  EyeOff,
  Maximize2,
  RotateCcw,
  Plus,
  X,
  Save,
} from "lucide-react";
import { CircularViewerComplete } from "./circular/CircularViewerComplete";
import { Linear } from "./Linear/Linear";
import { EventHandler } from "./Linear/EventHandler";
import SelectionHandler from "./Linear/SelectionHandler";
import { complement, guessType } from "./Linear/utils";
import { PerformanceMonitor } from "../utils/performance";
import { toast } from "sonner@2.0.3";

export interface Annotation {
  id: string;
  start: number;
  end: number;
  name: string;
  type:
    | "gene"
    | "promoter"
    | "terminator"
    | "origin"
    | "custom";
  color: string;
  direction?: "forward" | "reverse";
}

export interface SeqViewerProps {
  sequence: string;
  sequenceType: "dna" | "rna" | "protein";
  name?: string;
  annotations?: Annotation[];
  viewMode?: "linear" | "circular";
  onSequenceChange?: (sequence: string) => void;
  showComplement?: boolean;
  showIndices?: boolean;
  detectedDiseases?: string[];
  onViewModeChange?: (viewMode: "linear" | "circular") => void;
  isViewModeChanging?: boolean;
  isOptimizing?: boolean;
  onAnnotationAdd?: () => void;
  onAnnotationsChange?: (annotations: Annotation[]) => void;
}

export const SeqViewer: React.FC<SeqViewerProps> = ({
  sequence,
  sequenceType,
  name = "Untitled Sequence",
  annotations = [],
  viewMode = "linear",
  onSequenceChange,
  showComplement = true,
  showIndices = true,
  detectedDiseases = [],
  onViewModeChange,
  isViewModeChanging = false,
  isOptimizing = false,
  onAnnotationAdd,
  onAnnotationsChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnnotation, setSelectedAnnotation] = useState<
    string | null
  >(null);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [currentView, setCurrentView] = useState(viewMode);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showAminoAcids, setShowAminoAcids] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [basesPerLine, setBasesPerLine] = useState(60);
  const [highlightSearchResults, setHighlightSearchResults] =
    useState(true);

  // Annotation modal state
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] =
    useState(false);
  const [annotationFormData, setAnnotationFormData] = useState({
    name: "",
    start: 1,
    end: 10,
    type: "gene" as const,
    color: "#3B82F6",
    direction: "forward" as const,
    description: "",
  });

  const [selection, setSelection] = useState({
    start: 0,
    end: 0,
    clockwise: true,
  });
  const [linearSize, setLinearSize] = useState({
    width: 800,
    height: 600,
  });

  // Performance flags
  const isLargeSequence = sequence.length > 50000;
  const isVeryLargeSequence = sequence.length > 200000;

  // Internal state for display options, initialized from props
  const [internalShowComplement, setInternalShowComplement] =
    useState(showComplement);
  const [internalShowIndices, setInternalShowIndices] =
    useState(showIndices);

  const sequenceRef = useRef<HTMLDivElement>(null);

  // Annotation types for the modal
  const annotationTypes = [
    { value: "gene", label: "Gene", color: "#3B82F6" },
    { value: "promoter", label: "Promoter", color: "#10B981" },
    {
      value: "terminator",
      label: "Terminator",
      color: "#EF4444",
    },
    { value: "origin", label: "Origin", color: "#8B5CF6" },
    { value: "custom", label: "Custom", color: "#6B7280" },
  ];

  // Annotation modal functions
  const resetAnnotationForm = () => {
    setAnnotationFormData({
      name: "",
      start: 1,
      end: 10,
      type: "gene",
      color: "#3B82F6",
      direction: "forward",
      description: "",
    });
  };

  const validateAnnotation = () => {
    if (!annotationFormData.name.trim()) {
      toast.error("Annotation name is required");
      return false;
    }

    if (
      annotationFormData.start < 1 ||
      annotationFormData.start > sequence.length
    ) {
      toast.error(
        `Start position must be between 1 and ${sequence.length}`,
      );
      return false;
    }

    if (
      annotationFormData.end < 1 ||
      annotationFormData.end > sequence.length
    ) {
      toast.error(
        `End position must be between 1 and ${sequence.length}`,
      );
      return false;
    }

    if (annotationFormData.start > annotationFormData.end) {
      toast.error(
        "Start position must be less than or equal to end position",
      );
      return false;
    }

    return true;
  };

  const handleAnnotationSubmit = () => {
    if (!validateAnnotation()) return;

    const newAnnotation: Annotation = {
      id: `annotation-${Date.now()}`,
      name: annotationFormData.name.trim(),
      start: annotationFormData.start,
      end: annotationFormData.end,
      type: annotationFormData.type,
      color: annotationFormData.color,
      direction: annotationFormData.direction,
    };

    // Update annotations using the callback if available
    if (onAnnotationsChange) {
      const updatedAnnotations = [
        ...annotations,
        newAnnotation,
      ];
      onAnnotationsChange(updatedAnnotations);
    }

    toast.success("Annotation added successfully");
    setIsAnnotationModalOpen(false);
    resetAnnotationForm();
  };

  const handleAnnotationTypeChange = (type: string) => {
    const typeInfo = annotationTypes.find(
      (t) => t.value === type,
    );
    setAnnotationFormData((prev) => ({
      ...prev,
      type: type as any,
      color: typeInfo?.color || prev.color,
    }));
  };

  const handleAnnotationModalClose = () => {
    setIsAnnotationModalOpen(false);
    resetAnnotationForm();
  };

  // Update internal state when props change
  useEffect(() => {
    setInternalShowComplement(showComplement);
  }, [showComplement]);

  useEffect(() => {
    setInternalShowIndices(showIndices);
  }, [showIndices]);

  // Performance-aware view mode updates
  useEffect(() => {
    if (viewMode !== currentView && !isViewModeChanging) {
      setCurrentView(viewMode);
    }
  }, [viewMode, currentView, isViewModeChanging]);

  // Optimized view mode change handler
  const handleInternalViewModeChange = (
    newView: "linear" | "circular",
  ) => {
    if (isViewModeChanging || currentView === newView) return;

    if (onViewModeChange) {
      onViewModeChange(newView);
    } else {
      setCurrentView(newView);
    }
  };

  // Performance-aware feature toggles for large sequences
  const handleFeatureToggle = (
    feature: string,
    value: boolean,
  ) => {
    if (isVeryLargeSequence && value) {
      console.warn(
        `${feature} disabled for very large sequences to maintain performance`,
      );
      return;
    }

    switch (feature) {
      case "translation":
        setShowTranslation(value);
        break;
      case "aminoacids":
        setShowAminoAcids(value);
        break;
      case "ruler":
        setShowRuler(value);
        break;
      case "complement":
        setInternalShowComplement(value);
        break;
      case "indices":
        setInternalShowIndices(value);
        break;
    }
  };

  const getComplementBase = (base: string): string => {
    const complements: { [key: string]: string } = {
      A: "T",
      T: "A",
      G: "C",
      C: "G",
      a: "t",
      t: "a",
      g: "c",
      c: "g",
    };
    return complements[base] || base;
  };

  const getComplementSequence = (seq: string): string => {
    return seq.split("").map(getComplementBase).join("");
  };

  const highlightMatches = (
    seq: string,
    term: string,
  ): JSX.Element[] => {
    if (!term) return [<span key="seq">{seq}</span>];

    const regex = new RegExp(`(${term})`, "gi");
    const parts = seq.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-300 dark:bg-yellow-600"
        >
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      ),
    );
  };

  const getSequenceColor = (
    base: string,
    type: string,
  ): string => {
    if (type === "protein") {
      // Amino acid coloring
      const hydrophobic = "AILVFWMPGCY";
      const polar = "STNQ";
      const basic = "RHK";
      const acidic = "DE";

      if (hydrophobic.includes(base.toUpperCase()))
        return "text-blue-600";
      if (polar.includes(base.toUpperCase()))
        return "text-green-600";
      if (basic.includes(base.toUpperCase()))
        return "text-red-600";
      if (acidic.includes(base.toUpperCase()))
        return "text-purple-600";
      return "text-gray-600";
    } else {
      // DNA/RNA coloring
      const colors: { [key: string]: string } = {
        A: "text-red-600",
        T: "text-blue-600",
        U: "text-blue-600",
        G: "text-green-600",
        C: "text-orange-600",
        a: "text-red-600",
        t: "text-blue-600",
        u: "text-blue-600",
        g: "text-green-600",
        c: "text-orange-600",
      };
      return colors[base] || "text-gray-600";
    }
  };

  const renderLinearView = () => {
    return PerformanceMonitor.measureSync(
      "Linear View Render",
      () => {
        const seqType = guessType(sequence);
        const compSeq = internalShowComplement
          ? complement(sequence, seqType as any)
          : "";

        // Calculate layout parameters
        const containerWidth =
          sequenceRef.current?.clientWidth || 800;
        const charWidth = zoomLevel * 0.6;
        const bpsPerBlock = basesPerLine;
        const lineHeight = zoomLevel * 1.4;
        const elementHeight = 16;

        // Convert annotations to Linear format
        const linearAnnotations = annotations.map((ann) => ({
          ...ann,
          start: ann.start - 1, // Convert to 0-based
          end: ann.end - 1,
          direction: ann.direction === "forward" ? 1 : -1,
        }));

        // Dummy mouse event handler for now
        const handleMouseEvent = (e: React.MouseEvent) => {
          // Handle sequence selection
          console.log("Mouse event:", e.type);
        };

        // Dummy input ref handler
        const inputRef = (id: string, ref: any) => {
          console.log("Input ref:", id, ref);
        };

        // Process search results with performance optimization
        const searchResults = [];
        if (
          searchTerm &&
          searchTerm.length > 0 &&
          !isVeryLargeSequence
        ) {
          const regex = new RegExp(searchTerm, "gi");
          let match;
          let matchCount = 0;
          const maxMatches = isLargeSequence ? 100 : 1000; // Limit search results for performance

          while (
            (match = regex.exec(sequence)) !== null &&
            matchCount < maxMatches
          ) {
            searchResults.push({
              id: `search-${match.index}`,
              name: searchTerm,
              start: match.index,
              end: match.index + searchTerm.length,
              direction: 1,
              color: "#ffeb3b",
            });
            matchCount++;

            // Prevent infinite loop for global regex
            if (match.index === regex.lastIndex) {
              regex.lastIndex++;
            }
          }
        }

        return (
          <Linear
            annotations={linearAnnotations}
            bpColors={{}}
            bpsPerBlock={bpsPerBlock}
            charWidth={charWidth}
            compSeq={compSeq}
            cutSites={[]}
            elementHeight={elementHeight}
            handleMouseEvent={handleMouseEvent}
            highlights={[]}
            inputRef={inputRef}
            lineHeight={lineHeight}
            name={name}
            onUnmount={() => {}}
            primers={[]}
            search={searchResults}
            seq={sequence}
            seqFontSize={zoomLevel}
            seqType={seqType as any}
            showComplement={
              internalShowComplement &&
              sequenceType !== "protein"
            }
            showIndex={showRuler}
            size={{ width: containerWidth, height: 600 }}
            translations={[]}
            zoom={{ linear: 50 }}
          />
        );
      },
    );
  };

  const translateFrame = (
    seq: string,
    frame: number,
  ): string => {
    const geneticCode: { [key: string]: string } = {
      TTT: "F",
      TTC: "F",
      TTA: "L",
      TTG: "L",
      TCT: "S",
      TCC: "S",
      TCA: "S",
      TCG: "S",
      TAT: "Y",
      TAC: "Y",
      TAA: "*",
      TAG: "*",
      TGT: "C",
      TGC: "C",
      TGA: "*",
      TGG: "W",
      CTT: "L",
      CTC: "L",
      CTA: "L",
      CTG: "L",
      CCT: "P",
      CCC: "P",
      CCA: "P",
      CCG: "P",
      CAT: "H",
      CAC: "H",
      CAA: "Q",
      CAG: "Q",
      CGT: "R",
      CGC: "R",
      CGA: "R",
      CGG: "R",
      ATT: "I",
      ATC: "I",
      ATA: "I",
      ATG: "M",
      ACT: "T",
      ACC: "T",
      ACA: "T",
      ACG: "T",
      AAT: "N",
      AAC: "N",
      AAA: "K",
      AAG: "K",
      AGT: "S",
      AGC: "S",
      AGA: "R",
      AGG: "R",
      GTT: "V",
      GTC: "V",
      GTA: "V",
      GTG: "V",
      GCT: "A",
      GCC: "A",
      GCA: "A",
      GCG: "A",
      GAT: "D",
      GAC: "D",
      GAA: "E",
      GAG: "E",
      GGT: "G",
      GGC: "G",
      GGA: "G",
      GGG: "G",
    };

    let protein = "";
    let dnaSeq = seq.toUpperCase();
    if (sequenceType === "rna") {
      dnaSeq = dnaSeq.replace(/U/g, "T");
    }

    for (let i = frame; i < dnaSeq.length - 2; i += 3) {
      const codon = dnaSeq.slice(i, i + 3);
      if (codon.length === 3) {
        protein += geneticCode[codon] || "X";
      } else {
        protein += " ";
      }
    }

    // Pad with spaces to align with DNA sequence
    return (
      " ".repeat(frame) +
      protein +
      " ".repeat(3 - ((protein.length + frame) % 3))
    );
  };

  // Copy sequence to clipboard
  const handleCopySequence = async () => {
    try {
      await navigator.clipboard.writeText(sequence);
      toast.success(
        `Sequence copied to clipboard (${sequence.length.toLocaleString()} bases)`,
      );
    } catch (err) {
      console.error(
        "Failed to copy sequence to clipboard:",
        err,
      );
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = sequence;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success(
          `Sequence copied to clipboard (${sequence.length.toLocaleString()} bases)`,
        );
      } catch (fallbackErr) {
        console.error(
          "Fallback copy method also failed:",
          fallbackErr,
        );
        toast.error("Failed to copy sequence to clipboard");
      }
      document.body.removeChild(textArea);
    }
  };

  // Export sequence as FASTA file
  const handleExportSequence = () => {
    try {
      const content = `>${name}\n${sequence}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.fasta`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(
        `Sequence exported as ${name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.fasta`,
      );
    } catch (error) {
      console.error("Failed to export sequence:", error);
      toast.error("Failed to export sequence");
    }
  };

  const renderCircularView = () => {
    return PerformanceMonitor.measureSync(
      "Circular View Render",
      () => {
        // Performance warning for very large sequences
        if (isVeryLargeSequence) {
          console.warn(
            "Rendering circular view for very large sequence - performance may be impacted",
          );
        }

        // Filter out disease annotations from the circular view to avoid repetition
        // Only show mutation positions, not disease names repeatedly
        const filteredAnnotations = annotations.filter(
          (ann) => {
            // Keep restriction enzyme cut sites and regular annotations
            if (
              ann.type !== "custom" ||
              !ann.name.toLowerCase().includes("mutation")
            ) {
              return true;
            }

            // For disease mutations, create a simplified marker without the disease name
            return false;
          },
        );

        // Create simplified mutation markers (just positions, no disease names)
        const mutationMarkers = annotations
          .filter(
            (ann) =>
              ann.type === "custom" &&
              ann.name.toLowerCase().includes("mutation"),
          )
          .map((ann) => ({
            ...ann,
            name: "Mutation", // Simplified name
            color: "#DC2626", // Red color for mutation markers
          }));

        // Convert annotations to the format expected by CircularViewer
        const circularAnnotations = [
          ...filteredAnnotations,
          ...mutationMarkers,
        ].map((ann) => ({
          id: ann.id,
          start: ann.start,
          end: ann.end,
          name: ann.name,
          type: ann.type,
          color: ann.color,
          direction:
            ann.direction === "forward"
              ? 1
              : ann.direction === "reverse"
                ? -1
                : undefined,
        }));

        const svgSize = Math.max(
          600,
          Math.min(
            800,
            typeof window !== "undefined"
              ? window.innerWidth * 0.8
              : 800,
          ),
        );
        const size = { width: svgSize, height: svgSize };

        return (
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900/50 dark:to-slate-800/50 dark:border dark:border-border p-8 rounded-lg">
            {isVeryLargeSequence && (
              <div className="mb-4 p-3 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-200">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  Large sequence detected - circular view may
                  render slowly
                </div>
              </div>
            )}
            <div className="flex justify-center">
              <CircularViewerComplete
                annotations={circularAnnotations}
                seq={sequence}
                name={name}
                size={size}
                showComplement={
                  internalShowComplement &&
                  sequenceType !== "protein"
                }
                showIndex={internalShowIndices}
                rotateOnScroll={true}
                detectedDiseases={detectedDiseases}
                zoomLevel={zoomLevel}
              />
            </div>
          </div>
        );
      },
    );
  };

  const renderAnnotations = () => {
    if (annotations.length === 0) return null;

    return (
      <Card className="border-l-4 border-l-[#262626]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-5 h-5 bg-indigo-500 rounded"></div>
              Sequence Features ({annotations.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAnnotationModalOpen(true);
              }}
              className="bg-neutral-50 hover:bg-neutral-100 text-[rgba(255,255,255,1)] border-neutral-300 flex items-center gap-1 h-9 px-3 py-2 rounded-lg m-[0px]"
            >
              <div className="h-4 w-4 flex items-center justify-center pt-[0px] pr-[4px] pb-[0px] pl-[0px]">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 15 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.05733 1.39067C7.80734 1.1406 7.46826 1.00008 7.11467 1H2.33333C1.97971 1 1.64057 1.14048 1.39052 1.39052C1.14048 1.64057 1 1.97971 1 2.33333V7.11467C1.00008 7.46826 1.1406 7.80734 1.39067 8.05733L7.19333 13.86C7.49634 14.1611 7.90616 14.3301 8.33333 14.3301C8.7605 14.3301 9.17032 14.1611 9.47333 13.86L13.86 9.47333C14.1611 9.17032 14.3301 8.7605 14.3301 8.33333C14.3301 7.90616 14.1611 7.49634 13.86 7.19333L8.05733 1.39067Z"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="4.5"
                    cy="4.5"
                    r="0.5"
                    fill="white"
                    stroke="white"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              Add Annotation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                  selectedAnnotation === annotation.id
                    ? "bg-blue-50 dark:bg-gray-800 border-blue-300 dark:border-blue-700 shadow-md"
                    : "bg-white dark:bg-[#161618] hover:bg-gray-50 dark:hover:bg-gray-750 border-gray-200 dark:border-gray-700"
                }`}
                onClick={() =>
                  setSelectedAnnotation(annotation.id)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div
                      className="w-2 h-4 rounded-full shadow-sm pt-6"
                      style={{
                        backgroundColor: annotation.color,
                      }}
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {annotation.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs"
                        >
                          {annotation.type}
                        </Badge>
                        {annotation.direction && (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {annotation.direction === "forward"
                              ? "→"
                              : "←"}{" "}
                            {annotation.direction}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Position:{" "}
                        {annotation.start.toLocaleString()} -{" "}
                        {annotation.end.toLocaleString()}
                        <span className="ml-2 text-gray-500">
                          (
                          {(
                            annotation.end -
                            annotation.start +
                            1
                          ).toLocaleString()}{" "}
                          bp)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {(
                        ((annotation.end -
                          annotation.start +
                          1) /
                          sequence.length) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      of sequence
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#2C2D48] to-[#31324B] dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col w-full">
            <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
              {name}
            </h2>
            <div className="flex items-center space-x-4 mt-1">
              <Badge
                variant="outline"
                className="bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700"
              >
                {sequenceType.toUpperCase()}
              </Badge>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {sequence.length.toLocaleString()} bp
              </span>
              {sequenceType !== "protein" && (
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  GC:{" "}
                  {Math.round(
                    ((sequence.match(/[GCgc]/g)?.length || 0) /
                      sequence.length) *
                      100,
                  )}
                  %
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start md:items-end space-x-2 pt-4 w-full justify-start md:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="text-[rgba(255,255,255,1)] bg-[rgba(255,255,255,1)] rounded-[8px]"
              onClick={handleCopySequence}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[rgba(255,255,255,1)] bg-[rgba(255,255,255,1)] rounded-[8px]"
              onClick={handleExportSequence}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* View Controls */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="view-select"
                  className="text-sm font-medium"
                >
                  View:
                </Label>
                <Select
                  value={currentView}
                  onValueChange={(
                    value: "linear" | "circular",
                  ) => handleInternalViewModeChange(value)}
                  disabled={isViewModeChanging || isOptimizing}
                >
                  <SelectTrigger
                    className="w-32"
                    id="view-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#161618] dark:border-[#292929]">
                    <SelectItem value="linear">
                      Linear
                      {isLargeSequence &&
                        currentView === "linear" && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (Optimized)
                          </span>
                        )}
                    </SelectItem>
                    <SelectItem value="circular">
                      Circular
                      {isVeryLargeSequence && (
                        <span className="text-xs text-orange-500 ml-1">
                          (May be slow)
                        </span>
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {isViewModeChanging && (
                  <Badge
                    variant="secondary"
                    className="animate-pulse"
                  >
                    Switching...
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="zoom-slider"
                  className="text-sm font-medium"
                >
                  Zoom:
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setZoomLevel(Math.max(8, zoomLevel - 2))
                    }
                    disabled={zoomLevel <= 8}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Slider
                    id="zoom-slider"
                    value={[zoomLevel]}
                    onValueChange={([value]) =>
                      setZoomLevel(value)
                    }
                    min={8}
                    max={24}
                    step={1}
                    className="w-24"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setZoomLevel(Math.min(24, zoomLevel + 2))
                    }
                    disabled={zoomLevel >= 24}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-mono w-8 text-center">
                    {zoomLevel}px
                  </span>
                  {isLargeSequence && zoomLevel > 16 && (
                    <span className="text-xs text-orange-600 dark:text-orange-400 ml-2">
                      (High zoom may slow performance)
                    </span>
                  )}
                </div>
              </div>

              {currentView === "linear" && (
                <div className="flex items-center space-x-2">
                  <Label
                    htmlFor="bases-per-line"
                    className="text-sm font-medium"
                  >
                    Bases/line:
                  </Label>
                  <Select
                    value={basesPerLine.toString()}
                    onValueChange={(value) =>
                      setBasesPerLine(parseInt(value))
                    }
                  >
                    <SelectTrigger
                      className="w-20"
                      id="bases-per-line"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="60">60</SelectItem>
                      <SelectItem value="80">80</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Display Options */}
            {currentView === "linear" && (
              <div className="flex flex-wrap items-center gap-6 pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-complement"
                    checked={internalShowComplement}
                    onCheckedChange={(value) =>
                      handleFeatureToggle("complement", value)
                    }
                    disabled={
                      sequenceType === "protein" || isOptimizing
                    }
                  />
                  <Label
                    htmlFor="show-complement"
                    className="text-sm"
                  >
                    Complement
                    {isVeryLargeSequence &&
                      internalShowComplement && (
                        <span className="text-xs text-orange-500 ml-1">
                          (slow)
                        </span>
                      )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-translation"
                    checked={showTranslation}
                    onCheckedChange={(value) =>
                      handleFeatureToggle("translation", value)
                    }
                    disabled={
                      sequenceType === "protein" ||
                      isVeryLargeSequence ||
                      isOptimizing
                    }
                  />
                  <Label
                    htmlFor="show-translation"
                    className="text-sm"
                  >
                    Translation
                    {isVeryLargeSequence && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (disabled for large seq)
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-ruler"
                    checked={showRuler}
                    onCheckedChange={(value) =>
                      handleFeatureToggle("ruler", value)
                    }
                    disabled={isOptimizing}
                  />
                  <Label
                    htmlFor="show-ruler"
                    className="text-sm"
                  >
                    Ruler
                    {isLargeSequence && showRuler && (
                      <span className="text-xs text-yellow-500 ml-1">
                        (may impact performance)
                      </span>
                    )}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      isVeryLargeSequence
                        ? "Search disabled for very large sequences"
                        : "Search in sequence..."
                    }
                    value={searchTerm}
                    onChange={(e) =>
                      setSearchTerm(e.target.value)
                    }
                    className="w-48"
                    disabled={
                      isVeryLargeSequence || isOptimizing
                    }
                  />
                  {searchTerm && !isVeryLargeSequence && (
                    <Badge
                      variant="secondary"
                      className="text-xs"
                    >
                      {(() => {
                        const matches =
                          sequence.match(
                            new RegExp(searchTerm, "gi"),
                          ) || [];
                        const matchCount = matches.length;
                        return isLargeSequence &&
                          matchCount > 100
                          ? `${matchCount} matches (showing first 100)`
                          : `${matchCount} matches`;
                      })()}
                    </Badge>
                  )}
                  {isVeryLargeSequence && (
                    <Badge
                      variant="outline"
                      className="text-xs text-muted-foreground"
                    >
                      Search disabled
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sequence Display */}
      <Card className="overflow-hidden">
        <CardContent className="p-[0px]">
          <div
            ref={sequenceRef}
            className="max-h-[600px] overflow-auto"
            style={{
              scrollbarGutter: "stable",
            }}
          >
            {isOptimizing || isViewModeChanging ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    {isViewModeChanging
                      ? "Switching view mode..."
                      : "Optimizing sequence display..."}
                  </p>
                  {isLargeSequence && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Large sequence detected - this may take a
                      moment
                    </p>
                  )}
                </div>
              </div>
            ) : currentView === "linear" ? (
              renderLinearView()
            ) : (
              renderCircularView()
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Length */}
        <div className="relative bg-[#161618] flex flex-col justify-between p-4 h-[110px] rounded-[8px]">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[8px] border-l-2 border-[#67cc58] pointer-events-none"
          />
          <p className="text-[16px] text-white">LENGTH</p>
          <div className="flex items-end gap-1.5 text-white">
            <p className="text-[32px] font-normal leading-[32px]">
              {sequence.length.toLocaleString()}
            </p>
            <span className="text-[12px] leading-[16px]">
              bases
            </span>
          </div>
        </div>

        {/* Type */}
        <div className="relative bg-[#161618] flex flex-col justify-between p-4 h-[110px] rounded-[8px]">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[8px] border-l-2 border-[#a77edd] pointer-events-none"
          />
          <p className="text-[16px] text-white">TYPE</p>
          <div className="flex items-end gap-1.5 text-white">
            <p className="text-[32px] font-normal leading-[32px]">
              {sequenceType.toUpperCase()}
            </p>
            <span className="text-[12px] leading-[16px]">
              sequence
            </span>
          </div>
        </div>

        {/* GC Content */}
        {sequenceType !== "protein" && (
          <div className="relative bg-[#161618] flex flex-col justify-between p-4 h-[110px] rounded-[8px]">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-[8px] border-l-2 border-[#d25a38] pointer-events-none"
            />
            <p className="text-[16px] text-white">GC CONTENT</p>
            <div className="flex items-end gap-1.5 text-white">
              <p className="text-[32px] font-normal leading-[32px]">
                {Math.round(
                  ((sequence.match(/[GCgc]/g)?.length || 0) /
                    sequence.length) *
                    100,
                )}
                %
              </p>
              <span className="text-[12px] leading-[16px]">
                G+C bases
              </span>
            </div>
          </div>
        )}

        {/* Annotations */}
        <div className="relative bg-[#161618] flex flex-col justify-between p-4 h-[110px] rounded-[8px]">
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[8px] border-l-2 border-[#63acea] pointer-events-none"
          />
          <p className="text-[16px] text-white">ANNOTATIONS</p>
          <div className="flex items-end gap-1.5 text-white">
            <p className="text-[32px] font-normal leading-[32px]">
              {annotations.length}
            </p>
            <span className="text-[12px] leading-[16px]">
              features
            </span>
          </div>
        </div>
      </div>

      {/* Annotations */}
      {renderAnnotations()}

      {/* Annotation Modal */}
      <Dialog
        open={isAnnotationModalOpen}
        onOpenChange={setIsAnnotationModalOpen}
      >
        <DialogContent className="max-w-md bg-black border-gray-800">
          <DialogHeader className="bg-black border-b border-gray-800">
            <DialogTitle className="text-white">
              Add New Annotation
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Create a new annotation to mark features in your
              sequence.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-white">
            <div className="space-y-2">
              <Label htmlFor="ann-name" className="text-white">
                Name
              </Label>
              <Input
                id="ann-name"
                value={annotationFormData.name}
                onChange={(e) =>
                  setAnnotationFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Annotation name"
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="ann-start"
                  className="text-white"
                >
                  Start Position
                </Label>
                <Input
                  id="ann-start"
                  type="number"
                  min="1"
                  max={sequence.length}
                  value={annotationFormData.start}
                  onChange={(e) =>
                    setAnnotationFormData((prev) => ({
                      ...prev,
                      start: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ann-end" className="text-white">
                  End Position
                </Label>
                <Input
                  id="ann-end"
                  type="number"
                  min="1"
                  max={sequence.length}
                  value={annotationFormData.end}
                  onChange={(e) =>
                    setAnnotationFormData((prev) => ({
                      ...prev,
                      end: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ann-type" className="text-white">
                Type
              </Label>
              <Select
                value={annotationFormData.type}
                onValueChange={handleAnnotationTypeChange}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 text-white">
                  {annotationTypes.map((type) => (
                    <SelectItem
                      key={type.value}
                      value={type.value}
                      className="text-white hover:bg-gray-700 focus:bg-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{
                            backgroundColor: type.color,
                          }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="ann-direction"
                className="text-white"
              >
                Direction
              </Label>
              <Select
                value={annotationFormData.direction}
                onValueChange={(value: any) =>
                  setAnnotationFormData((prev) => ({
                    ...prev,
                    direction: value,
                  }))
                }
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600 text-white">
                  <SelectItem
                    value="forward"
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    Forward →
                  </SelectItem>
                  <SelectItem
                    value="reverse"
                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                  >
                    Reverse ←
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="ann-description"
                className="text-white"
              >
                Description (Optional)
              </Label>
              <Textarea
                id="ann-description"
                value={annotationFormData.description}
                onChange={(e) =>
                  setAnnotationFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional description"
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={handleAnnotationModalClose}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleAnnotationSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Add Annotation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};