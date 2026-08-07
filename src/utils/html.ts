const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

const decodeEntities = (value: string): string =>
  value.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });

/** Strips HTML tags and decodes entities, collapsing whitespace like the EURES description/instructions fields need. */
export const htmlToText = (html: string | null | undefined): string | null => {
  if (!html) return null;

  const withBreaks = html.replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, "\n");
  const withoutTags = withBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeEntities(withoutTags);
  const normalized = decoded
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line, index, lines) => line.length > 0 || (index > 0 && lines[index - 1] !== ""))
    .join("\n")
    .trim();

  return normalized.length > 0 ? normalized : null;
};

/** Extracts the first href found in a block of HTML, e.g. an application instructions link. */
export const firstHref = (html: string | null | undefined): string | null => {
  if (!html) return null;
  const match = html.match(/href\s*=\s*"([^"]+)"/i);
  return match ? match[1] : null;
};
