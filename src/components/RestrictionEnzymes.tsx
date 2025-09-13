import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Scissors, Dna } from "lucide-react";
import type { Annotation } from "./SeqViewer";

export interface RestrictionEnzyme {
  name: string;
  sequence: string;
  cutPosition: number; // Position within the recognition sequence where cut occurs
  overhang: "blunt" | "5prime" | "3prime";
  supplier: string;
  description: string;
  isoschizomers?: string[];
}

export interface CutSite {
  enzyme: RestrictionEnzyme;
  position: number;
  sequence: string;
  context: string;
}

// Common restriction enzymes database
export const RESTRICTION_ENZYMES: RestrictionEnzyme[] = [
  {
    name: "EcoRI",
    sequence: "GAATTC",
    cutPosition: 1,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Commonly used cloning enzyme",
  },
  {
    name: "HindIII",
    sequence: "AAGCTT",
    cutPosition: 1,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Classic restriction enzyme",
  },
  {
    name: "HaeIII",
    sequence: "GGCC",
    cutPosition: 2,
    overhang: "blunt",
    supplier: "Multiple",
    description: "Blunt end cutter",
  },
  {
    name: "KpnI",
    sequence: "GGTACC",
    cutPosition: 5,
    overhang: "3prime",
    supplier: "Multiple",
    description: "Single cut in many vectors",
  },
  {
    name: "XhoI",
    sequence: "CTCGAG",
    cutPosition: 1,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Compatible with SalI",
  },
  {
    name: "TaqI",
    sequence: "TCGA",
    cutPosition: 1,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Thermostable enzyme",
  },
  {
    name: "EcoRV",
    sequence: "GATATC",
    cutPosition: 3,
    overhang: "blunt",
    supplier: "Multiple",
    description: "Blunt end cutter",
  },
  {
    name: "SalI",
    sequence: "GTCGAC",
    cutPosition: 1,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Compatible with XhoI",
  },
  {
    name: "XbaI",
    sequence: "TCTAGA",
    cutPosition: 1,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Common cloning site",
  },
  {
    name: "ClaI",
    sequence: "ATCGAT",
    cutPosition: 2,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Methylation sensitive",
  },
  {
    name: "SacI",
    sequence: "GAGCTC",
    cutPosition: 5,
    overhang: "3prime",
    supplier: "Multiple",
    description: "Common in MCS",
  },
  {
    name: "AluI",
    sequence: "AGCT",
    cutPosition: 2,
    overhang: "blunt",
    supplier: "Multiple",
    description: "Frequent cutter",
  },
  {
    name: "PvuII",
    sequence: "CAGCTG",
    cutPosition: 3,
    overhang: "blunt",
    supplier: "Multiple",
    description: "Blunt end cutter",
  },
  {
    name: "SphI",
    sequence: "GCATGC",
    cutPosition: 5,
    overhang: "3prime",
    supplier: "Multiple",
    description: "Rare cutter",
  },
  {
    name: "BglII",
    sequence: "AGATCT",
    cutPosition: 1,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Compatible with BamHI",
  },
  {
    name: "BamHI",
    sequence: "GGATCC",
    cutPosition: 1,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Very common cloning enzyme",
  },
  {
    name: "NotI",
    sequence: "GCGGCCGC",
    cutPosition: 2,
    overhang: "5prime",
    supplier: "Multiple",
    description: "Rare cutter, 8bp recognition",
  },
  {
    name: "SmaI",
    sequence: "CCCGGG",
    cutPosition: 3,
    overhang: "blunt",
    supplier: "Multiple",
    description: "Blunt end cutter",
  },
  {
    name: "PstI",
    sequence: "CTGCAG",
    cutPosition: 5,
    overhang: "3prime",
    supplier: "Multiple",
    description: "Common in MCS",
  },
  {
    name: "SacII",
    sequence: "CCGCGG",
    cutPosition: 4,
    overhang: "blunt",
    supplier: "Multiple",
    description: "Rare cutter",
  },
];

export class RestrictionEnzymeAnalyzer {
  static findCutSites(
    sequence: string,
    enzymes: RestrictionEnzyme[] = RESTRICTION_ENZYMES,
  ): CutSite[] {
    const cutSites: CutSite[] = [];
    const upperSeq = sequence.toUpperCase();

    for (const enzyme of enzymes) {
      const recognition = enzyme.sequence.toUpperCase();
      let index = 0;

      while (
        (index = upperSeq.indexOf(recognition, index)) !== -1
      ) {
        const context = upperSeq.slice(
          Math.max(0, index - 10),
          Math.min(
            upperSeq.length,
            index + recognition.length + 10,
          ),
        );

        cutSites.push({
          enzyme,
          position: index,
          sequence: recognition,
          context,
        });

        index += 1; // Move one position forward to find overlapping sites
      }
    }

    return cutSites.sort((a, b) => a.position - b.position);
  }

  static createAnnotationsFromCutSites(
    cutSites: CutSite[],
  ): Annotation[] {
    return cutSites.map((site, index) => ({
      id: `cutsite-${site.enzyme.name}-${index}`,
      start: site.position + 1,
      end: site.position + site.enzyme.sequence.length,
      name: `${site.enzyme.name} site`,
      type: "custom",
      color: getEnzymeColor(site.enzyme.overhang),
      direction: "forward",
    }));
  }

  static groupCutSitesByEnzyme(
    cutSites: CutSite[],
  ): Map<string, CutSite[]> {
    const grouped = new Map<string, CutSite[]>();

    for (const site of cutSites) {
      const enzymeName = site.enzyme.name;
      if (!grouped.has(enzymeName)) {
        grouped.set(enzymeName, []);
      }
      grouped.get(enzymeName)!.push(site);
    }

    return grouped;
  }

  static generateCutSiteReport(cutSites: CutSite[]): string {
    const grouped = this.groupCutSitesByEnzyme(cutSites);
    const lines: string[] = [];

    lines.push(
      "This sequence is cut by the following restriction enzymes (positions are 1-based, number of sites per enzyme in parentheses):",
    );

    // Sort enzymes by name
    const sortedEnzymes = Array.from(grouped.entries()).sort(
      (a, b) => a[0].localeCompare(b[0]),
    );

    for (const [enzymeName, sites] of sortedEnzymes) {
      const positions = sites
        .map((site) => site.position + 1)
        .sort((a, b) => a - b);
      lines.push(
        `${enzymeName}: [${positions.join(", ")}] (${sites.length} site${sites.length > 1 ? "s" : ""})`,
      );
    }

    lines.push("");
    lines.push(`Total restriction sites: ${cutSites.length}`);

    return lines.join("\n");
  }
}

function getEnzymeColor(overhang: string): string {
  switch (overhang) {
    case "blunt":
      return "#6B7280"; // Gray
    case "5prime":
      return "#3B82F6"; // Blue
    case "3prime":
      return "#8B5CF6"; // Purple
    default:
      return "#6B7280";
  }
}

export interface RestrictionEnzymeAnalysisProps {
  sequence: string;
  onCutSitesDetected?: (annotations: Annotation[]) => void;
}

export const RestrictionEnzymeAnalysis: React.FC<
  RestrictionEnzymeAnalysisProps
> = ({ sequence, onCutSitesDetected }) => {
  const [cutSites, setCutSites] = React.useState<CutSite[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const analyzeCutSites = React.useCallback(() => {
    if (!sequence) return;

    setIsAnalyzing(true);

    // Simulate analysis delay for better UX
    setTimeout(() => {
      const detectedCutSites =
        RestrictionEnzymeAnalyzer.findCutSites(sequence);
      setCutSites(detectedCutSites);

      const annotations =
        RestrictionEnzymeAnalyzer.createAnnotationsFromCutSites(
          detectedCutSites,
        );
      onCutSitesDetected?.(annotations);

      setIsAnalyzing(false);
    }, 300);
  }, [sequence, onCutSitesDetected]);

  React.useEffect(() => {
    analyzeCutSites();
  }, [analyzeCutSites]);

  const groupedCutSites = React.useMemo(
    () =>
      RestrictionEnzymeAnalyzer.groupCutSitesByEnzyme(cutSites),
    [cutSites],
  );

  const report = React.useMemo(
    () =>
      RestrictionEnzymeAnalyzer.generateCutSiteReport(cutSites),
    [cutSites],
  );

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 animate-pulse" />
            Analyzing Restriction Sites...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          Restriction Enzyme Analysis
          {cutSites.length > 0 && (
            <Badge variant="secondary">
              {cutSites.length} sites found
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cutSites.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Scissors className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>
              No restriction enzyme recognition sites found in
              this sequence.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Report */}

            {/* Enzyme Details */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from(groupedCutSites.entries())
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([enzymeName, sites]) => {
                    const enzyme = sites[0].enzyme;
                    return (
                      <div
                        key={enzymeName}
                        className="border rounded-lg p-3 bg-card"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium">
                            {enzymeName}
                          </h5>
                          <div className="flex gap-1">
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: getEnzymeColor(
                                  enzyme.overhang,
                                ),
                                color: getEnzymeColor(
                                  enzyme.overhang,
                                ),
                              }}
                            >
                              {enzyme.overhang}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-xs text-[rgba(103,204,88,1)]"
                            >
                              {sites.length}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>
                            <strong>Recognition:</strong>{" "}
                            <code className="bg-muted px-1 py-0.5 rounded text-xs">
                              {enzyme.sequence}
                            </code>
                          </div>
                          <div>
                            <strong>Positions:</strong>{" "}
                            {sites
                              .map((site) => site.position + 1)
                              .sort((a, b) => a - b)
                              .join(", ")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Legend */}
            <div className="border-t pt-4">
              <h5 className="font-medium mb-2">Legend</h5>
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{
                      backgroundColor: getEnzymeColor("blunt"),
                    }}
                  />
                  <span>Blunt end</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{
                      backgroundColor: getEnzymeColor("5prime"),
                    }}
                  />
                  <span>5' overhang</span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{
                      backgroundColor: getEnzymeColor("3prime"),
                    }}
                  />
                  <span>3' overhang</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};