import React, { useMemo } from "react";
import {
  CentralIndexProvider,
  SelectionProvider,
} from "./contexts";
import { createInputRefFunc } from "./SelectionHandler";
import Circular, { CircularProps } from "./Circular";
import {
  Annotation,
  CutSite,
  Highlight,
  Range,
  Size,
  Coor,
} from "./types";

export interface CompleteCircularViewerProps {
  annotations?: Annotation[];
  compSeq?: string;
  cutSites?: CutSite[];
  highlights?: Highlight[];
  name: string;
  onUnmount?: (id: string) => void;
  radius?: number;
  rotateOnScroll?: boolean;
  search?: Range[];
  seq: string;
  showComplement?: boolean;
  showIndex?: boolean;
  size?: Size;
  width?: number;
  height?: number;
  detectedDiseases?: string[];
  zoomLevel?: number;
}

/**
 * Complete Talindrew-compatible circular viewer with all features
 */
export const CircularViewerComplete: React.FC<
  CompleteCircularViewerProps
> = ({
  annotations = [],
  compSeq,
  cutSites = [],
  highlights = [],
  name,
  onUnmount = () => {},
  radius,
  rotateOnScroll = true,
  search = [],
  seq,
  showComplement = false,
  showIndex = true,
  size,
  width = 500,
  height = 500,
  detectedDiseases = [],
  zoomLevel = 12,
}) => {
  // Generate complement sequence if not provided
  const complement = useMemo(() => {
    if (compSeq) return compSeq;

    const complementMap: { [key: string]: string } = {
      A: "T",
      T: "A",
      G: "C",
      C: "G",
      a: "t",
      t: "a",
      g: "c",
      c: "g",
    };

    return seq
      .split("")
      .map((base) => complementMap[base] || base)
      .reverse()
      .join("");
  }, [seq, compSeq]);

  // Calculate dimensions
  const actualSize: Size = size || { width, height };
  const center: Coor = {
    x: actualSize.width / 2,
    y: actualSize.height / 2,
  };

  // Calculate radius - leave space for annotations and labels
  const calculatedRadius =
    radius ||
    Math.min(actualSize.width, actualSize.height) / 2 - 100;

  // Create input ref function for handling selections
  const inputRef = createInputRefFunc();

  // Dummy mouse event handler - in full implementation this would handle selections
  const handleMouseEvent = (e: any) => {
    // Handle mouse events for selection
    console.log("Mouse event:", e.type);
  };

  const circularProps: CircularProps = {
    annotations,
    center,
    compSeq: complement,
    cutSites,
    handleMouseEvent,
    highlights,
    inputRef,
    name,
    onUnmount,
    radius: calculatedRadius,
    rotateOnScroll,
    search,
    seq,
    showComplement,
    showIndex,
    size: actualSize,
    yDiff: 0,
    zoomLevel,
  };

  return (
    <CentralIndexProvider>
      <SelectionProvider>
        <div
          style={{
            width: actualSize.width,
            height: actualSize.height,
            position: "relative",
            color: "white",
          }}
        >
          <Circular {...circularProps} />

          {/* Disease Detection Overlay - Top Right Corner */}
          {detectedDiseases.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "#321010",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold",
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
                maxWidth: "200px",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  marginBottom: "4px",
                  fontSize: "11px",
                  color: "white",
                }}
              >
                ⚠️ DISEASE DETECTED
              </div>
              <div
                style={{
                  fontSize: "11px",
                  lineHeight: "1.3",
                  color: "white",
                }}
              >
                {detectedDiseases.join(", ")}
              </div>
            </div>
          )}
        </div>
      </SelectionProvider>
    </CentralIndexProvider>
  );
};