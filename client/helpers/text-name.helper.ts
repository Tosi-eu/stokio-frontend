const PT_LOWER_PARTICLES = new Set(["de", "da", "do", "dos", "das", "e"]);

export function collapseWhitespace(value: string): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeNameKey(value: string): string {
  const collapsed = collapseWhitespace(value);
  if (!collapsed) return "";
  return collapsed.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function capitalizeWord(word: string): string {
  if (!word) return "";
  const lower = word.toLowerCase();
  const first = lower.charAt(0).toLocaleUpperCase("pt");
  return first + lower.slice(1);
}

export function formatDisplayName(value: string): string {
  const collapsed = collapseWhitespace(value);
  if (!collapsed) return "";

  return collapsed
    .split(" ")
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && PT_LOWER_PARTICLES.has(lower)) {
        return lower;
      }
      const parts = word.split("-");
      if (parts.length > 1) {
        return parts.map((part) => capitalizeWord(part)).join("-");
      }
      return capitalizeWord(word);
    })
    .join(" ");
}

export function formatEntityDisplayName(value: string): string {
  const key = normalizeNameKey(value);
  if (!key) return "";
  return formatDisplayName(key);
}
