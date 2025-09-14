import { RefObject, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { TreeApi, TreeDataNode, TreeProps } from './types';
import { useVirtualizer } from '@tanstack/react-virtual';

export const useTreeState = (
  scrollableRef: RefObject<HTMLDivElement | null>,
  { rootId, treeData, onNodeMoved, treeRef, searchTerm, showRoot, virtualBufferCount = 0 }: TreeProps
) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({ [rootId]: true });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Focused state will fire native browser focus when the associated node is rendered.
  // Separating selected state and focused state allows the user to decide if focus should "follow" selection.
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Having a map allows much faster look-ups using id as the key
  const treeDataMap = useMemo(() => {
    return treeData.reduce<Record<string, TreeDataNode>>((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
  }, [treeData]);

  const filteredNodeList = useMemo(() => {
    const result: TreeDataNode[] = [];
    // In order to display ancestry of found nodes during a search, we have to keep a stack of the path to the found node
    let path: TreeDataNode[] = [];

    const traverse = (nodeId: string) => {
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
        node.childrenIds.forEach((childId) => traverse(childId));
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

  // Having an id-to-index association allows looking up the index much faster when scrolling nodes into view with the virtualizer
  const idToIndex = useMemo(
    () =>
      filteredNodeList.reduce<Record<string, number>>((acc, curr, i) => {
        acc[curr.id] = i;
        return acc;
      }, {}),
    [filteredNodeList]
  );

  const virtual = useVirtualizer({
    count: filteredNodeList.length,
    getScrollElement: () => scrollableRef.current,
    estimateSize: () => 30,
    overscan: virtualBufferCount
  });

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
          setSelectedNodeId(nodeId);
          setFocusedNodeId(nodeId);
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
    [rootId, setSelectedNodeId, treeDataMap]
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
    },
    [treeRef]
  );

  // This block of code is really meant to scroll selected nodes into view when selection happens "externally".
  // As an example, if a dev decides that adding a new node to their data should auto select that node, they
  // would want the tree to scroll it into view for them.
  const [prevSelected, setPrevSelected] = useState<string | null>(selectedNodeId);

  if (selectedNodeId !== null && prevSelected !== selectedNodeId) {
    const selectedIndex = idToIndex[selectedNodeId];
    virtual.scrollToIndex(selectedIndex);
    setPrevSelected(selectedNodeId);
  }

  const navigateWithKeys = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const currentNodeId = focusedNodeId;
      if (currentNodeId === null) {
        setNewSelectedNode(filteredNodeList[0].id);
        virtual.scrollToIndex(0);
        return;
      }

      const currIndex = idToIndex[currentNodeId];
      const currentNodeData = filteredNodeList[currIndex];

      switch (e.key) {
        case 'ArrowDown':
          if (currIndex < filteredNodeList.length - 1) {
            virtual.scrollToIndex(currIndex + 1);
            setNewSelectedNode(filteredNodeList[currIndex + 1].id);
          }
          break;
        case 'ArrowUp':
          if (currIndex > 0) {
            virtual.scrollToIndex(currIndex - 1);
            setNewSelectedNode(filteredNodeList[currIndex - 1].id);
          }
          break;
        case 'ArrowRight':
          if (currentNodeData.childrenIds !== undefined && !expandedNodes[currentNodeId]) {
            toggleExpanded(currentNodeId);
          } else if (currIndex < filteredNodeList.length - 1) {
            virtual.scrollToIndex(currIndex + 1);
            setNewSelectedNode(filteredNodeList[currIndex + 1].id);
          }
          break;
        case 'ArrowLeft':
          if (currentNodeData.childrenIds !== undefined && expandedNodes[currentNodeId]) {
            toggleExpanded(currentNodeId);
          } else {
            let parentIndex = currIndex;
            for (; parentIndex >= 0; --parentIndex) {
              if (filteredNodeList[parentIndex].id === currentNodeData.parentId) {
                break;
              }
            }
            virtual.scrollToIndex(parentIndex);
            setNewSelectedNode(filteredNodeList[parentIndex].id);
          }
          break;
        default:
          e.key satisfies never;
      }
    },
    [virtual, filteredNodeList, expandedNodes, idToIndex, focusedNodeId, setNewSelectedNode, toggleExpanded]
  );

  const moveNode = useCallback(
    (nodeId: string, fromParentId: string, toParentId: string) => {
      onNodeMoved?.(nodeId, fromParentId, toParentId);
    },
    [onNodeMoved]
  );

  return {
    selectedNodeId,
    filteredNodeList,
    toggleExpanded,
    setNewSelectedNode,
    moveNode,
    expandedNodes,
    focusedNodeId,
    setFocusedNodeId,
    idToIndex,
    virtual,
    navigateWithKeys
  };
};
