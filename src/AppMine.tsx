import { useCallback, useMemo, useRef, useState } from 'react';
import Tree from './tree/Tree';
import { TreeApi, TreeDataOut } from './tree/types';

const mockMap: Record<string, { id: string; childrenIds: string[]; label: string }> = {
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
    childrenIds: [],
    label: 'From C!'
  },
  d: {
    id: 'd',
    childrenIds: ['e'],
    label: 'D is cool'
  },
  e: {
    id: 'e',
    childrenIds: [],
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
    mockMap.a.childrenIds.push(newId);
    return;
  }

  createNode(level - 1, newId);
}
for (let i = 0; i < 5_000; ++i) {
  createNode(100);
}

function AppMine() {
  const treeRef = useRef<TreeApi>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const treeData = useMemo(() => {
    const result: TreeDataOut[] = [];

    (function traverse(nodeId: string, parentId?: string, level = 0) {
      const node = mockMap[nodeId];
      const resultNode: TreeDataOut = { ...node, level, parentId };
      result.push(resultNode);
      node.childrenIds.forEach((childId) => traverse(childId, node.id, level + 1));
    })('a');

    return result;
  }, []);

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
      const mapKeys = Object.keys(mockMap);
      const index = Math.floor(Math.random() * mapKeys.length);
      const key = mapKeys[index];
      treeRef.current.expandNode(key);
    }
  }, []);

  return (
    <>
      <div>
        <button onClick={expandAll}>Expand All</button>
        <button onClick={collapseAll}>Collapse All</button>
        <button onClick={expandRandom}>Expand Random</button>
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      <Tree rootId="a" treeData={treeData} treeRef={treeRef} searchTerm={searchTerm} />
    </>
  );
}

export default AppMine;
