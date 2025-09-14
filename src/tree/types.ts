export interface TreeDataNode {
  id: string;
  childrenIds?: string[];
  label: string;
  level: number;
  parentId?: string;
}

type NodeCallback = (nodeId: string) => void;

export interface TreeApi {
  expandNode: NodeCallback;
  collapseNode: NodeCallback;
  expandAllDescendantsOf: NodeCallback;
  collapseAllDescendantsOf: NodeCallback;
  selectNode: NodeCallback;
  expandAll: () => void;
  collapseAll: () => void;
  expandToRoot: NodeCallback;
}

export interface TreeProps {
  rootId: TreeDataNode['id'];
  treeData: TreeDataNode[];
  showRoot?: boolean;
  searchTerm?: string;
  treeRef?: React.RefObject<TreeApi | null>;
  virtualBufferCount?: number;
  onNodeMoved?: (nodeId: string, fromParentId: string, toParentId: string) => void;
  onNodeDragEnd?: (nodeId: string) => void;
}
