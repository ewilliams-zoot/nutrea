import { memo, useCallback, useEffect, useRef } from 'react';
import { TreeDataNode } from './types';

interface TreeRowProps {
  children: React.ReactElement;
  nodeData: TreeDataNode;
  expanded: boolean;
  focused: boolean;
  selected: boolean;
  onNodeMoved: (nodeId: string, fromParentId: string, toParentId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

const TreeRow: React.FC<TreeRowProps> = memo(function TreeRow({
  children,
  nodeData,
  onNodeMoved,
  expanded,
  focused,
  selected,
  onToggleExpand,
  onSelectNode
}) {
  const { id, parentId } = nodeData;
  const nodeElem = useRef<HTMLDivElement | null>(null);

  const startDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData(`dragdata-id-${id}`, id); // for dragover valid drop checking
      e.dataTransfer.setData(`dragdata/id`, id);

      if (parentId) {
        e.dataTransfer.setData('dragdata/parentId', parentId);
      }
    },
    [id, parentId]
  );

  const checkCanDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    // const dragType = e.dataTransfer.types.find((type) => type.startsWith('dragtype-'));
    // if (acceptDropTypes !== undefined && dragType && acceptDropTypes.has(dragType)) {
    e.preventDefault();
    // e.dataTransfer.dropEffect = 'move';
    // }
  }, []);

  const drop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const dragId = e.dataTransfer.getData('dragdata/id');
      const fromParentId = e.dataTransfer.getData('dragdata/parentId');
      if (dragId && fromParentId) {
        onNodeMoved(dragId, fromParentId, id);
        onSelectNode(id);

        if (!expanded) {
          onToggleExpand(id);
        }
      }
      e.preventDefault();
    },
    [id, onNodeMoved, onSelectNode, onToggleExpand, expanded]
  );

  useEffect(() => {
    if (nodeElem.current && focused) {
      nodeElem.current?.focus({ preventScroll: true });
    }
  }, [focused]);

  return (
    <div
      className={`tree-row ${selected ? 'selected' : ''}`}
      ref={nodeElem}
      onDrop={drop}
      onDragOver={checkCanDrop}
      draggable="true"
      onDragStart={startDrag}
      tabIndex={-1}
      onFocus={(e) => e.stopPropagation()}
      onClick={() => onSelectNode(nodeData.id)}
    >
      {children}
    </div>
  );
});

export default TreeRow;
