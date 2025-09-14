import { useCallback, useMemo, useRef, useState } from 'react';
import Tree from './tree/Tree';
import { TreeApi, TreeDataNode } from './tree/types';
import { flushSync } from 'react-dom';

function AppMine() {
  const treeRef = useRef<TreeApi>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceData, setSourceData] = useState(() => {
    const mockMap: Record<string, { id: string; childrenIds?: string[]; label: string }> = {
      a: {
        id: 'a',
        childrenIds: ['b', 'c'],
        label: 'Hello'
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
        mockMap.a.childrenIds!.push(newId);
        return;
      }

      createNode(level - 1, newId);
    }
    for (let i = 0; i < 1_000; ++i) {
      createNode(100);
    }
    return mockMap;
  });

  const treeData = useMemo(() => {
    const result: TreeDataNode[] = [];

    (function traverse(nodeId: string, parentId?: string, level = 0) {
      const node = sourceData[nodeId];
      const resultNode: TreeDataNode = { ...node, level, parentId };
      result.push(resultNode);
      node.childrenIds?.forEach((childId) => traverse(childId, node.id, level + 1));
    })('a');

    return result;
  }, [sourceData]);

  const expandAll = useCallback(() => {
    if (treeRef.current) {
      treeRef.current.expandAll();
    }
  }, []);

  const collapseAll = useCallback(() => {
    if (treeRef.current) {
      treeRef.current.collapseAll();
    }
  }, []);

  const expandRandom = useCallback(() => {
    if (treeRef.current) {
      const mapKeys = Object.keys(sourceData);
      const index = Math.floor(Math.random() * mapKeys.length);
      const key = mapKeys[index];
      treeRef.current.expandToRoot(key);
      treeRef.current.selectNode(key);
    }
  }, [sourceData]);

  const addRandomNode = useCallback(() => {
    if (!treeRef.current) return;
    const newId = crypto.randomUUID();
    flushSync(() => {
      setSourceData((state) => {
        const mapKeys = Object.keys(state);
        const index = Math.floor(Math.random() * mapKeys.length);
        const randomParentKey = mapKeys[index];

        const parent = state[randomParentKey];
        const newParent = {
          ...parent,
          childrenIds: parent.childrenIds ? [...parent.childrenIds, newId] : [newId]
        };
        const newNode = {
          id: newId,
          label: newId
        };

        return {
          ...state,
          [parent.id]: newParent,
          [newId]: newNode
        };
      });
    });
    treeRef.current.expandToRoot(newId);
    treeRef.current.selectNode(newId);
  }, []);

  return (
    <>
      <div>
        <button onClick={expandAll}>Expand All</button>
        <button onClick={collapseAll}>Collapse All</button>
        <button onClick={expandRandom}>Expand Random</button>
        <button onClick={addRandomNode}>Add Random Node</button>
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <Tree rootId="a" treeData={treeData} treeRef={treeRef} searchTerm={searchTerm} showRoot={true} />
    </>
  );
}

export default AppMine;
