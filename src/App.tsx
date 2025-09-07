import { useCallback, useRef, useState } from 'react';
import { TreeDataIn } from './tree/Tree';
import { Tree, TreeApi } from 'react-arborist';

const mockMap: Record<string, TreeDataIn> = {
  a: {
    id: 'a',
    childrenIds: [],
    label: 'Hello'
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
// for (let i = 0; i < 5_000; ++i) {
//   createNode(1);
// }

const data = [];
for (let i = 0; i < 15_000; ++i) {
  const newId = crypto.randomUUID();
  data.push({
    id: newId,
    children: new Array(1).fill(0).map((_, i) => ({ id: crypto.randomUUID(), name: `Node ${i + 1}` })),
    name: newId
  });
}

interface TreeNode {
  id: string;
  name: string;
  children: TreeNode[] | undefined;
}

function forArborist(nodeId: string) {
  const node = mockMap[nodeId];
  const children = node.childrenIds.map((childId) => forArborist(childId));

  const treeNode: TreeNode = {
    id: node.id,
    name: node.label,
    children: children.length > 0 ? children : undefined
  };
  return treeNode;
}
// const arboristData = forArborist('a').children;

function App() {
  const treeRef = useRef<TreeApi<TreeNode>>(null);
  const [totalNodes, setTotalNodes] = useState(0);

  const expandAll = useCallback(() => {
    if (treeRef.current) {
      treeRef.current.openAll();
    }
  }, []);

  const collapseAll = useCallback(() => {
    if (treeRef.current) {
      treeRef.current.closeAll();
    }
  }, []);

  return (
    <>
      <div>
        <button onClick={expandAll}>Expand All</button>
        <button onClick={collapseAll}>Collapse All</button>
        <button onClick={() => setTotalNodes(treeRef.current?.visibleNodes.length ?? 0)}>Get Total Nodes</button>
        <p>Visible Nodes: {totalNodes}</p>
      </div>
      <Tree ref={treeRef} initialData={data} width={1200} height={900} />
    </>
  );
}
// function App() {
//   const treeRef = useRef<null | TreeApi>(null);

//   const expandAll = useCallback(() => {
//     if (treeRef.current) {
//       treeRef.current.expandAll();
//     }
//   }, []);

//   const collapseAll = useCallback(() => {
//     if (treeRef.current) {
//       treeRef.current.collapseAll();
//     }
//   }, []);

//   return (
//     <>
//       <div>
//         <button onClick={expandAll}>Expand All</button>
//         <button onClick={collapseAll}>Collapse All</button>
//       </div>
//       <Tree rootId="a" treeData={mockMap} treeRef={treeRef} />
//     </>
//   );
// }

export default App;
