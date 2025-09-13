import React from "react";
import { LinearProps } from "./types";

/**
 * Linear sequence viewer that matches Talindrew appearance exactly
 */
export const Linear: React.FC<LinearProps> = ({
  annotations = [],
  bpColors = {},
  bpsPerBlock = 60,
  seq,
  compSeq,
  showComplement,
  showIndex,
  seqFontSize = 12,
  inputRef,
  handleMouseEvent,
  search = [],
}) => {
  const seqLength = seq.length;
  const blocks = Math.ceil(seqLength / bpsPerBlock);

  // Genetic code for translation
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

  // Amino acid colors
  const aaColors: { [key: string]: string } = {
    F: "#FF6B6B",
    L: "#4ECDC4",
    S: "#45B7D1",
    Y: "#96CEB4",
    C: "#FECA57",
    W: "#FF9FF3",
    P: "#54A0FF",
    H: "#5F27CD",
    Q: "#00D2D3",
    R: "#FF9F43",
    I: "#10AC84",
    M: "#EE5A24",
    T: "#F79F1F",
    N: "#A3CB38",
    K: "#D63031",
    V: "#74B9FF",
    A: "#FDCB6E",
    D: "#6C5CE7",
    E: "#FD79A8",
    G: "#55A3FF",
    "*": "#DDD",
  };

  const translateSequence = (
    sequence: string,
    frame: number = 0,
  ): string => {
    let protein = "";
    for (let i = frame; i < sequence.length - 2; i += 3) {
      const codon = sequence.substring(i, i + 3).toUpperCase();
      if (codon.length === 3) {
        protein += geneticCode[codon] || "X";
      }
    }
    return protein;
  };

  const renderSequenceBlock = (blockIndex: number) => {
    const start = blockIndex * bpsPerBlock;
    const end = Math.min(start + bpsPerBlock, seqLength);
    const blockSeq = seq.substring(start, end).toUpperCase();
    const blockComp = compSeq
      ? compSeq.substring(start, end).toUpperCase()
      : "";

    // Translation for ORF1 (frame 0)
    const translation = translateSequence(seq, 0);
    const blockTranslation = translation.substring(
      Math.floor(start / 3),
      Math.floor(end / 3),
    );

    return (
      <div
        key={blockIndex}
        className="sequence-block"
        style={{
          marginBottom: "20px",
          padding: "10px",
          backgroundColor: "var(--background)",
          borderRadius: "6px",
          border: "1px solid var(--border)",
        }}
      >
        {/* Position ruler */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "4px",
            fontSize: "10px",
            color: "var(--muted-foreground)",
          }}
        >
          <div style={{ width: "40px" }}></div>
          {Array.from(
            { length: Math.ceil(blockSeq.length / 10) },
            (_, i) => {
              const pos = start + i * 10 + 1;
              return (
                <div
                  key={i}
                  style={{
                    width: `${10 * (seqFontSize * 0.6)}px`,
                    textAlign: "center",
                    borderRight:
                      i < Math.ceil(blockSeq.length / 10) - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  {pos <= seqLength ? pos : ""}
                </div>
              );
            },
          )}
        </div>

        {/* Tick marks */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <div style={{ width: "40px" }}></div>
          <div
            style={{
              width: `${blockSeq.length * (seqFontSize * 0.6)}px`,
              height: "8px",
              position: "relative",
              borderTop: "1px solid var(--border)",
            }}
          >
            {Array.from(
              { length: Math.floor(blockSeq.length / 10) + 1 },
              (_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${i * 10 * (seqFontSize * 0.6)}px`,
                    top: "-3px",
                    width: "1px",
                    height: "6px",
                    backgroundColor: "var(--border)",
                  }}
                />
              ),
            )}
          </div>
        </div>

        {/* ORF1 Translation track */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "2px",
          }}
        >
          <div
            style={{
              width: "35px",
              fontSize: "9px",
              color: "var(--muted-foreground)",
              textAlign: "right",
              marginRight: "5px",
            }}
          >
            ORF 1
          </div>
          <div
            style={{
              fontFamily:
                'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
              fontSize: `${Math.max(seqFontSize - 1, 10)}px`,
              letterSpacing: `${seqFontSize * 0.05}px`,
              display: "flex",
            }}
          >
            {blockTranslation.split("").map((aa, i) => {
              const globalPos = Math.floor((start + i * 3) / 3);
              // Calculate width to span exactly 3 bases including their spacing
              const baseWidth = seqFontSize * 0.6; // Approximate width of each base character
              const codonWidth =
                baseWidth * 3 + seqFontSize * 0.1; // 3 bases plus letter spacing
              return (
                <span
                  key={`aa-${globalPos}`}
                  style={{
                    backgroundColor: aaColors[aa] || "#DDD",
                    color: "white",
                    padding: "1px 0px",
                    margin: "0",
                    borderRadius: "2px",
                    width: `${codonWidth}px`,
                    textAlign: "center",
                    fontSize: `${Math.max(seqFontSize - 2, 9)}px`,
                    fontWeight: "bold",
                    display: "inline-block",
                  }}
                  title={`${aa} at position ${globalPos + 1}`}
                >
                  {aa}
                </span>
              );
            })}
          </div>
        </div>

        {/* Annotations tracks */}
        {annotations
          .filter((ann) => ann.start < end && ann.end > start)
          .map((ann, annIndex) => {
            const relativeStart = Math.max(
              0,
              ann.start - start,
            );
            const relativeEnd = Math.min(
              blockSeq.length,
              ann.end - start,
            );
            const width =
              (relativeEnd - relativeStart) *
              (seqFontSize * 0.6);
            const left = relativeStart * (seqFontSize * 0.6);

            return (
              <div
                key={ann.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "2px",
                }}
              >
                <div style={{ width: "40px" }}></div>
                <div
                  style={{
                    width: `${blockSeq.length * (seqFontSize * 0.6)}px`,
                    height: "14px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: `${left}px`,
                      width: "fit-content",
                      height: "14px",
                      backgroundColor: ann.color || "#87CEEB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      color: "var(--foreground)",
                      fontWeight: "bold",
                      borderRadius: "2px",
                      padding: "4px",
                    }}
                  >
                    {width > 30 ? ann.name : ""}
                  </div>
                </div>
              </div>
            );
          })}

        {/* Main DNA sequence */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "2px",
          }}
        >
          <div
            style={{
              width: "35px",
              fontSize: "10px",
              color: "var(--muted-foreground)",
              textAlign: "right",
              marginRight: "5px",
            }}
          >
            {start + 1}
          </div>
          <div
            style={{
              fontFamily:
                'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
              fontSize: `${seqFontSize}px`,
              letterSpacing: `${seqFontSize * 0.05}px`,
              cursor: "text",
              userSelect: "text",
            }}
            data-testid="la-vz-seq"
            onMouseDown={handleMouseEvent}
            onMouseMove={handleMouseEvent}
            onMouseUp={handleMouseEvent}
          >
            {blockSeq.split("").map((base, i) => {
              const globalPos = start + i;
              let color = "var(--foreground)";
              let backgroundColor = "transparent";

              // Base colors
              switch (base) {
                case "A":
                  color = "#FF6B6B";
                  break;
                case "T":
                  color = "#4ECDC4";
                  break;
                case "G":
                  color = "#45B7D1";
                  break;
                case "C":
                  color = "#96CEB4";
                  break;
              }

              // Search highlighting
              if (search.length > 0) {
                const isInSearch = search.some(
                  (s) =>
                    globalPos >= s.start && globalPos < s.end,
                );
                if (isInSearch) {
                  backgroundColor = "rgba(255, 235, 59, 0.6)";
                }
              }

              return (
                <span
                  key={globalPos}
                  style={{
                    color,
                    backgroundColor,
                    letterSpacing: "0.2em",
                  }}
                  title={`Position ${globalPos + 1}: ${base}`}
                >
                  {base}
                </span>
              );
            })}
          </div>
          <div
            style={{
              width: "35px",
              fontSize: "10px",
              color: "var(--muted-foreground)",
              textAlign: "left",
              marginLeft: "5px",
            }}
          >
            {end}
          </div>
        </div>

        {/* Complement sequence */}
        {showComplement && blockComp && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "35px",
                fontSize: "10px",
                color: "var(--muted-foreground)",
                textAlign: "right",
                marginRight: "5px",
              }}
            >
              {end}
            </div>
            <div
              style={{
                fontFamily:
                  'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                fontSize: `${seqFontSize}px`,
                letterSpacing: `${seqFontSize * 0.05}px`,
                opacity: 0.7,
                cursor: "text",
                userSelect: "text",
              }}
              data-testid="la-vz-comp-seq"
            >
              {blockComp.split("").map((base, i) => {
                const globalPos = start + i;
                let color = "var(--foreground)";
                switch (base) {
                  case "A":
                    color = "#FF6B6B";
                    break;
                  case "T":
                    color = "#4ECDC4";
                    break;
                  case "G":
                    color = "#45B7D1";
                    break;
                  case "C":
                    color = "#96CEB4";
                    break;
                }

                return (
                  <span
                    key={`comp-${globalPos}`}
                    style={{ color, letterSpacing: "0.2em" }}
                    title={`Position ${globalPos + 1}: ${base} (complement)`}
                  >
                    {base}
                  </span>
                );
              })}
            </div>
            <div
              style={{
                width: "35px",
                fontSize: "10px",
                color: "var(--muted-foreground)",
                textAlign: "left",
                marginLeft: "5px",
              }}
            >
              {start + 1}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Register for interactions
  React.useEffect(() => {
    if (inputRef) {
      inputRef("linear-seq", {
        start: 0,
        end: seqLength,
        type: "SEQ",
        viewer: "LINEAR",
      });
    }
  }, [inputRef, seqLength]);

  return (
    <div
      className="la-vz-linear-viewer"
      data-testid="la-vz-viewer-linear"
      style={{
        fontFamily:
          'Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
        padding: "20px",
        backgroundColor: "var(--card)",
        borderRadius: "4px",
        maxHeight: "600px",
        overflowY: "auto",
        border: "1px solid var(--border)",
      }}
    >
      {Array.from({ length: blocks }, (_, i) =>
        renderSequenceBlock(i),
      )}
    </div>
  );
};