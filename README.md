# Nutrea

A kind of headless tree hook library focused on efficiency and flexibility.

## Why?

There have been many tree libraries that do a fantastic job. However, when it comes to trees that contain hundreds of thousands of nodes, need to update frequently, support accessibility, and are efficient while giving you all these things, there aren't many choices. That's where this library can hopefully help.

## Library Opinions

This library is unopinionated on purpose. In a way, you could call it "headless", since it is just a hook and requires the developer to create the UI. There are also no opinions about the structure of your tree data, since making any assumptions or picking a stance could have performance implications. For example, if your tree data is not nested (like a flat list or map), and this library had forced developers to pass a nested structure just to flatten it again, that would be wasteful. However, with sensible defaults, you can pass this hook a nested structure and it will just work, given the nodes have an `id` and `children` fields. If your structure is different, you will have to specify how to obtain the nodes' id and their children with props.

This library also does not manage expanded or selected states for you, but offers conveniences to work with those things. For example, each node in the returned list has methods like `select()` and `toggleExpanded()`. These types of methods combined with callback props to notify when values have changed, allow the developer to completely manage and handle their own states.

Another opinion not forced by this library is virtualization. If you want to virtualize the results, that will be up to you. For very large lists, it is very much recommended though.

## Features

- Builds a list from the input tree data to be used in a virtualizer or rendered directly to the DOM.
- Filtering
- The hook returns a key down/up callback for list navigation, which will call the next node to be selected through the `onSelection` prop.

## Getting Started

```sh
npm i nutrea
```

### Very Basic Tree

A basic tree with no virtualization or key navigation. The data structure here is nested with default field names that the library supports: `id` and `children`. This component is managing its own expanded and selected states.

```jsx
import { useTree } from 'nutrea';

const BasicTree = memo(function BasicTree() {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  // Expanded state is a Record<string, boolean> map
  const [expandedState, setExpandedState] = useState({});

  const [treeData] = useState({
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
  });

  const expandAllExample = useCallback(() => {
    const newState = {};
    const traverse = (node) => {
      if (node.children) {
        newState[node.id] = true;
        node.children.forEach(traverse);
      }
    };
    traverse(treeData);
    setExpandedState(newState);
  }, [treeData]);

  const collapseAllExample = useCallback(() => {
    setExpandedState({});
  }, []);

  const selectNode = useCallback((node) => {
    setSelectedNodeId(node.id);
  }, []);

  const { visibleList: visibleNodes } = useTree({
    data: treeData,
    expandedState,
    onExpandedStateChange: setExpandedState,
    onSelection: selectNode
  });

  return (
    <div role="tree" ref={scrollableRef} style={{ height: '600px', overflow: 'auto' }}>
      {visibleNodes.map((node) => {
        return (
          <div
            onClick={node.select}
            role="tree-item"
            aria-expanded={node.isExpanded}
            aria-selected={selectedNodeId !== null && node.isSelected(selectedNodeId)}
            key={node.id}
            style={{
              paddingLeft: `${node.level * 16 + 8}px`,
              display: 'flex',
              height: '30px',
              alignItems: 'center',
              border: node.id === selectedNodeId ? '1px dashed blue' : undefined
            }}
          >
            <span
              onClick={
                node.hasChildren
                  ? (e) => {
                      e.stopPropagation();
                      node.toggleExpanded();
                    }
                  : undefined
              }
              style={{ display: 'inline-block', width: '20px', height: '25px' }}
            >
              {node.hasChildren ? (node.isExpanded ? '-' : '+') : undefined}
            </span>
            {node.name}
          </div>
        );
      })}
    </div>
  );
});
```

### More Features

Since this library doesn't render the UI, it's up to you to handle things like drag and drop and focus for key navigation. Here's an example of how focus can work by creating a separate component for a tree node. The `navigateWithKey` prop can receive the callback from the `useTree` hook as it is returned by the hook, but you may also want to wrap that with an additional call to a virtualizers `scrollToIndex` method, if your virtual library has one. This way, when navigating with the keys, any nodes selected at the bottom or top of the virtualized list can be scrolled into view.

```jsx
const TreeNode = memo(function TreeNode({
  id,
  isExpanded,
  hasChildren,
  select,
  toggleExpanded,
  isSelected,
  name,
  level,
  navigateWithKey
}) {
  const nodeRef = useRef(null);

  // In a virtualized list, the component gets unmounted when it's scrolled out of the viewport.
  // This ensures the node receives focus again, when it's scrolled back into view.
  useEffect(() => {
    if (isSelected) {
      nodeRef.current?.focus();
    }
  }, [isSelected]);

  return (
    <div
      ref={nodeRef}
      tabIndex={-1}
      onKeyDown={navigateWithKey}
      onClick={select}
      role="tree-item"
      aria-expanded={isExpanded}
      aria-selected={isSelected}
      key={id}
      style={{
        paddingLeft: `${level * 16 + 8}px`,
        display: 'flex',
        height: '30px',
        alignItems: 'center',
        border: isSelected ? '1px dashed blue' : undefined
      }}
    >
      <span
        onClick={
          hasChildren
            ? (e) => {
                e.stopPropagation();
                toggleExpanded();
              }
            : undefined
        }
        style={{ display: 'inline-block', width: '20px', height: '25px' }}
      >
        {hasChildren ? (isExpanded ? '-' : '+') : undefined}
      </span>
      {name}
    </div>
  );
});
```
