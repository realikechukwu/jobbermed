export type JobTypeOption = {
  value: string;
  label: string;
};

export const JOB_TYPE_OPTIONS: JobTypeOption[] = [
  { value: "full_time", label: "Full time" },
  { value: "part_time", label: "Part time" },
  { value: "contract", label: "Contract" },
  { value: "locum", label: "Locum" },
];

const LABEL_BY_VALUE = new Map<string, string>(JOB_TYPE_OPTIONS.map((option) => [option.value, option.label]));

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

export function normalizeJobTypeValue(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, "_");
  if (!cleaned) {
    return "";
  }

  if (cleaned === "fulltime") return "full_time";
  if (cleaned === "parttime") return "part_time";
  return cleaned;
}

export function getJobTypeLabel(value: string): string {
  const normalized = normalizeJobTypeValue(value);
  const label = LABEL_BY_VALUE.get(normalized);
  if (label) {
    return label;
  }
  return toTitleCase(normalized.replace(/_/g, " "));
}
