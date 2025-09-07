# Nutrea

Yet another React tree component library.

## Why?

There have been many tree libraries that do a fantastic job. However, when it comes to trees that contain hundreds of thousands of nodes, need to update frequently, support accessibility, and are efficient while giving you all these things, there aren't many choices. That's where this library can hopefully help.

## Library Opinions

### Tree Data Structure

Unlike many React component libraries, this one may need to put more responsibility on the user. The reason is to keep things as optimized as possible. For example, some libraries want users to provide tree data in a nested structure, which is commonly how trees are represented anyways. However, most tree libraries that support virtualization end up flattening that tree, so if your data is already flat, you are forced to structure it just to have it flattened by the library again. In Nutrea, it's the user's responsibility to flatten (or not) their own data. Once the tree component receives this data, it's not going to waste any extra CPU cycles on restructuring it. To support both this goal and the developer experience, I'm hoping to provide some utilities to make flattening easier for those whos data may not be flattened to start with.

### Controlled vs. Uncontrolled

There may be a path forward for me to provide an uncontrolled component, but right now my goal is to pass all data manipulation off to the user. The reason for this is that the tree's internals will be much simpler and more efficient if it doesn't have to manage its own version of tree state. This also supports a clearer unidirectional data flow; since this tree is not managing tree data (as noted in the Tree Data Structure section above), the full data flow cycle starts and ends with the data the user is passing to the tree. This will present in the form of data change callbacks that the user will pass to the tree, like `onMove` or `onRename`.

## Features

Some features I will support in v1:

- Virtualized
- Single selection
- Custom node component
- Expand/Collapse
- Filter, or "search terms"
- Drag and drop
- Keyboard navigation (for accessibility mostly)
- Node rename edit mode

Future features

- Multi-selection
- Custom row component

## Getting Started

TODO
