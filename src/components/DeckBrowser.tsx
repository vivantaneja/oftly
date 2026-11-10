import { useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Search,
  Upload,
} from "lucide-react";
import { navigate, type Deck } from "../lib/api";
import { deckTree, deckTitle, findDeckNode, type DeckNode } from "../lib/decks";

export default function DeckBrowser({
  decks,
  parentId,
  onNewFolder,
}: {
  decks: Deck[];
  parentId?: string;
  onNewFolder: (parentId?: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const roots = deckTree(decks);
  const nodes = parentId
    ? (findDeckNode(roots, parentId)?.children ?? [])
    : roots;
  const query = search.trim().toLocaleLowerCase();
  function matches(node: DeckNode): boolean {
    return (
      node.deck.name.toLocaleLowerCase().includes(query) ||
      node.children.some(matches)
    );
  }
  function rows(items: DeckNode[], depth = 0) {
    return items.filter(matches).map((node) => {
      const { deck, folder, children } = node;
      const title = deckTitle(deck.name);
      const open = !!query || expanded.has(deck.id);
      const Icon = folder
        ? open && children.length
          ? FolderOpen
          : Folder
        : BookOpen;
      const toggle = () =>
        setExpanded((current) => {
          const next = new Set(current);
          if (next.has(deck.id)) next.delete(deck.id);
          else next.add(deck.id);
          return next;
        });
      return (
        <li key={deck.id}>
          <div
            className="library-row"
            style={
              { "--folder-depth": Math.min(depth, 4) } as React.CSSProperties
            }
          >
            {folder && children.length > 0 ? (
              <button
                className="folder-toggle"
                aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
                aria-expanded={open}
                aria-controls={`folder-${deck.id}`}
                onClick={toggle}
                disabled={!!query}
              >
                <ChevronRight size={16} className={open ? "expanded" : ""} />
              </button>
            ) : (
              <span className="folder-spacer" />
            )}
            <button
              className="library-item"
              onClick={() => navigate("deck/" + deck.id)}
            >
              <span
                className={`library-symbol ${folder ? "folder-symbol" : ""}`}
              >
                <Icon size={21} />
              </span>
              <span className="library-name">
                <strong>{title}</strong>
                <small>
                  {folder
                    ? `${children.length} ${children.length === 1 ? "item" : "items"} · ${node.total} ${node.total === 1 ? "card" : "cards"}`
                    : `${deck.total} ${deck.total === 1 ? "card" : "cards"}`}
                </small>
              </span>
              <span
                className="deck-queue"
                aria-label={`${deck.new} new, ${deck.learning + deck.waiting} learning, ${deck.review} due`}
              >
                <span
                  data-label="New"
                  className={`queue-new${deck.new ? "" : " zero-count"}`}
                >
                  {deck.new}
                </span>
                <span
                  data-label="Learning"
                  className={`queue-learning${deck.learning + deck.waiting ? "" : " zero-count"}`}
                >
                  {deck.learning + deck.waiting}
                </span>
                <span
                  data-label="Due"
                  className={`queue-review${deck.review ? "" : " zero-count"}`}
                >
                  {deck.review}
                </span>
              </span>
            </button>
          </div>
          {children.length > 0 && (
            <ul
              id={`folder-${deck.id}`}
              hidden={!open}
              className="library-branch"
            >
              {rows(children, depth + 1)}
            </ul>
          )}
        </li>
      );
    });
  }
  const visible = nodes.filter(matches);
  return (
    <section
      className="deck-browser"
      aria-label={parentId ? "Folder contents" : "Folders and decks"}
    >
      <div className="section-heading library-heading">
        <div className="library-tools">
          <label className="search">
            <Search size={16} />
            <input
              aria-label="Search decks"
              placeholder="Find a folder or deck"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button className="text-button" onClick={() => onNewFolder(parentId)}>
            <FolderPlus size={17} />
            {parentId ? "New subfolder" : "New folder"}
          </button>
        </div>
      </div>
      {visible.length ? (
        <>
          <div className="library-columns" aria-hidden="true">
            <span>Name</span>
            <span className="deck-queue queue-headings">
              <span>New</span>
              <span>Learning</span>
              <span>Due</span>
            </span>
          </div>
          <ul className="library-tree">{rows(nodes)}</ul>
        </>
      ) : (
        <div className="empty-inline">
          <h3>
            {query
              ? "No folders or decks match."
              : parentId
                ? "This folder is empty."
                : "No decks yet."}
          </h3>
          {query && <p>Try another title.</p>}
          {!query && !parentId && (
            <button className="secondary" onClick={() => navigate("import")}>
              <Upload size={16} /> Import cards
            </button>
          )}
        </div>
      )}
    </section>
  );
}
