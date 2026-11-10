#!/usr/bin/env node
// Post-build SEO step. GitHub Pages serves unknown paths through 404.html with
// a 404 status, which keeps SPA routes out of search indexes. This writes a
// real HTML file (200 status) for every public route and every live job, each
// with its own title, description, canonical URL, structured data and a
// crawlable copy of the content, then writes sitemap.xml.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://jobbermed.com";
const DIST = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const template = readFileSync(join(DIST, "index.html"), "utf8");
const payload = JSON.parse(readFileSync(join(DIST, "data", "master_jobs.json"), "utf8"));
const rawJobs = Array.isArray(payload) ? payload : Array.isArray(payload.jobs) ? payload.jobs : [];

// Keep in sync with ROUTE_META in src/lib/seo.ts.
const PUBLIC_PAGES = [
  {
    path: "/about",
    title: "About JobberMed | Healthcare Job Board for Nigeria & Africa",
    description:
      "JobberMed gathers healthcare vacancies from trusted job boards so clinicians and allied health professionals across Nigeria and Africa can find roles faster.",
    heading: "About JobberMed",
  },
  {
    path: "/privacy",
    title: "Privacy Policy | JobberMed",
    description: "How JobberMed collects, uses and protects your personal information.",
    heading: "Privacy Policy",
  },
  {
    path: "/landing",
    title: "Find Healthcare Jobs Faster | JobberMed",
    description:
      "One place to find jobs for doctors, nurses, pharmacists and allied health professionals. Filter by specialty and location.",
    heading: "Find healthcare jobs faster",
  },
  {
    path: "/signup",
    title: "Create Your Free Account | JobberMed",
    description: "Sign up to save healthcare jobs, set preferences and apply directly on JobberMed.",
    heading: "Create your free JobberMed account",
  },
  {
    path: "/signin",
    title: "Sign In | JobberMed",
    description: "Sign in to your JobberMed account to manage saved jobs and applications.",
    heading: "Sign in to JobberMed",
  },
];

const EMPLOYMENT_TYPES = [
  [/full/i, "FULL_TIME"],
  [/part/i, "PART_TIME"],
  [/contract|locum/i, "CONTRACTOR"],
  [/temp/i, "TEMPORARY"],
  [/intern|house\s*officer/i, "INTERN"],
  [/volunt/i, "VOLUNTEER"],
];

const text = (value) => (value === null || value === undefined ? "" : String(value).trim());
const list = (value) => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);
const esc = (value) =>
  text(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;

// Mirrors getJobSlug() in src/features/aggregator-jobs/utils.ts so the URL
// written here is the one the app resolves.
function getJobSlug(job) {
  const match = text(job.apply_url).match(/[^/]+$/);
  if (match) {
    return match[0];
  }
  return (text(job.job_title) || "job")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

function isExpired(deadline) {
  const date = new Date(text(deadline));
  if (!text(deadline) || Number.isNaN(date.getTime())) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

const isoDate = (value) => (/^\d{4}-\d{2}-\d{2}/.test(text(value)) ? text(value).slice(0, 10) : "");

function renderPage({ path, title, description, headExtra = "", body, noindex = false }) {
  const canonical = `${SITE_URL}${path}`;
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, `$1${esc(title)}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, `$1${esc(description)}$2`)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/, `$1${canonical}$2`)
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${canonical}$2`);

  if (noindex) {
    html = html.replace(/(<meta\s+name="robots"\s+content=")[^"]*(")/, "$1noindex$2");
  }

  return html
    .replace("<!--seo:head-->", headExtra)
    .replace("<!--seo:body-->", body ? `<div style="${SHELL_STYLE}">${body}</div>` : "");
}

// Shown only until the app mounts and replaces it.
const SHELL_STYLE =
  "max-width:760px;margin:0 auto;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.55;color:#1d1d1f";

function writePage(path, html) {
  const file = path === "/" ? join(DIST, "index.html") : join(DIST, path, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function jobHeadline(job) {
  const role = text(job.job_title) || "Healthcare job";
  const company = text(job.company);
  const place = text(job.location);
  return { role, company, place };
}

function jobBody(job) {
  const { role, company, place } = jobHeadline(job);
  const facts = [
    ["Employer", company],
    ["Location", place],
    ["Job type", text(job.job_type)],
    ["Salary", text(job.salary)],
    ["Experience", text(job.experience)],
    ["Qualification", text(job.qualification)],
    ["Posted", isoDate(job.date_posted)],
    ["Closes", isoDate(job.deadline)],
  ].filter(([, value]) => value);
  const section = (heading, items) =>
    items.length ? `<h2>${heading}</h2><ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : "";

  return [
    `<nav><a href="/">JobberMed</a> &rsaquo; <a href="/">Healthcare jobs</a></nav>`,
    `<h1>${esc(role)}${company ? ` at ${esc(company)}` : ""}</h1>`,
    `<dl>${facts.map(([label, value]) => `<dt><strong>${label}</strong></dt><dd>${esc(value)}</dd>`).join("")}</dl>`,
    section("Responsibilities", list(job.responsibilities)),
    section("Requirements", list(job.requirements)),
    text(job.how_to_apply) ? `<h2>How to apply</h2><p>${esc(job.how_to_apply)}</p>` : "",
    `<p><a href="/">Browse all healthcare jobs on JobberMed</a></p>`,
  ].join("");
}

function jobStructuredData(job, url) {
  const { role, company, place } = jobHeadline(job);
  const datePosted = isoDate(job.date_posted);
  if (!company || !place || !datePosted) {
    return ""; // Google requires all three for JobPosting.
  }

  const parts = place.split(",").map((part) => part.trim()).filter(Boolean);
  const country = parts.length > 1 ? parts[parts.length - 1] : /nigeria/i.test(place) ? "Nigeria" : "";
  const description = [
    `<p>${esc(role)} at ${esc(company)}, ${esc(place)}.</p>`,
    list(job.responsibilities).length
      ? `<p><strong>Responsibilities</strong></p><ul>${list(job.responsibilities).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
      : "",
    list(job.requirements).length
      ? `<p><strong>Requirements</strong></p><ul>${list(job.requirements).map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
      : "",
  ].join("");
  const employmentType = EMPLOYMENT_TYPES.find(([pattern]) => pattern.test(text(job.job_type)))?.[1];
  const validThrough = isoDate(job.deadline);

  const posting = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role,
    description,
    datePosted,
    ...(validThrough ? { validThrough: `${validThrough}T23:59:59+01:00` } : {}),
    ...(employmentType ? { employmentType } : {}),
    hiringOrganization: { "@type": "Organization", name: company },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: parts.length > 1 ? parts.slice(0, -1).join(", ") : place,
        ...(country ? { addressCountry: country } : {}),
      },
    },
    industry: "Healthcare",
    directApply: false,
    url,
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Healthcare jobs", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: role, item: url },
    ],
  };
  return jsonLd(posting) + jsonLd(breadcrumbs);
}

// ---- jobs -----------------------------------------------------------------
const seen = new Set();
const jobPages = [];
for (const job of rawJobs) {
  // Mirrors getJobPageSlug() in the app. Anything that still is not a clean
  // path segment stays reachable in the app through ?job=.
  const slug = getJobSlug(job)
    .replace(/[?#].*$/, "")
    .replace(/\.html?$/i, "");
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(slug) || seen.has(slug) || isExpired(job.deadline)) {
    continue;
  }
  seen.add(slug);
  jobPages.push({ job, slug, path: `/jobs/${slug}` });
}

for (const { job, path } of jobPages) {
  const { role, company, place } = jobHeadline(job);
  writePage(
    path,
    renderPage({
      path,
      title: `${role}${company ? ` at ${company}` : ""}${place ? `, ${place}` : ""} | JobberMed`,
      description: `${role}${company ? ` at ${company}` : ""}${place ? ` in ${place}` : ""}. See requirements, responsibilities and how to apply on JobberMed.`,
      headExtra: jobStructuredData(job, `${SITE_URL}${path}`),
      body: jobBody(job),
    }),
  );
}

// ---- static routes --------------------------------------------------------
for (const page of PUBLIC_PAGES) {
  writePage(
    page.path,
    renderPage({
      ...page,
      body: `<h1>${esc(page.heading)}</h1><p>${esc(page.description)}</p><p><a href="/">Browse healthcare jobs on JobberMed</a></p>`,
    }),
  );
}

// ---- 404 fallback (also boots the app for signed-in routes) ----------------
writeFileSync(
  join(DIST, "404.html"),
  renderPage({ path: "/", title: "JobberMed", description: "Healthcare jobs in Nigeria and across Africa.", noindex: true }),
);

// ---- home -----------------------------------------------------------------
const latest = [...jobPages]
  .sort((a, b) => text(b.job.date_posted).localeCompare(text(a.job.date_posted)))
  .slice(0, 60);
const homeDescription = template.match(/<meta\s+name="description"\s+content="([^"]*)"/)[1];
const homeItemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Latest healthcare jobs",
  itemListElement: latest.slice(0, 30).map(({ path }, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${SITE_URL}${path}`,
  })),
};
writePage(
  "/",
  template
    .replace("<!--seo:head-->", jsonLd(homeItemList))
    .replace(
      "<!--seo:body-->",
      `<div style="${SHELL_STYLE}"><h1>Healthcare jobs across Nigeria and Africa</h1><p>${homeDescription}</p><h2>Latest jobs</h2><ul>${latest
        .map(({ job, path }) => {
          const { role, company, place } = jobHeadline(job);
          return `<li><a href="${path}">${esc(role)}</a>${company ? `, ${esc(company)}` : ""}${place ? ` (${esc(place)})` : ""}</li>`;
        })
        .join("")}</ul></div>`,
    ),
);

// ---- sitemap --------------------------------------------------------------
const today = new Date().toISOString().slice(0, 10);
const urls = [
  { loc: "/", lastmod: today, changefreq: "daily", priority: "1.0" },
  ...PUBLIC_PAGES.filter((page) => page.path !== "/signin").map((page) => ({
    loc: page.path,
    changefreq: "monthly",
    priority: "0.4",
  })),
  ...jobPages.map(({ job, path }) => ({
    loc: path,
    lastmod: isoDate(job.date_posted) || today,
    changefreq: "weekly",
    priority: "0.8",
  })),
];
writeFileSync(
  join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) =>
        `  <url><loc>${SITE_URL}${esc(url.loc)}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}<changefreq>${url.changefreq}</changefreq><priority>${url.priority}</priority></url>`,
    )
    .join("\n")}\n</urlset>\n`,
);

console.log(
  `SEO prerender: ${jobPages.length} job pages (${rawJobs.length - jobPages.length} skipped), ${PUBLIC_PAGES.length} static pages, sitemap with ${urls.length} URLs.`,
);
