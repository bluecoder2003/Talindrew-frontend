import React from 'react';

interface Selection {
  clockwise?: boolean;
  end?: number;
  start?: number;
  type?: string;
  ref?: string;
}

interface SelectionHandlerProps {
  bpsPerBlock: number;
  children: (
    inputRef: (id: string, ref: any) => any,
    handleMouseEvent: (e: React.MouseEvent) => void,
    onUnmount: (ref: string) => void
  ) => React.ReactNode;
  seq: string;
  setSelection: (selection: Selection) => void;
}

/**
 * SelectionHandler handles sequence selection. Each click, drag, etc, is
 * noted and mapped to a sequence index.
 */
export default class SelectionHandler extends React.PureComponent<SelectionHandlerProps> {
  static displayName = 'SelectionHandler';

  /** Only state is the selection range */
  state = { 
    start: 0,
    end: 0,
    clockwise: true,
  };

  /* is the user currently dragging */
  dragEvent = false;

  /* was the last selection action a shift click */
  shiftSelection = false;

  /** a map between the id of child elements and their associated SelectRanges */
  idToRange = new Map<string, any>();

  componentDidMount = () => {
    if (!document) return;
    document.addEventListener('mouseup', this.stopDrag);
  };

  componentWillUnmount = () => {
    if (!document) return;
    document.removeEventListener('mouseup', this.stopDrag);
  };

  /** Stop the current drag event from happening */
  stopDrag = () => {
    this.dragEvent = false;
  };

  /**
   * a ref callback for mapping the id of child to its SelectRange
   */
  inputRef = (ref: string, selectRange: any) => {
    this.idToRange.set(ref, { ref, ...selectRange });
  };

  /**
   * remove the ref by ID.
   */
  removeMountedBlock = (ref: string) => {
    this.idToRange.delete(ref);
  };

  /**
   * Handle mouse events for selection
   */
  mouseEvent = (e: React.MouseEvent) => {
    // should not be updating selection since it's not a drag event time
    if ((e.type === 'mousemove' || e.type === 'mouseup') && !this.dragEvent) {
      return;
    }

    let knownRange = this.dragEvent
      ? this.idToRange.get(e.currentTarget.id)
      : this.idToRange.get((e.target as Element).id) || this.idToRange.get(e.currentTarget.id);
      
    if (!knownRange) {
      return;
    }

    knownRange = { ...knownRange, end: knownRange.end || 0, start: knownRange.start || 0 };

    const { end, start, type } = knownRange;
    
    switch (type) {
      case 'ANNOTATION':
      case 'FIND':
      case 'ENZYME':
      case 'HIGHLIGHT': {
        // Annotation or find selection range
        const clockwise = knownRange.direction ? knownRange.direction === 1 : true;
        const selectionStart = clockwise ? start : end;
        const selectionEnd = clockwise ? end : start;

        this.setSelection({
          ...knownRange,
          clockwise: clockwise,
          end: selectionEnd,
          start: selectionStart,
        });

        this.dragEvent = false;
        break;
      }
      case 'SEQ': {
        this.handleLinearSeqEvent(e, { ...knownRange, end: knownRange.end || 0, start: knownRange.start || 0 });
        break;
      }
      default:
    }
  };

  /**
   * Handle a sequence selection on a linear viewer
   */
  handleLinearSeqEvent = (e: React.MouseEvent, knownRange: { end: number; start: number }) => {
    const currBase = this.calculateBaseLinear(e, knownRange);
    const clockwiseDrag = this.state.start !== null && currBase >= this.state.start;

    if (e.type === 'mousedown' && currBase !== null) {
      // this is the start of a drag event
      this.setSelection({
        clockwise: clockwiseDrag,
        end: currBase,
        start: e.shiftKey ? this.state.start : currBase,
      });
      this.dragEvent = true;
    } else if (this.dragEvent && currBase !== null) {
      // continue a drag event that's currently happening
      this.setSelection({
        clockwise: clockwiseDrag,
        end: currBase,
        start: this.state.start,
      });
    }
  };

  /**
   * in a linear sequence viewer, given the bounding box of a component, the basepairs
   * by SeqBlock and the position of the mouse event, find the current base
   */
  calculateBaseLinear = (e: React.MouseEvent, knownRange: { end: number; start: number }) => {
    const { bpsPerBlock } = this.props;

    const block = e.currentTarget.getBoundingClientRect();
    const distFromLeft: number = e.clientX - block.left;
    const ratioFromLeft = distFromLeft / block.width;
    const bpsFromLeft = Math.round(ratioFromLeft * bpsPerBlock);

    return Math.min(knownRange.start + bpsFromLeft, knownRange.end);
  };

  /**
   * Update the selection in state
   */
  setSelection = (newSelection: Selection) => {
    const { setSelection } = this.props;
    
    this.setState(newSelection);
    setSelection({
      ...newSelection,
      type: 'SEQ',
    });
  };

  render() {
    return this.props.children(this.inputRef, this.mouseEvent, this.removeMountedBlock);
  }
}