import { memo, useCallback, useEffect, useRef } from 'react';
import { TreeDataOut } from './types';

interface TreeNodeProps {
  nodeData: TreeDataOut;
  expanded: boolean;
  selected: boolean;
  focused: boolean;
  onToggleExpand: (nodeId: string) => void;
  onSelectNode: (nodeId: string) => void;
  onNodeMoved: (nodeId: string, fromParentId: string, toParentId: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

const TreeNode = memo(function TreeNode(props: TreeNodeProps) {
  const { nodeData, expanded, onToggleExpand, onSelectNode, onNodeMoved, selected, onKeyDown, focused } = props;
  const { id, level, label, childrenIds, parentId } = nodeData;
  const nodeElem = useRef<HTMLDivElement | null>(null);

  const hasChildren = childrenIds.length > 0;

  const toggleExpanded = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onToggleExpand(id);
    },
    [onToggleExpand, id]
  );

  const startDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData(`dragdata-id-${id}`, id);
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

  let role;
  if (!parentId) {
    role = 'tree';
  } else {
    role = 'tree-item';
  }

  useEffect(() => {
    if (nodeElem.current && focused) {
      nodeElem.current.parentElement?.focus({ preventScroll: true });
    }
  }, [focused]);

  return (
    <div
      ref={nodeElem}
      aria-selected={selected}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-level={level + 1}
      role={role}
      onClick={() => onSelectNode(nodeData.id)}
      className={`default-tree-node ${selected ? 'selected' : ''}`}
      style={{ paddingLeft: `${level * 16}px` }}
      draggable="true"
      onDragStart={startDrag}
      onDragEnter={() => {}}
      onDragOver={checkCanDrop}
      onDrop={drop}
      onKeyDown={onKeyDown}
    >
      {hasChildren ? (
        <button style={{ width: '24px', marginRight: '8px' }} onClick={toggleExpanded}>
          {expanded ? '-' : '+'}
        </button>
      ) : (
        <div style={{ width: '32px' }}>{'<>'}</div>
      )}
      {label}
    </div>
  );
});

export default TreeNode;
