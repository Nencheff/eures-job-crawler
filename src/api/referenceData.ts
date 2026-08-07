import type { ReferenceDictionary } from "./euresTypes.js";

export interface ReferenceData {
  countryName: (code: string | null | undefined) => string | null;
  regionName: (code: string | null | undefined) => string | null;
  contractTypeLabel: (code: string | null | undefined) => string | null;
  employmentTypeLabel: (codes: string[]) => string | null;
  languageName: (code: string | null | undefined) => string | null;
}

const lookup = (dictionary: ReferenceDictionary, key: string): string | null =>
  dictionary[key] ?? null;

export const createReferenceData = (dictionary: ReferenceDictionary): ReferenceData => ({
  countryName: (code) => (code ? lookup(dictionary, `global.country.${code.toUpperCase()}`) : null),

  regionName: (code) => (code ? lookup(dictionary, `global.nuts.${code.toUpperCase()}`) : null),

  contractTypeLabel: (code) =>
    code ? lookup(dictionary, `global.reg2018.position.offering.${code.toLowerCase()}`) : null,

  employmentTypeLabel: (codes) => {
    const labels = codes
      .map((code) => lookup(dictionary, `global.reg2018.position.schedule.${code.toLowerCase()}`))
      .filter((label): label is string => label !== null);
    return labels.length > 0 ? labels.join(", ") : null;
  },

  languageName: (code) =>
    code ? lookup(dictionary, `global.language.${code.toLowerCase()}`) : null,
});
