import { memo, useCallback } from 'react';
import { TreeDataNode } from './types';

interface TreeNodeProps {
  nodeData: TreeDataNode;
  expanded: boolean;
  onToggleExpand: (nodeId: string) => void;
}

const TreeNode = memo(function TreeNode(props: TreeNodeProps) {
  const { nodeData, expanded, onToggleExpand } = props;
  const { id, level, label, childrenIds } = nodeData;

  const hasChildren = childrenIds !== undefined;

  const toggleExpanded = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onToggleExpand(id);
    },
    [onToggleExpand, id]
  );

  return (
    <div className={`default-tree-node`} style={{ paddingLeft: `${level * 16}px` }} onDragEnter={() => {}}>
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
