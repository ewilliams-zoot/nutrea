import './Tree.css';
import { memo, useCallback, useRef } from 'react';
import TreeNode from './TreeNode';
import { useTreeState } from './use_tree_state';
import TreeRow from './TreeRow';
import { TreeProps } from './types';

const Tree = memo(function Tree(props: TreeProps) {
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const { onNodeDragEnd } = props;

  const {
    filteredNodeList,
    selectedNodeId,
    setNewSelectedNode,
    moveNode,
    toggleExpanded,
    expandedNodes,
    focusedNodeId,
    idToIndex,
    virtual,
    navigateWithKeys
  } = useTreeState(scrollableRef, props);

  const detectDragStartAndAttachDragEnd = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      const dragEndHandler = (e: Event) => {
        const nodeId = (e as DragEvent).dataTransfer!.getData('dragdata/id');
        onNodeDragEnd?.(nodeId);
        e.target?.removeEventListener('dragend', dragEndHandler);
      };
      // Add the native listener to prevent React from removing it when the node
      // is scrolled out of a virtualized list.
      e.target.addEventListener('dragend', dragEndHandler);
    },
    [onNodeDragEnd]
  );

  // Accessibility guidelines say that when the tree is focused you must either focus the
  // first node when no item is currently selected, or the currently selected node. To gain focus
  // in a virtual list, we must scroll to the currently selected node.
  const accessibleTreeFocus = useCallback(() => {
    if (selectedNodeId === null) {
      setNewSelectedNode(filteredNodeList[0].id);
    } else {
      virtual.scrollToIndex(idToIndex[selectedNodeId]);
    }
  }, [virtual, setNewSelectedNode, filteredNodeList, idToIndex, selectedNodeId]);

  return (
    <div
      role="tree"
      onKeyDown={navigateWithKeys}
      tabIndex={0}
      ref={scrollableRef}
      style={{ height: '700px', overflow: 'auto' }}
      onFocus={accessibleTreeFocus}
      onDragStart={detectDragStartAndAttachDragEnd}
    >
      <div tabIndex={-1} style={{ position: 'relative', height: `${virtual.getTotalSize()}px`, width: '1800px' }}>
        {virtual.getVirtualItems().map((vi) => (
          <div
            key={vi.index}
            role="tree-item"
            aria-selected={filteredNodeList[vi.index].id === selectedNodeId}
            aria-expanded={
              filteredNodeList[vi.index].childrenIds !== undefined
                ? expandedNodes[filteredNodeList[vi.index].id]
                : undefined
            }
            aria-level={filteredNodeList[vi.index].level + 1}
            style={{ position: 'absolute', width: '100%', height: `${vi.size}px`, left: 0, top: `${vi.start}px` }}
          >
            <TreeRow
              nodeData={filteredNodeList[vi.index]}
              onNodeMoved={moveNode}
              expanded={expandedNodes[filteredNodeList[vi.index].id]}
              focused={focusedNodeId === filteredNodeList[vi.index].id}
              selected={filteredNodeList[vi.index].id === selectedNodeId}
              onToggleExpand={toggleExpanded}
              onSelectNode={setNewSelectedNode}
            >
              <TreeNode
                key={filteredNodeList[vi.index].id}
                nodeData={filteredNodeList[vi.index]}
                expanded={expandedNodes[filteredNodeList[vi.index].id]}
                onToggleExpand={toggleExpanded}
              />
            </TreeRow>
          </div>
        ))}
      </div>
    </div>
  );
});

export default Tree;
