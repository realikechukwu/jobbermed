export type NativeJobAdvertMeta = {
  companyName: string | null;
  contactInfo: string | null;
  description: string;
};

const META_START = "[jobbermed-meta]";
const META_END = "[/jobbermed-meta]";
const META_BLOCK_PATTERN = /\[jobbermed-meta\]\s*([\s\S]*?)\s*\[\/jobbermed-meta\]\s*/i;

function toOptionalTrimmed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function composeNativeJobDescription(description: string, companyName: string, contactInfo: string): string {
  const normalizedDescription = description.trim();
  const normalizedCompany = toOptionalTrimmed(companyName);
  const normalizedContact = toOptionalTrimmed(contactInfo);

  if (!normalizedCompany && !normalizedContact) {
    return normalizedDescription;
  }

  const metaLines = [
    normalizedCompany ? `company:${normalizedCompany}` : null,
    normalizedContact ? `contact:${normalizedContact}` : null,
  ].filter((line): line is string => Boolean(line));

  const content = [META_START, ...metaLines, META_END];
  if (normalizedDescription) {
    content.push(normalizedDescription);
  }

  return content.join("\n");
}

export function parseNativeJobAdvertMeta(value: string): NativeJobAdvertMeta {
  const match = value.match(META_BLOCK_PATTERN);

  if (!match) {
    return {
      companyName: null,
      contactInfo: null,
      description: value.trim(),
    };
  }

  let companyName: string | null = null;
  let contactInfo: string | null = null;

  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) continue;

    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const parsedValue = line.slice(separatorIndex + 1).trim();

    if (!parsedValue) continue;
    if (key === "company") companyName = parsedValue;
    if (key === "contact") contactInfo = parsedValue;
  }

  const description = value.replace(META_BLOCK_PATTERN, "").trim();

  return {
    companyName,
    contactInfo,
    description,
  };
}
