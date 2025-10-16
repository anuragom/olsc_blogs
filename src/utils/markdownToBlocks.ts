import { Block } from "@models/Blog";
import { marked } from "marked";
import { JSDOM } from "jsdom";

/**
 * Convert markdown text to array of Blocks
 */
export function markdownToBlocks(markdown: string): Block[] {
  // marked.parse can be async in newer versions, but here we use synchronous parse
  const html = marked.parse(markdown) as string;

  const dom = new JSDOM(html);
  const blocks: Block[] = [];

  dom.window.document.body.childNodes.forEach((node) => {
    // Cast node to Element if needed
    const element = node as Element;

    switch (node.nodeName) {
      case "P":
        blocks.push({
          type: "paragraph",
          data: { text: node.textContent || undefined },
        });
        break;

      case "IMG":
        const img = node as HTMLImageElement;
        blocks.push({
          type: "image",
          data: { url: img.src, caption: img.alt || undefined },
        });
        break;

      default:
        if (/H[1-6]/.test(node.nodeName)) {
          blocks.push({
            type: "heading",
            data: { text: node.textContent || undefined, level: parseInt(node.nodeName[1]) },
          });
        } else if (node.nodeName === "UL" || node.nodeName === "OL") {
          // For lists, cast node to Element to use querySelectorAll
          const items = Array.from(element.querySelectorAll("li")).map((li) => li.textContent || "");
          blocks.push({
            type: "list",
            data: { style: node.nodeName === "UL" ? "unordered" : "ordered", items },
          });
        }
        break;
    }
  });

  return blocks;
}
