import { useTree } from '../src/index';
import { expect, test } from 'vitest';
import { renderHook } from '@testing-library/react';

type TreeNode = {
  id: string;
  name: string;
  children?: TreeNode[];
};

const treeData: TreeNode = {
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
} as const;

test('collapsed nodes are not included', () => {
  const expandedState: Record<string, boolean> = {
    root: true
  };

  const { result } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      expandedState,
      onExpandedStateChange: () => {},
      onSelection: () => {}
    }
  });

  expect(result.current.visibleList.length).toBe(3);
});

test('all expanded to be included', () => {
  const expandedState: Record<string, boolean> = {
    root: true,
    folder2: true
  };

  const { result } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      expandedState,
      onExpandedStateChange: () => {},
      onSelection: () => {}
    }
  });

  expect(result.current.visibleList.length).toBe(4);
});

test('show root excludes root node when all are expanded', () => {
  const expandedState: Record<string, boolean> = {
    root: true,
    folder2: true
  };

  const { result } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      expandedState,
      showRoot: false,
      onExpandedStateChange: () => {},
      onSelection: () => {}
    }
  });

  expect(result.current.visibleList.length).toBe(3);
  expect(result.current.visibleList[0].id).toBe('folder');
});

test('passing new expanded state updates list', () => {
  const expandedState: Record<string, boolean> = {
    root: true
  };

  const { result, rerender } = renderHook((initialProps) => useTree<TreeNode>({ ...initialProps }), {
    initialProps: {
      data: treeData,
      expandedState,
      onExpandedStateChange: () => {},
      onSelection: () => {}
    }
  });

  expandedState.folder2 = true;

  rerender({
    data: treeData,
    expandedState: { ...expandedState },
    onExpandedStateChange: () => {},
    onSelection: () => {}
  });

  expect(result.current.visibleList.length).toBe(4);
});

test('using filter reduces the list', () => {
  const expandedState: Record<string, boolean> = {
    root: true,
    folder2: true
  };

  const { result } = renderHook(
    (initialProps: {
      data: TreeNode;
      expandedState: Record<string, boolean>;
      onExpandedStateChange: (newState: Record<string, boolean>) => void;
      onSelection: (node: TreeNode) => void;
      searchTerm: string;
      searchMatch: (node: TreeNode, term: string) => boolean;
    }) => useTree<TreeNode>({ ...initialProps }),
    {
      initialProps: {
        data: treeData,
        expandedState,
        onExpandedStateChange: () => {},
        onSelection: () => {},
        searchTerm: 'Two',
        searchMatch: (node, term) => node.name.includes(term)
      }
    }
  );

  expect(result.current.visibleList.length).toBe(2);
});

test('passing childSort reorganizes children', () => {
  const expandedState: Record<string, boolean> = {
    root: true
  };

  const { result } = renderHook(
    (initialProps: {
      data: TreeNode;
      expandedState: Record<string, boolean>;
      onExpandedStateChange: (newState: Record<string, boolean>) => void;
      onSelection: (node: TreeNode) => void;
      showRoot: boolean;
      childSort: (nodeA: TreeNode, nodeB: TreeNode) => number;
    }) => useTree<typeof treeData>({ ...initialProps }),
    {
      initialProps: {
        data: treeData,
        expandedState,
        showRoot: false,
        onExpandedStateChange: () => {},
        onSelection: () => {},
        childSort: (nodeA, nodeB) => nodeB.name.localeCompare(nodeA.name)
      }
    }
  );

  expect(result.current.visibleList[0].name).toBe('Folder Two');
});

type CustomTreeNode = { qx: string; label: string; childrenQx?: string[] };
const customTreeData: Record<string, CustomTreeNode> = {
  root: {
    qx: 'root',
    label: 'Root',
    childrenQx: ['folder', 'folder2']
  },
  folder: {
    qx: 'folder',
    label: 'Folder'
  },
  folder2: {
    qx: 'folder2',
    label: 'Folder Two',
    childrenQx: ['nestedItem']
  },
  nestedItem: {
    qx: 'nestedItem',
    label: 'Nested Item'
  }
} as const;

test('using custom data with accessor props builds a full list', () => {
  const expandedState: Record<string, boolean> = {
    root: true,
    folder2: true
  };

  const { result } = renderHook(
    (initialProps: {
      data: CustomTreeNode;
      expandedState: Record<string, boolean>;
      getId: (node: CustomTreeNode) => string;
      getChildren: (node: CustomTreeNode) => CustomTreeNode[] | undefined;
      onExpandedStateChange: (newState: Record<string, boolean>) => void;
      onSelection: (node: CustomTreeNode) => void;
    }) => useTree<CustomTreeNode>({ ...initialProps }),
    {
      initialProps: {
        data: customTreeData.root,
        expandedState,
        getId: (node) => node.qx,
        getChildren: (node) => node.childrenQx?.map((id) => customTreeData[id]),
        onExpandedStateChange: () => {},
        onSelection: () => {}
      }
    }
  );

  expect(result.current.visibleList.length).toBe(4);
});
