import { RefObject, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { TreeApi, TreeDataNode } from './types';

export const useTreeState = ({
  rootId,
  treeData,
  onMoveHandler,
  treeRef,
  searchTerm,
  showRoot
}: {
  rootId: string;
  treeData: TreeDataNode[];
  onMoveHandler: ((nodeId: string, fromParentId: string, toParentId: string) => void) | undefined;
  treeRef: RefObject<TreeApi | null> | undefined;
  searchTerm: string | undefined;
  showRoot: boolean;
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ [rootId]: true });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  // const [treeState, setTreeState] = useState(treeData);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);

  const treeDataMap = useMemo(() => {
    return treeData.reduce<Record<string, TreeDataNode>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
  }, [treeData]);

  const orderedNodeList = useMemo(() => {
    const result: TreeDataNode[] = [];
    // In order to display ancestry of found nodes during a search, we have to keep a stack of the path to the found node
    let path: TreeDataNode[] = [];

    const traverse = (nodeId: string, level = 0) => {
      const node = treeDataMap[nodeId];
      path.push(node);
      if (searchTerm && node.label.includes(searchTerm)) {
        // When we find a match on the search term, push the path up to this point into results
        path.forEach((pathNode) => result.push(pathNode));
        // Clearing path here ensures any more matched descendants will not add duplicate nodes in the results
        path = [];
      } else if (!searchTerm) {
        result.push({ ...node });
      }

      if (node.childrenIds && (expandedNodes[nodeId] || searchTerm)) {
        node.childrenIds.forEach((childId) => traverse(childId, level + 1));
      }
      path.pop();
    };

    if (showRoot) {
      traverse(rootId);
    } else {
      treeDataMap[rootId].childrenIds?.forEach((childId) => traverse(childId));
    }

    return result;
  }, [treeDataMap, rootId, expandedNodes, searchTerm, showRoot]);

  useImperativeHandle(
    treeRef,
    (): TreeApi => {
      return {
        expandNode: (nodeId: string) => {
          if (treeDataMap[nodeId].childrenIds === undefined) {
            return;
          }
          setExpandedNodes((state) => ({ ...state, [nodeId]: true }));
        },
        collapseNode: (nodeId: string) => {
          if (treeDataMap[nodeId].childrenIds === undefined) {
            return;
          }
          setExpandedNodes((state) => ({ ...state, [nodeId]: false }));
        },
        selectNode: (nodeId: string) => {
          setSelectedNode(nodeId);
          setFocusedNode(nodeId);
        },
        expandAll: () => {
          const newExpandedState: Record<string, boolean> = {};
          (function traverse(nodeId: string) {
            const node = treeDataMap[nodeId];
            if (node.childrenIds === undefined) {
              return;
            }
            newExpandedState[nodeId] = true;
            node.childrenIds.forEach((childId) => traverse(childId));
          })(rootId);
          setExpandedNodes(newExpandedState);
        },
        expandAllDescendantsOf: (nodeId: string) => {
          const newExpandedNodes: Record<string, boolean> = {};
          (function traverse(nodeId: string) {
            const node = treeDataMap[nodeId];
            if (node.childrenIds === undefined) {
              return;
            }
            newExpandedNodes[nodeId] = true;
            node.childrenIds.forEach((childId) => traverse(childId));
          })(nodeId);

          setExpandedNodes((state) => {
            return {
              ...state,
              ...newExpandedNodes
            };
          });
        },
        expandToRoot: (nodeId: string) => {
          const newExpandedNodes: Record<string, boolean> = {};
          let node = treeDataMap[nodeId];
          while (node.parentId) {
            newExpandedNodes[node.id] = true;
            node = treeDataMap[node.parentId];
          }

          setExpandedNodes((state) => {
            return {
              ...state,
              ...newExpandedNodes
            };
          });
        },
        collapseAllDescendantsOf: (nodeId: string) => {
          const newCollapsedNodes: Record<string, boolean> = {};
          (function traverse(nodeId: string) {
            const node = treeDataMap[nodeId];
            if (node.childrenIds === undefined) {
              return;
            }
            newCollapsedNodes[nodeId] = false;
            node.childrenIds.forEach((childId) => traverse(childId));
          })(nodeId);

          setExpandedNodes((state) => {
            return {
              ...state,
              ...newCollapsedNodes
            };
          });
        },
        collapseAll: () => {
          setExpandedNodes({});
        }
      };
    },
    [rootId, setSelectedNode, treeDataMap]
  );

  const toggleExpanded = useCallback(
    (nodeId: string) => {
      if (treeDataMap[nodeId].childrenIds === undefined) {
        return;
      }

      setExpandedNodes((state) => ({
        ...state,
        [nodeId]: !state[nodeId]
      }));
    },
    [treeDataMap]
  );

  const setNewSelectedNode = useCallback(
    (nodeId: string) => {
      treeRef?.current?.selectNode(nodeId);
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
