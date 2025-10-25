import { faker } from '@faker-js/faker';

interface Node {
  id: string;
  name: string;
  pets?: Node[];
}

const createRandomNode = (): Node => {
  const numberOfPets = faker.number.int({ min: 1, max: 4 });

  const pets: Node[] = [];
  for (let i = 0; i < numberOfPets; ++i) {
    pets.push({
      id: faker.string.uuid(),
      name: faker.animal.petName()
    });
  }

  return {
    id: faker.string.uuid(),
    name: faker.person.firstName(),
    pets
  };
};

export const createNameTree = (nodeCount: number): Node => {
  const nodes: Node[] = [];
  for (let i = 0; i < nodeCount; ++i) {
    nodes.push(createRandomNode());
  }

  return {
    id: 'root',
    name: 'Root',
    pets: nodes
  };
};

export type FlatNode = {
  id: string;
  name: string;
  pets?: string[];
};

export const createFlatTree = (rootNode: Node): Record<string, FlatNode> => {
  const result: Record<string, FlatNode> = {};

  const traverse = (node: Node) => {
    const newNode: FlatNode = { ...node, pets: node.pets?.map(traverse) };
    result[newNode.id] = newNode;
    return newNode.id;
  };

  traverse(rootNode);
  return result;
};
