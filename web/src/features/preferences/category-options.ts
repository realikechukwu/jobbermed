export type CategoryOption = {
  value: string;
  label: string;
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "doctor", label: "Doctors" },
  { value: "nurse", label: "Nurses & Midwives" },
  { value: "pharmacist", label: "Pharmacists" },
  { value: "medical_laboratory_scientist", label: "Medical Laboratory Scientists" },
  { value: "dentist", label: "Dentists" },
  { value: "public_health", label: "Public Health" },
  { value: "healthcare_management", label: "Healthcare Management" },
  { value: "allied_health", label: "Allied Health" },
  { value: "other", label: "Others" },
];

const CATEGORY_ALIASES = new Map<string, string>([
  ["doctor", "doctor"],
  ["doctors", "doctor"],
  ["nurse", "nurse"],
  ["nurses", "nurse"],
  ["nurses & midwives", "nurse"],
  ["nurses and midwives", "nurse"],
  ["midwife", "nurse"],
  ["midwives", "nurse"],
  ["pharmacist", "pharmacist"],
  ["pharmacists", "pharmacist"],
  ["medical laboratory scientist", "medical_laboratory_scientist"],
  ["medical laboratory scientists", "medical_laboratory_scientist"],
  ["dentist", "dentist"],
  ["dentists", "dentist"],
  ["public health", "public_health"],
  ["healthcare management", "healthcare_management"],
  ["allied health", "allied_health"],
  ["other", "other"],
  ["others", "other"],
]);

const LABEL_BY_VALUE = new Map<string, string>(CATEGORY_OPTIONS.map((option) => [option.value, option.label]));
const CATEGORY_ORDER = CATEGORY_OPTIONS.map((option) => option.value);
const ORDER_MAP = new Map(CATEGORY_ORDER.map((value, index) => [value, index]));

function sortByKnownOrder(values: string[]): string[] {
  return [...values].sort((left, right) => {
    const leftOrder = ORDER_MAP.get(left);
    const rightOrder = ORDER_MAP.get(right);

    if (leftOrder === undefined && rightOrder === undefined) {
      return left.localeCompare(right);
    }
    if (leftOrder === undefined) {
      return 1;
    }
    if (rightOrder === undefined) {
      return -1;
    }
    return leftOrder - rightOrder;
  });
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");
}

export function normalizeCategoryValue(raw: string): string {
  const cleaned = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!cleaned) {
    return "";
  }

  if (CATEGORY_ALIASES.has(cleaned)) {
    return CATEGORY_ALIASES.get(cleaned) ?? "";
  }

  return cleaned;
}

export function normalizeCategorySelections(values: string[]): string[] {
  const deduped = new Set<string>();

  values.forEach((value) => {
    const normalized = normalizeCategoryValue(value);
    if (!normalized) {
      return;
    }
    deduped.add(normalized);
  });

  return sortByKnownOrder([...deduped]);
}

export function toggleCategorySelection(currentValues: string[], selectedValue: string): string[] {
  const normalizedSelected = normalizeCategoryValue(selectedValue);
  if (!normalizedSelected) {
    return normalizeCategorySelections(currentValues);
  }

  const normalizedCurrent = new Set(normalizeCategorySelections(currentValues));
  if (normalizedCurrent.has(normalizedSelected)) {
    normalizedCurrent.delete(normalizedSelected);
    return sortByKnownOrder([...normalizedCurrent]);
  }

  normalizedCurrent.add(normalizedSelected);
  return sortByKnownOrder([...normalizedCurrent]);
}

export function getCategoryLabel(value: string): string {
  const normalized = normalizeCategoryValue(value);
  const label = LABEL_BY_VALUE.get(normalized);
  if (label) {
    return label;
  }
  return toTitleCase(normalized.replace(/_/g, " "));
}

export function summarizeCategorySelections(values: string[]): string {
  const normalized = normalizeCategorySelections(values);
  if (normalized.length === 0) {
    return "All categories";
  }

  if (normalized.length === 1) {
    return getCategoryLabel(normalized[0]);
  }

  return `${normalized.length} selections`;
}
