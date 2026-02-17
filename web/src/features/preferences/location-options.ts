export const LOCATION_TOKEN_ALL_STATES = "all_states";
export const LOCATION_TOKEN_REMOTE = "remote";
export const LOCATION_TOKEN_OUTSIDE_NIGERIA = "outside_nigeria";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

export type LocationOption = {
  value: string;
  label: string;
  kind: "special" | "state";
};

function slugify(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "_");
}

export const SPECIAL_LOCATION_OPTIONS: LocationOption[] = [
  { value: LOCATION_TOKEN_ALL_STATES, label: "All states", kind: "special" },
  { value: LOCATION_TOKEN_REMOTE, label: "Remote", kind: "special" },
  { value: LOCATION_TOKEN_OUTSIDE_NIGERIA, label: "Outside Nigeria", kind: "special" },
];

export const STATE_LOCATION_OPTIONS: LocationOption[] = [
  { value: "fct", label: "FCT", kind: "state" },
  ...NIGERIAN_STATES.map((state) => ({
    value: slugify(state),
    label: state,
    kind: "state" as const,
  })),
];

const STATE_VALUES = new Set(STATE_LOCATION_OPTIONS.map((option) => option.value));
const LABEL_BY_VALUE = new Map<string, string>(
  [...SPECIAL_LOCATION_OPTIONS, ...STATE_LOCATION_OPTIONS].map((option) => [option.value, option.label]),
);

const LEGACY_ALIASES = new Map<string, string>([
  ["all states", LOCATION_TOKEN_ALL_STATES],
  ["all nigeria states", LOCATION_TOKEN_ALL_STATES],
  ["nigeria", LOCATION_TOKEN_ALL_STATES],
  ["nationwide", LOCATION_TOKEN_ALL_STATES],
  ["fct", "fct"],
  ["abuja", "fct"],
  ["remote", LOCATION_TOKEN_REMOTE],
  ["work from home", LOCATION_TOKEN_REMOTE],
  ["wfh", LOCATION_TOKEN_REMOTE],
  ["outside nigeria", LOCATION_TOKEN_OUTSIDE_NIGERIA],
  ["international", LOCATION_TOKEN_OUTSIDE_NIGERIA],
]);

export function isKnownLocationValue(value: string): boolean {
  return LABEL_BY_VALUE.has(value);
}

export function getLocationLabel(value: string): string {
  return LABEL_BY_VALUE.get(value) ?? value;
}

function normalizeLocationValue(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) {
    return "";
  }

  if (LEGACY_ALIASES.has(cleaned)) {
    return LEGACY_ALIASES.get(cleaned) ?? "";
  }

  const asSlug = cleaned.replace(/\s+/g, "_");
  if (LABEL_BY_VALUE.has(asSlug)) {
    return asSlug;
  }

  return cleaned;
}

function sortByKnownOrder(values: string[]): string[] {
  const knownOrder = [...SPECIAL_LOCATION_OPTIONS, ...STATE_LOCATION_OPTIONS].map((option) => option.value);
  const orderMap = new Map<string, number>(knownOrder.map((value, index) => [value, index]));

  return [...values].sort((a, b) => {
    const orderA = orderMap.get(a);
    const orderB = orderMap.get(b);

    if (orderA === undefined && orderB === undefined) {
      return a.localeCompare(b);
    }
    if (orderA === undefined) {
      return 1;
    }
    if (orderB === undefined) {
      return -1;
    }
    return orderA - orderB;
  });
}

export function normalizeLocationSelections(values: string[]): string[] {
  const deduped = new Set<string>();

  values.forEach((value) => {
    const normalized = normalizeLocationValue(value);
    if (!normalized) {
      return;
    }
    deduped.add(normalized);
  });

  if (deduped.has(LOCATION_TOKEN_ALL_STATES)) {
    STATE_VALUES.forEach((stateValue) => deduped.delete(stateValue));
  }

  return sortByKnownOrder([...deduped]);
}

export function toggleLocationSelection(currentValues: string[], selectedValue: string): string[] {
  const normalizedCurrent = new Set(normalizeLocationSelections(currentValues));

  if (normalizedCurrent.has(selectedValue)) {
    normalizedCurrent.delete(selectedValue);
    return sortByKnownOrder([...normalizedCurrent]);
  }

  if (selectedValue === LOCATION_TOKEN_ALL_STATES) {
    STATE_VALUES.forEach((stateValue) => normalizedCurrent.delete(stateValue));
    normalizedCurrent.add(LOCATION_TOKEN_ALL_STATES);
    return sortByKnownOrder([...normalizedCurrent]);
  }

  if (STATE_VALUES.has(selectedValue)) {
    normalizedCurrent.delete(LOCATION_TOKEN_ALL_STATES);
    normalizedCurrent.add(selectedValue);
    return sortByKnownOrder([...normalizedCurrent]);
  }

  normalizedCurrent.add(selectedValue);
  return sortByKnownOrder([...normalizedCurrent]);
}

export function summarizeLocationSelections(values: string[]): string {
  const normalized = normalizeLocationSelections(values).filter((value) => isKnownLocationValue(value));

  if (normalized.length === 0) {
    return "All locations";
  }

  if (normalized.length === 1) {
    return getLocationLabel(normalized[0]);
  }

  return `${normalized.length} selections`;
}
