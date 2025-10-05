import { FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { TreeDataNode, useTree } from './use_tree';
import { useVirtualizer } from '@tanstack/react-virtual';
import './DefaultTree.css';

interface MyTreeNode {
  id: string;
  childrenIds?: string[];
  label: string;
}

const WithDragAndDrop: FC<{
  getId?: (node: MyTreeNode) => string;
  getChildren: (node: MyTreeNode) => undefined | MyTreeNode[];
  data: Record<string, MyTreeNode>;
  rootId: string;
  expandedState: Record<string, boolean>;
  onExpandedStateChange: (newState: Record<string, boolean>) => void;
}> = memo(function DefaultTree({ getChildren, data, rootId, expandedState, onExpandedStateChange }) {
  const scrollableRef = useRef<null | HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<null | string>(null);
  const [showRoot, setShowRoot] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const selectNode = useCallback((node: MyTreeNode) => {
    setSelectedNodeId(node.id);
  }, []);

  const toggleShowRoot = useCallback(() => {
    setShowRoot((state) => !state);
  }, []);

  const searchMatch = useCallback((node: MyTreeNode, term: string) => node.label.includes(term), []);

  const { visibleList: visibleNodes, navigateWithKey } = useTree({
    data: data[rootId],
    getChildren,
    expandedState,
    onExpandedStateChange,
    onSelection: selectNode,
    showRoot,
    searchTerm,
    searchMatch
  });

  const virtual = useVirtualizer({
    count: visibleNodes.length,
    estimateSize: () => 30,
    getScrollElement: () => scrollableRef.current,
    getItemKey: (index) => visibleNodes[index].id,
    overscan: 5
  });

  const updateSearchTerm = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  /**
   * Uses the accessible navigation callback and then tells the virtualized list to scroll to
   * the new index returned.
   */
  const scrollOnNavigate = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const nextIndex = navigateWithKey(e, index);
      virtual.scrollToIndex(nextIndex);
    },
    [virtual, navigateWithKey]
  );

  return (
    <>
      <button onClick={toggleShowRoot}>Toggle Show Root</button>
      <div>
        <input type="text" value={searchTerm} onChange={updateSearchTerm} />
      </div>
      <div role="tree" ref={scrollableRef} style={{ height: '600px', overflow: 'auto' }}>
        <div style={{ position: 'relative', height: `${virtual.getTotalSize()}px` }}>
          {virtual.getVirtualItems().map((vi) => {
            const node = visibleNodes[vi.index];

            return (
              <div
                onClick={node.select}
                role="tree-item"
                aria-expanded={node.isExpanded}
                aria-selected={node.id === selectedNodeId}
                key={vi.key}
                style={{
                  position: 'absolute',
                  top: `${vi.start}px`,
                  paddingLeft: `${node.level * 16 + 8}px`,
                  height: '30px',
                  width: '100%'
                }}
              >
                <TreeNode
                  onNavKeyDown={(e) => scrollOnNavigate(e, vi.index)}
                  selected={node.id === selectedNodeId}
                  nodeData={node}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
});

const TreeNode: FC<{
  selected: boolean;
  nodeData: TreeDataNode<MyTreeNode>;
  onNavKeyDown: (e: React.KeyboardEvent) => void;
}> = memo(function TreeNode({ selected, nodeData, onNavKeyDown }) {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (selected) {
      nodeRef.current?.focus();
    }
  }, [selected]);

  const startDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('app/node-id', nodeData.id);
      e.dataTransfer.setData('app/node-parent-id', nodeData.parentId ?? 'root');

      const endDrag = () => {
        setDragging(false);
        nodeRef.current?.removeEventListener('dragend', endDrag);
      };

      nodeRef.current?.addEventListener('dragend', endDrag);
      setDragging(true);
    },
    [nodeData]
  );

  const dropNode = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const droppedId = e.dataTransfer.getData('app/node-id');
      const droppedParent = e.dataTransfer.getData('app/node-parent-id');

      console.log(`Dropped node "${droppedId}" with original parent "${droppedParent}" onto node "${nodeData.id}"`);
    },
    [nodeData]
  );

  const dragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const dragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const detectNavKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        return;
      }

      onNavKeyDown(e);
    },
    [onNavKeyDown]
  );

  return (
    <div
      tabIndex={-1}
      className={`tree-node ${selected ? 'selected' : ''} ${dragging ? 'dragging' : ''}`}
      ref={nodeRef}
      draggable="true"
      onDragStart={startDrag}
      onDragOver={dragOver}
      onDragEnter={dragEnter}
      onDrop={dropNode}
      onKeyDown={detectNavKey}
    >
      <span
        onClick={(e) => {
          e.stopPropagation();
          nodeData.toggleExpanded();
        }}
        style={{ display: 'inline-block', width: '20px', height: '25px' }}
      >
        {nodeData.isExpanded ? '-' : '+'}
      </span>
      {nodeData.label}
    </div>
  );
});

export default WithDragAndDrop;
