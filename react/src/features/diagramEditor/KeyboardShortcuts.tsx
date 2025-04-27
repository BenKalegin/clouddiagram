import React, { useEffect } from 'react';
import { useRecoilValue } from 'recoil';
import { activeDiagramIdAtom } from '../diagramTabs/diagramTabsModel';
import { canRedoSelector, canUndoSelector } from './historyModel';
import { useUndoRedo } from './historySlice';

export const KeyboardShortcuts: React.FC = () => {
  const { undo, redo } = useUndoRedo();
  const activeDiagramId = useRecoilValue(activeDiagramIdAtom);
  const canUndo = useRecoilValue(canUndoSelector(activeDiagramId));
  const canRedo = useRecoilValue(canRedoSelector(activeDiagramId));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if the target is an input or textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle Ctrl+Z for undo
      if (event.ctrlKey && event.key === 'z' && !event.shiftKey && canUndo) {
        event.preventDefault();
        undo();
      }

      // Handle Ctrl+Y or Ctrl+Shift+Z for redo
      if (
        (event.ctrlKey && event.key === 'y') ||
        (event.ctrlKey && event.shiftKey && event.key === 'z')
      ) {
        if (canRedo) {
          event.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo]);

  // This component doesn't render anything
  return null;
};

export default KeyboardShortcuts;
