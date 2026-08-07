const SECTION_STOPS = [
  "Requirements",
  "Candidate requirements",
  "Profile",
  "Benefits",
  "Compensation",
  "Salary",
  "Languages",
  "How to apply",
  "Contact",
  "Job details",
  "Details",
  "Company",
  "Employer",
];

/** Best-effort extraction of a labelled section (e.g. "Requirements:") from free-form job text. */
export const extractSection = (text: string, starts: string[]): string | null => {
  const normalizedText = text.replace(/\r/g, "");
  const escapedStarts = starts.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const escapedStops = SECTION_STOPS.filter((stop) => !starts.includes(stop)).map((s) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );
  const startPattern = new RegExp(`(?:^|\\n)\\s*(${escapedStarts.join("|")})\\s*:?\\s*\\n?`, "i");
  const startMatch = normalizedText.match(startPattern);

  if (!startMatch || startMatch.index === undefined) return null;

  const contentStart = startMatch.index + startMatch[0].length;
  const remaining = normalizedText.slice(contentStart);
  const stopPattern = new RegExp(`\\n\\s*(?:${escapedStops.join("|")})\\s*:?\\s*(?:\\n|$)`, "i");
  const stopMatch = remaining.match(stopPattern);
  const section = stopMatch?.index === undefined ? remaining : remaining.slice(0, stopMatch.index);

  const normalized = section.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
};
