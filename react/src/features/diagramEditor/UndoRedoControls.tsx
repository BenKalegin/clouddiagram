import React from 'react';
import { useRecoilValue } from 'recoil';
import { activeDiagramIdAtom } from '../diagramTabs/diagramTabsModel';
import { canRedoSelector, canUndoSelector } from './historyModel';
import { useUndoRedo } from './historySlice';

// Styles for the undo/redo buttons
const buttonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  margin: '0 4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const disabledButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  opacity: 0.5,
  cursor: 'default'
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px'
};

// SVG icons for undo and redo
const UndoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 3L4 7L8 11V8C11.3 8 14 10.7 14 14C14 10.7 11.3 5 8 5V3Z" />
  </svg>
);

const RedoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 3L12 7L8 11V8C4.7 8 2 10.7 2 14C2 10.7 4.7 5 8 5V3Z" />
  </svg>
);

export const UndoRedoControls: React.FC = () => {
  const { undo, redo } = useUndoRedo();
  const activeDiagramId = useRecoilValue(activeDiagramIdAtom);
  const canUndo = useRecoilValue(canUndoSelector(activeDiagramId));
  const canRedo = useRecoilValue(canRedoSelector(activeDiagramId));

  const handleUndo = () => {
    if (canUndo) {
      undo();
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      redo();
    }
  };

  return (
    <div style={containerStyle}>
      <button
        title="Undo (Ctrl+Z)"
        onClick={handleUndo}
        style={canUndo ? buttonStyle : disabledButtonStyle}
        disabled={!canUndo}
      >
        <UndoIcon />
      </button>
      <button
        title="Redo (Ctrl+Y)"
        onClick={handleRedo}
        style={canRedo ? buttonStyle : disabledButtonStyle}
        disabled={!canRedo}
      >
        <RedoIcon />
      </button>
    </div>
  );
};

export default UndoRedoControls;
