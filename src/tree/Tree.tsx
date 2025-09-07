import { useVirtualizer } from '@tanstack/react-virtual';
import './Tree.css';
import { useCallback, useMemo, useRef, useState } from 'react';
import { TreeApi, TreeDataOut } from './types';
import TreeNode from './TreeNode';
import { useTreeState } from './use_tree_state';

// Opinions of the Library
// 1. Data must be flattened before input into Tree, but also provide a flattening utility. If we flatten the data
// for the user, we could be making them "unflatten" it just to flatten again here. That's straight
// up wasteful, dawg.
// 2. Along those same lines, you must add some fields to your data, if it doesn't already have it. Again, saving
// valuable CPU cycles for people who already have tree data in a list with the right data.

interface TreeProps {
  rootId: TreeDataOut['id'];
  treeData: TreeDataOut[];
  searchTerm?: string;
  treeRef?: React.RefObject<TreeApi | null>;
  onMove?: (nodeId: string, fromParentId: string, toParentId: string) => void;
}

const Tree = (props: TreeProps) => {
  const { treeData, rootId, treeRef, searchTerm, onMove } = props;
  const viewportRef = useRef(null);

  const { orderedNodeList, selectedNode, setNewSelectedNode, moveNode, toggleExpanded, expandedNodes, focusedNode } =
    useTreeState(rootId, treeData, onMove, treeRef, searchTerm);

  const [prevSelected, setPrevSelected] = useState<string | null>(selectedNode);

  const virtual = useVirtualizer({
    count: orderedNodeList.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => 30,
    overscan: 0
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

  // Computer, mama keeps saying that Jude cannot grow; this is nacceptable. Thank you
  // Jude is not allowed to grow up, mama said.
  //judenknjkm, mjjlkmama fartt can grow huijijo;nkiu909i0oko0pip9jo
  //yuhguyuugujikol; []\  ,gggggggggggggggggggggujikol .;
  //jude
  /*
tyhuihjuiujyy8u9i9u90i90yy8uj87t67ygtgyuguhuhn
  */

  return (
    <div
      role="tree"
      onKeyDown={navigateWithKeys}
      tabIndex={0}
      onDragEnd={dragEnded}
      ref={viewportRef}
      style={{ height: '700px', overflow: 'auto' }}
    >
      <div tabIndex={-1} style={{ position: 'relative', height: `${virtual.getTotalSize()}px`, width: '1800px' }}>
        {virtual.getVirtualItems().map((vi) => (
          <div
            key={vi.index}
            className="tree-row"
            style={{ position: 'absolute', width: '100%', height: `${vi.size}px`, left: 0, top: `${vi.start}px` }}
            onDragStart={dragStarted}
            tabIndex={-1}
            onFocus={(e) => e.stopPropagation()}
          >
            <TreeNode
              focused={focusedNode === orderedNodeList[vi.index].id}
              key={orderedNodeList[vi.index].id}
              nodeData={orderedNodeList[vi.index]}
              expanded={expandedNodes[orderedNodeList[vi.index].id]}
              selected={orderedNodeList[vi.index].id === selectedNode}
              onToggleExpand={toggleExpanded}
              onSelectNode={setNewSelectedNode}
              onNodeMoved={moveNode}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tree;
