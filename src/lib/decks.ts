import type { Deck } from "./api";

export const deckTitle = (name: string) => name.split("::").at(-1) ?? name;
export const deckPath = (name: string) => name.split("::").join(" / ");
export const isFolder = (deck: Deck, decks: Deck[]) =>
  !!deck.folder ||
  decks.some((child) => child.name.startsWith(deck.name + "::"));

export type DeckNode = {
  deck: Deck;
  children: DeckNode[];
  total: number;
  folder: boolean;
};

export function deckTree(decks: Deck[]): DeckNode[] {
  const nodes = new Map(
    decks.map((deck) => [
      deck.name,
      {
        deck,
        children: [] as DeckNode[],
        total: deck.total,
        folder: !!deck.folder,
      },
    ]),
  );
  const roots: DeckNode[] = [];
  for (const [name, node] of nodes) {
    const parent = nodes.get(name.slice(0, name.lastIndexOf("::")));
    if (name.includes("::") && parent) parent.children.push(node);
    else roots.push(node);
  }
  function finish(items: DeckNode[]) {
    for (const node of items) {
      finish(node.children);
      node.total += node.children.reduce((sum, child) => sum + child.total, 0);
      node.folder ||= node.children.length > 0;
    }
    items.sort(
      (a, b) =>
        Number(b.folder) - Number(a.folder) ||
        deckTitle(a.deck.name).localeCompare(
          deckTitle(b.deck.name),
          undefined,
          { numeric: true },
        ),
    );
  }
  finish(roots);
  return roots;
}

export function findDeckNode(
  nodes: DeckNode[],
  id: string,
): DeckNode | undefined {
  for (const node of nodes) {
    if (node.deck.id === id) return node;
    const child = findDeckNode(node.children, id);
    if (child) return child;
  }
}
