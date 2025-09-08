import { useVirtualizer } from '@tanstack/react-virtual';
import './Tree.css';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { TreeApi, TreeDataNode } from './types';
import TreeNode from './TreeNode';
import { useTreeState } from './use_tree_state';
import TreeRow from './TreeRow';

interface TreeProps {
  rootId: TreeDataNode['id'];
  treeData: TreeDataNode[];
  showRoot?: boolean;
  searchTerm?: string;
  treeRef?: React.RefObject<TreeApi | null>;
  virtualBufferCount?: number;
  onNodeMoved?: (nodeId: string, fromParentId: string, toParentId: string) => void;
}

const Tree = memo(function Tree(props: TreeProps) {
  const { treeData, rootId, treeRef, searchTerm, onNodeMoved, showRoot = false, virtualBufferCount = 0 } = props;
  const viewportRef = useRef(null);

  const { orderedNodeList, selectedNode, setNewSelectedNode, moveNode, toggleExpanded, expandedNodes, focusedNode } =
    useTreeState({ rootId, treeData, onMoveHandler: onNodeMoved, treeRef, searchTerm, showRoot });

  const [prevSelected, setPrevSelected] = useState<string | null>(selectedNode);

  const virtual = useVirtualizer({
    count: orderedNodeList.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 30,
    overscan: virtualBufferCount
  });

  const idToIndex = useMemo(
    () =>
      orderedNodeList.reduce<Record<string, number>>((acc, curr, i) => {
        acc[curr.id] = i;
        return acc;
      }, {}),
    [orderedNodeList]
  );

  if (prevSelected !== selectedNode) {
    const selectedIndex = orderedNodeList.findIndex(({ id }) => id === selectedNode);
    virtual.scrollToIndex(selectedIndex);
    setPrevSelected(selectedNode);
  }

  const dragEnded = useCallback(() => {
    // reset any dragover
  }, []);

  const dragStarted = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      // Add the native listener to prevent React from removing it when the node
      // is scrolled out of a virtualized list.
      e.target.addEventListener('dragend', dragEnded);
    },
    [dragEnded]
  );

  const navigateWithKeys = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const currentNodeId = focusedNode;
      if (currentNodeId === null) {
        setNewSelectedNode(orderedNodeList[0].id);
        virtual.scrollToIndex(0);
        return;
      }

      const currIndex = idToIndex[currentNodeId];
      const currentNodeData = orderedNodeList[currIndex];

      switch (e.key) {
        case 'ArrowDown':
          if (currIndex < orderedNodeList.length - 1) {
            virtual.scrollToIndex(currIndex + 1);
            setNewSelectedNode(orderedNodeList[currIndex + 1].id);
          }
          break;
        case 'ArrowUp':
          if (currIndex > 0) {
            virtual.scrollToIndex(currIndex - 1);
            setNewSelectedNode(orderedNodeList[currIndex - 1].id);
          }
          break;
        case 'ArrowRight':
          if (!expandedNodes[currentNodeId]) {
            toggleExpanded(currentNodeId);
          } else if (currIndex < orderedNodeList.length - 1) {
            virtual.scrollToIndex(currIndex + 1);
            setNewSelectedNode(orderedNodeList[currIndex + 1].id);
          }
          break;
        case 'ArrowLeft':
          if (expandedNodes[currentNodeId]) {
            toggleExpanded(currentNodeId);
          } else {
            let parentIndex = currIndex;
            for (; parentIndex >= 0; --parentIndex) {
              if (orderedNodeList[parentIndex].id === currentNodeData.parentId) {
                break;
              }
            }
            virtual.scrollToIndex(parentIndex);
            setNewSelectedNode(orderedNodeList[parentIndex].id);
          }
          break;
        default:
          e.key satisfies never;
      }
    },
    [virtual, setNewSelectedNode, orderedNodeList, expandedNodes, toggleExpanded, focusedNode, idToIndex]
  );

  // Accessibility guidelines say that when the tree is focused you must either focus the
  // first node when no item is currently selected, or the currently selected node. To gain focus
  // in a virtual list, we must scroll to the currently selected node.
  const accessibleTreeFocus = useCallback(() => {
    if (selectedNode === null) {
      setNewSelectedNode(orderedNodeList[0].id);
    } else {
      virtual.scrollToIndex(idToIndex[selectedNode]);
    }
  }, [virtual, setNewSelectedNode, orderedNodeList, idToIndex, selectedNode]);

  return (
    <div
      role="tree"
      onKeyDown={navigateWithKeys}
      tabIndex={0}
      onDragEnd={dragEnded}
      ref={viewportRef}
      style={{ height: '700px', overflow: 'auto' }}
      onFocus={accessibleTreeFocus}
      onDragStart={dragStarted}
    >
      <div tabIndex={-1} style={{ position: 'relative', height: `${virtual.getTotalSize()}px`, width: '1800px' }}>
        {virtual.getVirtualItems().map((vi) => (
          <div
            key={vi.index}
            role="tree-item"
            aria-selected={orderedNodeList[vi.index].id === selectedNode}
            aria-expanded={
              orderedNodeList[vi.index].childrenIds !== undefined
                ? expandedNodes[orderedNodeList[vi.index].id]
                : undefined
            }
            aria-level={orderedNodeList[vi.index].level + 1}
            style={{ position: 'absolute', width: '100%', height: `${vi.size}px`, left: 0, top: `${vi.start}px` }}
          >
            <TreeRow
              nodeData={orderedNodeList[vi.index]}
              onNodeMoved={moveNode}
              expanded={expandedNodes[orderedNodeList[vi.index].id]}
              focused={focusedNode === orderedNodeList[vi.index].id}
              selected={orderedNodeList[vi.index].id === selectedNode}
              onToggleExpand={toggleExpanded}
              onSelectNode={setNewSelectedNode}
            >
              <TreeNode
                key={orderedNodeList[vi.index].id}
                nodeData={orderedNodeList[vi.index]}
                expanded={expandedNodes[orderedNodeList[vi.index].id]}
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
