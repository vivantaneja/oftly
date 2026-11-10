import DOMPurify from "dompurify";

const media = new Map<string, string>();
export function registerMedia(name: string, blob: Blob) {
  // Browser media names contain a content hash, so existing URLs stay valid.
  if (media.has(name)) return;
  media.set(name, URL.createObjectURL(blob));
}
export const escapeHTML = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function plainHTML(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  }).replace(/&[^;]+;/g, (entity) => {
    const el = document.createElement("textarea");
    el.innerHTML = entity;
    return el.value;
  });
}
// One allowlist at both the storage and display boundaries. Imported HTML cannot
// borrow app classes, submit forms, embed pages, or fetch third-party media.
export function cardHTML(html: string, display = false): string {
  const sounds = html.replace(
    /\[sound:([^\]]+)\]/g,
    (_, name: string) => `<audio controls src="${escapeHTML(name)}"></audio>`,
  );
  const fragment = DOMPurify.sanitize(sounds, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "div",
      "span",
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "sub",
      "sup",
      "ul",
      "ol",
      "li",
      "blockquote",
      "pre",
      "code",
      "hr",
      "img",
      "audio",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "td",
      "th",
    ],
    ALLOWED_ATTR: ["class", "dir", "src", "alt", "controls", "href", "title"],
    RETURN_DOM_FRAGMENT: true,
  });
  for (const el of fragment.querySelectorAll("*")) {
    if (el.tagName !== "SPAN" || el.getAttribute("class") !== "cloze")
      el.removeAttribute("class");
    if (!["ltr", "rtl", "auto"].includes(el.getAttribute("dir") ?? ""))
      el.removeAttribute("dir");
    const src = el.getAttribute("src");
    if (src !== null) {
      el.removeAttribute("src");
      let name = src;
      try {
        if (name.startsWith("/media/"))
          name = decodeURIComponent(name.slice(7));
      } catch {
        name = "";
      }
      if (
        ["IMG", "AUDIO"].includes(el.tagName) &&
        name &&
        !/[\x00-\x1f/\\:?#]/.test(name) &&
        name !== ".."
      ) {
        const local =
          display && import.meta.env.VITE_STORAGE === "browser"
            ? media.get(name)
            : "/media/" + encodeURIComponent(name);
        if (local) el.setAttribute("src", local);
      }
    }
    if (el.tagName === "A") {
      const href = el.getAttribute("href") ?? "";
      if (!/^(https?:\/\/|mailto:)/i.test(href) || /[\x00-\x20\x7f]/.test(href))
        el.removeAttribute("href");
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    } else el.removeAttribute("href");
  }
  const wrapper = document.createElement("div");
  wrapper.append(fragment);
  return wrapper.innerHTML;
}
