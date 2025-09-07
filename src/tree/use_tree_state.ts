import { RefObject, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { TreeApi, TreeDataOut } from './types';
import { flushSync } from 'react-dom';

export const useTreeState = (
  rootId: string,
  treeData: TreeDataOut[],
  onMoveHandler: ((nodeId: string, fromParentId: string, toParentId: string) => void) | undefined,
  treeRef?: RefObject<TreeApi | null>,
  searchTerm?: string
) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ [rootId]: true });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  // const [treeState, setTreeState] = useState(treeData);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);

  const treeDataMap = useMemo(() => {
    return treeData.reduce<Record<string, TreeDataOut>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
  }, [treeData]);

  const orderedNodeList = useMemo(() => {
    const result: TreeDataOut[] = [];
    let path: TreeDataOut[] = [];

    (function traverse(nodeId: string, level = 0) {
      const node = treeDataMap[nodeId];
      path.push(node);
      if (searchTerm && node.label.includes(searchTerm)) {
        path.forEach((pathNode) => result.push(pathNode));
        // clearing path here ensures matched descendants will not add duplicate nodes to the path
        path = [];
      } else if (!searchTerm) {
        result.push({ ...node, level });
      }

      if (expandedNodes[nodeId] || searchTerm) {
        node.childrenIds.forEach((childId) => traverse(childId, level + 1));
      }
      path.pop();
    })(rootId);

    return result;
  }, [treeDataMap, rootId, expandedNodes, searchTerm]);

  useImperativeHandle(
    treeRef,
    () => {
      return {
        expandNode: (nodeId: string) => {
          if (!expandedNodes[nodeId]) {
            // flush it before setSelectedNode runs
            flushSync(() =>
              setExpandedNodes((prevState) => {
                const newState = { ...prevState };
                let node = treeDataMap[nodeId];
                while (node.parentId) {
                  newState[node.id] = true;
                  node = treeDataMap[node.parentId];
                }
                newState[node.id] = true;
                return newState;
              })
            );
          }

          setSelectedNode(nodeId);
        },
        selectNode: (nodeId: string) => {
          setSelectedNode(nodeId);
        },
        expandAll: () => {
          const newExpandedState: Record<string, boolean> = {};
          (function traverse(nodeId: string) {
            const node = treeDataMap[nodeId];
            newExpandedState[nodeId] = true;
            node.childrenIds.forEach((childId) => traverse(childId));
          })(rootId);
          setExpandedNodes(newExpandedState);
        },
        expandAllDescendantsOf: (nodeId: string) => {
          const newExpandedState: Record<string, boolean> = {};
          (function traverse(nodeId: string) {
            const node = treeDataMap[nodeId];
            newExpandedState[nodeId] = true;
            node.childrenIds.forEach((childId) => traverse(childId));
          })(nodeId);
          setExpandedNodes(newExpandedState);
        },
        collapseAllDescendantsOf: (nodeId: string) => {
          const newExpandedState: Record<string, boolean> = {};
          (function traverse(nodeId: string) {
            const node = treeDataMap[nodeId];
            newExpandedState[nodeId] = false;
            node.childrenIds.forEach((childId) => traverse(childId));
          })(nodeId);
          setExpandedNodes(newExpandedState);
        },
        collapseAll: () => {
          setExpandedNodes({});
        }
      };
    },
    [rootId, setSelectedNode, treeDataMap, expandedNodes]
  );

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedNodes((state) => ({
      ...state,
      [nodeId]: !state[nodeId]
    }));
  }, []);

  const setNewSelectedNode = useCallback(
    (nodeId: string) => {
      treeRef?.current?.selectNode(nodeId);
      setFocusedNode(nodeId);
    },
    [treeRef]
  );

  const moveNode = useCallback(
    (nodeId: string, fromParentId: string, toParentId: string) => {
      onMoveHandler?.(nodeId, fromParentId, toParentId);
      // setTreeState((prevState) => {
      //   const dragNode: TreeDataOut = { ...treeState[nodeId], parentId: toParentId };
      //   const oldParent: TreeDataOut = {
      //     ...treeState[fromParentId],
      //     childrenIds: treeState[fromParentId].childrenIds.filter((childId) => childId !== nodeId)
      //   };
      //   const newParent: TreeDataOut = {
      //     ...treeState[toParentId],
      //     childrenIds: [...treeState[toParentId].childrenIds, nodeId]
      //   };

      //   return {
      //     ...prevState,
      //     [nodeId]: dragNode,
      //     [fromParentId]: oldParent,
      //     [toParentId]: newParent
      //   };
      // });
    },
    [onMoveHandler]
  );

  return {
    selectedNode,
    orderedNodeList,
    toggleExpanded,
    setNewSelectedNode,
    moveNode,
    expandedNodes,
    focusedNode,
    setFocusedNode
  };
};
