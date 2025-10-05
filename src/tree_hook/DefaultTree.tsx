import { FC, memo, useCallback, useRef, useState } from 'react';
import { useTree } from './use_tree';
import { useVirtualizer } from '@tanstack/react-virtual';
import './DefaultTree.css';

interface MyTreeNode {
  id: string;
  childrenIds?: string[];
  label: string;
}

const DefaultTree: FC<{
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

  const { visibleList: visibleNodes } = useTree({
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
                className={node.id === selectedNodeId ? 'selected' : ''}
                style={{
                  position: 'absolute',
                  top: `${vi.start}px`,
                  paddingLeft: `${node.level * 16 + 8}px`,
                  display: 'flex',
                  height: '30px',
                  width: '100%',
                  alignItems: 'center'
                }}
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    node.toggleExpanded();
                  }}
                  style={{ display: 'inline-block', width: '20px', height: '25px' }}
                >
                  {node.isExpanded ? '-' : '+'}
                </span>
                {node.label}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
});

export default DefaultTree;
