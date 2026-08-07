export interface EuresLocation {
  countryCode: string | null;
  region: string | null;
  cityName: string | null;
  postalCode: string | null;
  addressLines: string[];
}

export interface EuresEmployer {
  name: string | null;
}

export interface EuresSalary {
  minimumSalary: number | null;
  maximumSalary: number | null;
  currencyCode: string | null;
  payingIntervalCode: string | null;
}

export interface EuresRemunerationPackage {
  salaries?: EuresSalary[];
}

export interface EuresPositionLanguage {
  languageCode: string;
  requiredSkillLevel: string | null;
}

/** A single job summary as returned inline by the search endpoint. */
export interface EuresSearchJv {
  id: string;
  title: string | null;
  description: string | null;
}

export interface EuresSearchResponse {
  numberRecords: number;
  jvs: EuresSearchJv[];
}

/** ISO 639 language code paired with the highest CEFR level the search should match. */
export interface EuresRequiredLanguage {
  isoCode: string;
  level: string;
}

export interface EuresSearchRequest {
  resultsPerPage: number;
  page: number;
  sortSearch: "BEST_MATCH";
  keywords: { keyword: string; specificSearchCode: "EVERYWHERE" }[];
  publicationPeriod: null;
  occupationUris: string[];
  skillUris: string[];
  requiredExperienceCodes: string[];
  positionScheduleCodes: string[];
  sectorCodes: string[];
  educationAndQualificationLevelCodes: string[];
  positionOfferingCodes: string[];
  locationCodes: string[];
  euresFlagCodes: string[];
  otherBenefitsCodes: string[];
  requiredLanguages: EuresRequiredLanguage[];
  minNumberPost: null;
  userPreferredLanguage: null;
  requestLanguage: string;
}

/**
 * The full per-language job profile returned by the detail endpoint.
 * EURES omits falsy/empty fields entirely rather than sending `false`/`[]`,
 * so every array and boolean here must be treated as possibly absent.
 */
export interface EuresJvProfile {
  title: string | null;
  description: string | null;
  positionOfferingCode: string | null;
  positionScheduleCodes?: string[];
  locations?: EuresLocation[];
  employer: EuresEmployer | null;
  offeredRemunerationPackage: EuresRemunerationPackage | null;
  applicationInstructions?: string[];
  positionLanguages?: EuresPositionLanguage[];
  remoteWorkAllowed?: boolean;
  lastApplicationDate: number | null;
}

export interface EuresDetailResponse {
  id: string;
  creationDate: number | null;
  preferredLanguage: string;
  jvProfiles: Record<string, EuresJvProfile>;
}

/** Raw i18n translation dictionary: flat key -> label. */
export type ReferenceDictionary = Record<string, string>;
