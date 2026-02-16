export type RawJobRecord = Record<string, unknown>;

export type AggregatedJobsPayload = {
  jobs?: unknown;
};

export type AggregatorJob = {
  job_title: string;
  company: string;
  location: string;
  job_type: string;
  job_category: string;
  salary: string;
  requirements: string[];
  responsibilities: string[];
  date_posted: string;
  deadline: string;
  apply_url: string;
  _source: string;
  _locationBuckets: string[];
  _slug: string;
  _id: string;
};

export type CategoryCounts = Record<string, number>;

export type LocationCounts = Record<string, number>;
