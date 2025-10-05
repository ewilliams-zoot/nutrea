import { useTree } from 'nutrea';

const BasicTree = memo(function BasicTree() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  // Expanded state is a Record<string, boolean> map
  const [expandedState, setExpandedState] = useState({});

  const [treeData] = useState({
    id: 'root',
    name: 'Root',
    children: [
      {
        id: 'folder',
        name: 'Folder'
      },
      {
        id: 'folder2',
        name: 'Folder Two',
        children: [
          {
            id: 'nestedItem',
            name: 'Nested Item'
          }
        ]
      }
    ]
  });

  const selectNode = useCallback((node) => {
    setSelectedNodeId(node.id);
  }, []);

  const { visibleList: visibleNodes } = useTree({
    data: treeData,
    expandedState,
    onExpandedStateChange: setExpandedState,
    onSelection: selectNode
  });

  return (
    <div role="tree" ref={scrollableRef} style={{ height: '600px', overflow: 'auto' }}>
      {visibleNodes.map((node) => {
        return (
          <div
            onClick={node.select}
            role="tree-item"
            aria-expanded={node.isExpanded}
            aria-selected={selectedNodeId !== null && node.isSelected(selectedNodeId)}
            key={node.id}
            style={{
              paddingLeft: `${node.level * 16 + 8}px`,
              display: 'flex',
              height: '30px',
              alignItems: 'center',
              border: node.id === selectedNodeId ? '1px dashed blue' : undefined
            }}
          >
            <span
              onClick={
                node.hasChildren
                  ? (e) => {
                      e.stopPropagation();
                      node.toggleExpanded();
                    }
                  : undefined
              }
              style={{ display: 'inline-block', width: '20px', height: '25px' }}
            >
              {node.hasChildren ? (node.isExpanded ? '-' : '+') : undefined}
            </span>
            {node.name}
          </div>
        );
      })}
    </div>
  );
});
