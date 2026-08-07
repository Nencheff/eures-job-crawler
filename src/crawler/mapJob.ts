import { JOB_DETAILS_URL } from "../config.js";
import type { EuresDetailResponse, EuresJvProfile, EuresSalary } from "../api/euresTypes.js";
import type { ReferenceData } from "../api/referenceData.js";
import type { Job } from "../models/Job.js";
import { firstHref, htmlToText } from "../utils/html.js";
import { extractSection } from "../utils/textSections.js";

const toDateOnly = (epochMs: number | null): string | null =>
  epochMs ? new Date(epochMs).toISOString().slice(0, 10) : null;

const formatSalary = (salary: EuresSalary | undefined): string | null => {
  if (!salary) return null;
  const { minimumSalary, maximumSalary, currencyCode, payingIntervalCode } = salary;
  if (minimumSalary === null && maximumSalary === null) return null;

  const range =
    minimumSalary !== null && maximumSalary !== null && minimumSalary !== maximumSalary
      ? `${minimumSalary}-${maximumSalary}`
      : String(minimumSalary ?? maximumSalary);
  const currency = currencyCode ? ` ${currencyCode}` : "";
  const interval = payingIntervalCode ? `/${payingIntervalCode}` : "";

  return `${range}${currency}${interval}`;
};

const formatLanguages = (profile: EuresJvProfile, reference: ReferenceData): string | null => {
  const labels = (profile.positionLanguages ?? [])
    .map(({ languageCode, requiredSkillLevel }) => {
      const name = reference.languageName(languageCode) ?? languageCode.toUpperCase();
      return requiredSkillLevel ? `${name} (${requiredSkillLevel.toUpperCase()})` : name;
    })
    .filter((label) => label.length > 0);

  return labels.length > 0 ? labels.join(", ") : null;
};

const deriveLocation = (
  profile: EuresJvProfile,
  reference: ReferenceData,
): Pick<Job, "country" | "city" | "locationRaw"> => {
  const location = profile.locations?.[0];
  if (!location) return { country: null, city: null, locationRaw: null };

  const country = reference.countryName(location.countryCode);
  const city = location.cityName ?? reference.regionName(location.region);
  const locationRaw = [city, country].filter(Boolean).join(", ") || null;

  return { country, city, locationRaw };
};

const selectProfile = (detail: EuresDetailResponse): EuresJvProfile | null =>
  detail.jvProfiles[detail.preferredLanguage] ?? Object.values(detail.jvProfiles)[0] ?? null;

export const mapJobDetail = (
  detail: EuresDetailResponse,
  keyword: string,
  reference: ReferenceData,
): Job | null => {
  const profile = selectProfile(detail);
  if (!profile) return null;

  const description = htmlToText(profile.description);
  const applyInstructionsHtml = (profile.applicationInstructions ?? []).join(" ");

  return {
    source: "EURES",
    sourceId: detail.id,
    keyword,

    title: profile.title,
    company: profile.employer?.name ?? null,

    ...deriveLocation(profile, reference),

    remote: profile.remoteWorkAllowed ?? null,
    hybrid: null,
    onsite: null,

    employmentType: reference.employmentTypeLabel(profile.positionScheduleCodes ?? []),
    contractType: reference.contractTypeLabel(profile.positionOfferingCode),

    publicationDate: toDateOnly(detail.creationDate),
    expirationDate: toDateOnly(profile.lastApplicationDate),

    salary: formatSalary(profile.offeredRemunerationPackage?.salaries?.[0]),
    languages: formatLanguages(profile, reference),

    description,
    requirements: description
      ? extractSection(description, ["Requirements", "Candidate requirements", "Profile"])
      : null,
    benefits: description
      ? extractSection(description, ["Benefits", "We offer", "What we offer"])
      : null,

    jobUrl: `${JOB_DETAILS_URL}/${detail.id}?lang=en`,
    applyUrl: firstHref(applyInstructionsHtml),

    crawledAt: new Date().toISOString(),
  };
};
