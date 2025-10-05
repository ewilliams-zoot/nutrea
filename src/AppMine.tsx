import { useCallback, useState } from 'react';
// import DefaultTree from './tree_hook/DefaultTree';
import WithDragAndDrop from './tree_hook/WithDragAndDrop';

interface MyTreeNode {
  id: string;
  childrenIds?: string[];
  label: string;
}

function AppMine() {
  const [expandedState, setExpandedState] = useState<Record<string, boolean>>({});
  const [sourceData] = useState(() => {
    const mockMap: Record<string, { id: string; childrenIds?: string[]; label: string }> = {
      root: {
        id: 'root',
        childrenIds: ['b', 'c'],
        label: 'Root'
      },
      b: {
        id: 'b',
        childrenIds: ['d'],
        label: 'B'
      },
      c: {
        id: 'c',
        label: 'From C!'
      },
      d: {
        id: 'd',
        childrenIds: ['e'],
        label: 'D is cool'
      },
      e: {
        id: 'e',
        label: 'sup'
      }
    };

    function createNode(level: number, childId?: string) {
      const newId = crypto.randomUUID();
      const node = {
        id: newId,
        childrenIds: childId ? [childId] : [],
        label: newId
      };
      mockMap[newId] = node;

      if (level === 0) {
        mockMap.root.childrenIds!.push(newId);
        return;
      }

      createNode(level - 1, newId);
    }
    for (let i = 0; i < 3_000; ++i) {
      createNode(8);
    }
    return mockMap;
  });

  const getChildren = useCallback(
    (node: MyTreeNode) => {
      if (node.childrenIds) {
        return node.childrenIds.map((childId) => sourceData[childId]);
      }
      return undefined;
    },
    [sourceData]
  );

  const expandAll = useCallback(() => {
    const newState: Record<string, boolean> = {};
    Object.keys(sourceData).forEach((id) => {
      if (sourceData[id].childrenIds) {
        newState[id] = true;
      }
    });
    setExpandedState(newState);
  }, [sourceData]);

  const collapseAll = useCallback(() => {
    setExpandedState({});
  }, []);

  return (
    <div>
      <div>
        <button onClick={expandAll}>Expand All</button>
        <button onClick={collapseAll}>Collapse All</button>
      </div>
      <WithDragAndDrop
        data={sourceData}
        rootId="root"
        getChildren={getChildren}
        expandedState={expandedState}
        onExpandedStateChange={setExpandedState}
      />
    </div>
  );
}

export default AppMine;
