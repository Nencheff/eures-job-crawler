export interface RelevanceFilterOptions {
  /** When false (the default), every job is treated as relevant and detail pages are always fetched. */
  enabled: boolean;
  /** Case-insensitive terms; a job is skipped if its title contains any of them. */
  excludeTerms: string[];
}

/**
 * Cheap pre-filter over the search-result summary (title + description already
 * returned inline by the search API) so obviously irrelevant jobs never trigger
 * a detail-page fetch. Only title is checked: descriptions are long and prone to
 * false-positive substring matches (e.g. "no Java experience required").
 */
export const isObviouslyIrrelevant = (
  title: string | null,
  options: RelevanceFilterOptions,
): boolean => {
  if (!options.enabled || options.excludeTerms.length === 0 || !title) return false;

  const normalizedTitle = title.toLowerCase();
  return options.excludeTerms.some((term) => normalizedTitle.includes(term.toLowerCase()));
};
