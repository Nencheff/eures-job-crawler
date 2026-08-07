export interface Job {
  source: "EURES";
  sourceId: string;
  keyword: string;

  title: string | null;
  company: string | null;

  country: string | null;
  city: string | null;
  locationRaw: string | null;

  remote: boolean | null;
  hybrid: boolean | null;
  onsite: boolean | null;

  employmentType: string | null;
  contractType: string | null;

  publicationDate: string | null;
  expirationDate: string | null;

  salary: string | null;
  languages: string | null;

  description: string | null;
  requirements: string | null;
  benefits: string | null;

  jobUrl: string;
  applyUrl: string | null;

  crawledAt: string;
}
