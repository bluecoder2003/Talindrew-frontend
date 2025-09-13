import React from 'react';

interface EventHandlerProps {
  bpsPerBlock: number;
  children: React.ReactNode;
  copyEvent: (e: React.KeyboardEvent<HTMLElement>) => boolean;
  handleMouseEvent: (e: any) => void;
  selectAllEvent: (e: React.KeyboardEvent<HTMLElement>) => boolean;
  selection: any;
  seq: string;
  setSelection: (selection: any) => void;
}

/**
 * EventHandler handles the routing of all events, including keypresses, mouse clicks, etc.
 */
export class EventHandler extends React.PureComponent<EventHandlerProps> {
  clickedOnce: EventTarget | null = null;
  clickedTwice: EventTarget | null = null;

  /**
   * action handler for a keyboard keypresses.
   */
  handleKeyPress = (e: React.KeyboardEvent<HTMLElement>) => {
    const keyType = this.keypressMap(e);
    if (!keyType) {
      return; // not recognized key
    }
    e.preventDefault();
    this.handleSeqInteraction(keyType);
  };

  /**
   * maps a keypress to an interaction (String)
   */
  keypressMap = (e: React.KeyboardEvent<HTMLElement>) => {
    const { copyEvent, selectAllEvent } = this.props;

    if (copyEvent && copyEvent(e)) {
      return 'Copy';
    }

    if (selectAllEvent && selectAllEvent(e)) {
      return 'SelectAll';
    }

    const { key, shiftKey } = e;
    switch (key) {
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        return shiftKey ? `Shift${key}` : key;
      default:
        return null;
    }
  };

  /**
   * Respond to sequence interactions
   */
  handleSeqInteraction = (type: string) => {
    const { seq, setSelection, selection } = this.props;
    const seqLength = seq.length;
    const bpsPerBlock = this.props.bpsPerBlock || 1;

    switch (type) {
      case 'SelectAll': {
        this.selectAllHotkey();
        break;
      }
      case 'Copy': {
        this.handleCopy();
        break;
      }
      case 'ArrowUp':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ShiftArrowUp':
      case 'ShiftArrowRight':
      case 'ShiftArrowDown':
      case 'ShiftArrowLeft': {
        // Handle arrow key navigation
        const { end, start } = selection;

        if (typeof start === 'undefined' || typeof end === 'undefined') {
          return;
        }

        let newPos = end;
        if (type === 'ArrowUp' || type === 'ShiftArrowUp') {
          if (seqLength / bpsPerBlock > 1) {
            newPos -= bpsPerBlock;
          } else {
            newPos -= 1;
          }
        } else if (type === 'ArrowRight' || type === 'ShiftArrowRight') {
          newPos += 1;
        } else if (type === 'ArrowDown' || type === 'ShiftArrowDown') {
          if (seqLength / bpsPerBlock > 1) {
            newPos += bpsPerBlock;
          } else {
            newPos += 1;
          }
        } else if (type === 'ArrowLeft' || type === 'ShiftArrowLeft') {
          newPos -= 1;
        }

        if (newPos <= -1) {
          newPos = seqLength + newPos;
        }
        if (newPos >= seqLength + 1) {
          newPos -= seqLength;
        }

        const clockwiseDrag = newPos >= start;
        
        if (newPos !== start && !type.startsWith('Shift')) {
          setSelection({
            clockwise: true,
            end: newPos,
            start: newPos,
            type: 'SEQ',
          });
        } else if (type.startsWith('Shift')) {
          setSelection({
            clockwise: clockwiseDrag,
            end: newPos,
            start: start,
            type: 'SEQ',
          });
        }
        break;
      }
      default: {
        break;
      }
    }
  };

  /**
   * Copy the current sequence selection to the user's clipboard
   */
  handleCopy = () => {
    const { selection, seq } = this.props;
    const { end, start } = selection;

    if (!document) return;

    const tempNode = document.createElement('textarea');
    tempNode.value = seq.substring(start || 0, end);
    document.body.appendChild(tempNode);
    tempNode.select();
    document.execCommand('copy');
    tempNode.remove();
  };

  /**
   * select all of the sequence
   */
  selectAllHotkey = () => {
    const { selection, seq, setSelection } = this.props;

    const newSelection = {
      ...selection,
      clockwise: true,
      end: seq.length,
      start: 0,
    };

    setSelection(newSelection);
  };

  /**
   * Handle mouse events
   */
  handleMouseEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const { handleMouseEvent } = this.props;

    if (e.type === 'mouseup') {
      if (this.clickedOnce === e.target && this.clickedTwice === e.target) {
        this.selectAllHotkey();
        this.clickedOnce = null;
        this.clickedTwice = null;
      } else if (this.clickedOnce === e.target && this.clickedTwice === null) {
        this.clickedOnce = e.target;
        this.clickedTwice = e.target;
        setTimeout(() => {
          this.clickedOnce = null;
          this.clickedTwice = null;
        }, 250);
      } else {
        this.clickedOnce = e.target;
        setTimeout(() => {
          this.clickedOnce = null;
        }, 250);
      }
    }

    const { button, ctrlKey, type } = e;
    const ctxMenuClick = type === 'mousedown' && button === 0 && ctrlKey;

    if (e.button === 0 && !ctxMenuClick) {
      handleMouseEvent(e);
    }
  };

  render = () => (
    <div
      className="la-vz-viewer-event-router"
      id="la-vz-event-router"
      role="presentation"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        outline: 'none',
        position: 'relative',
        width: '100%',
      }}
      tabIndex={-1}
      onKeyDown={this.handleKeyPress}
      onMouseDown={this.handleMouseEvent}
      onMouseMove={this.props.handleMouseEvent}
      onMouseUp={this.handleMouseEvent}
    >
      {this.props.children}
    </div>
  );
}