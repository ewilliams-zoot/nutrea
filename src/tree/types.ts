export interface TreeDataOut {
  id: string;
  childrenIds: string[];
  label: string;
  level: number;
  parentId?: string;
}

export interface TreeApi {
  expandNode: (nodeId: string) => void;
  expandAllDescendantsOf: (nodeId: string) => void;
  collapseAllDescendantsOf: (nodeId: string) => void;
  selectNode: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}
