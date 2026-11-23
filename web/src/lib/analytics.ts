type AnalyticsProperties = Record<string, string | number | boolean>;

const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim();
const ingestHost = import.meta.env.VITE_POSTHOG_HOST?.trim().replace(/\/$/, "");
const idleLimit = 30 * 60 * 1000;
const sessionLimit = 24 * 60 * 60 * 1000;
const campaignKeys = ["utm_source", "utm_medium", "utm_campaign"] as const;
const socialDomains = /(^|\.)(facebook\.com|instagram\.com|linkedin\.com|t\.co|x\.com|twitter\.com|reddit\.com|tiktok\.com|youtube\.com|whatsapp\.com|threads\.net|telegram\.me|t\.me)$/;
const searchDomains = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org|search\.brave\.com)$/;

type Visit = {
  id: string;
  startedAt: number;
  lastEventAt: number;
  properties: AnalyticsProperties;
};

let currentVisit: Visit | undefined;

function analyticsEnabled() {
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean };
  return Boolean(projectToken && ingestHost && typeof globalThis.crypto?.randomUUID === "function" &&
    privacy.doNotTrack !== "1" && !privacy.globalPrivacyControl);
}

function campaignTag(value: string | null): string | undefined {
  const tag = value?.trim().toLowerCase();
  return tag && /^[a-z0-9][a-z0-9_-]{0,63}$/.test(tag) && !/\d{7,}/.test(tag) ? tag : undefined;
}

function getReferringDomain(): string {
  try {
    const referrer = new URL(document.referrer);
    if (!/^https?:$/.test(referrer.protocol)) return "";
    const domain = referrer.hostname.replace(/^www\./, "");
    return domain === window.location.hostname.replace(/^www\./, "") ? "" : domain;
  } catch {
    return "";
  }
}

function entryAttribution(): AnalyticsProperties {
  const query = new URLSearchParams(window.location.search);
  const campaign = Object.fromEntries(campaignKeys.flatMap((key) => {
    const tag = campaignTag(query.get(key));
    return tag ? [[key, tag]] : [];
  }));
  const domain = getReferringDomain();
  const medium = campaign.utm_medium;

  let channel = domain ? "referral" : "direct";
  if (medium === "email") channel = "email";
  else if (/^(cpc|ppc|paid|paid_social|paid_search|display)$/.test(medium ?? "")) channel = "paid";
  else if (/^(social|social_media|organic_social)$/.test(medium ?? "") || socialDomains.test(domain)) channel = "social";
  else if (/^(organic|organic_search|search)$/.test(medium ?? "") || searchDomains.test(domain)) channel = "organic search";
  else if (campaign.utm_source || medium) channel = "campaign";

  return { ...campaign, ...(domain ? { $referring_domain: domain } : {}), traffic_channel: channel };
}

function analyticsVisit(now: number): Visit | undefined {
  if (!analyticsEnabled()) return undefined;

  if (!currentVisit || now - currentVisit.lastEventAt >= idleLimit || now - currentVisit.startedAt >= sessionLimit) {
    // PostHog sessions use UUIDv7. Keep the random suffix and variant from randomUUID.
    const timestamp = now.toString(16).padStart(12, "0");
    const id = `${timestamp.slice(0, 8)}-${timestamp.slice(8)}-7${crypto.randomUUID().slice(15)}`;
    currentVisit = { id, startedAt: now, lastEventAt: now, properties: entryAttribution() };
  }
  currentVisit.lastEventAt = now;
  return currentVisit;
}

export function getAnalyticsVisitorId() {
  return analyticsVisit(Date.now())?.id;
}

export function captureEvent(event: string, properties: AnalyticsProperties, distinctId?: string) {
  const now = Date.now();
  const visit = analyticsVisit(now);
  if (!visit) return;

  // Confirmation can occur in a later visit. Keep its original funnel identity.
  const sameVisit = !distinctId || distinctId === visit.id;
  void fetch(`${ingestHost}/i/v0/e/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    referrerPolicy: "no-referrer",
    keepalive: true,
    body: JSON.stringify({
      api_key: projectToken,
      event,
      distinct_id: distinctId ?? visit.id,
      timestamp: new Date(now).toISOString(),
      properties: {
        ...(sameVisit ? { ...visit.properties, $session_id: visit.id } : {}),
        ...properties,
        environment: window.location.hostname === "jobbermed.com" ? "production" : "development",
        $process_person_profile: false,
        $geoip_disable: true,
      },
    }),
  }).catch(() => undefined);
}
