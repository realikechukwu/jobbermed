# Search discoverability runbook

Use this process to make a public website discoverable in Google Search, Bing and ChatGPT Search. Inputs: repository, production URL, hosting/deploy path, the kinds of pages to promote, and access to the site's verified Google and Bing properties. Outputs: code changes, a verified deployment, a console record and a follow-up baseline. The domain, URL conventions and schema rules below must be adapted to each site.

## 1. Establish the baseline

1. Read repository instructions and deploy workflows. Identify the real production host and branch from the workflow and live response headers. Confirm the preferred HTTPS host and URL format, including slash redirects. Start from current upstream; data or content may update independently of code.
2. Inventory URLs by intent: durable public pages, public content that changes or expires, transaction pages, authenticated pages, and retired or invalid URLs. Give each group an intended status code, canonical, index policy and sitemap policy. For instance, a login page may return 200 and `noindex`, while a removed listing returns 404. A robots rule does not secure private data or reliably remove indexed URLs.
3. Fetch `robots.txt`, `sitemap.xml`, representative HTML pages and an intentionally missing route. Record HTTP status, MIME type, redirect target, HTML canonical, robots directives and what the initial HTML actually contains. Compare with a real browser after JavaScript has run. `curl` with a named crawler user agent is a smoke test; it does not prove that crawler's actual network can access the site.
4. In Search Console, use the verified production property. Record the report dates, indexed/excluded totals, top exclusion reasons, sitemap last read and discovered URL count. Inspect representative pages, including one excluded page. In Bing, record property, sitemap status, crawl and indexing diagnostics. Keep account details and credentials out of the repo.

## 2. Fix the causes in priority order

1. **Fetch and render.** Make public content and useful internal links available in initial HTML. Check for bot challenges, accidental `noindex`, soft 404s and blocked scripts. Make rendered behavior agree with the HTTP response. Prefer the existing static or server-rendered stack where it can meet freshness needs.
2. **Choose permanent URLs.** Give real content self-canonicals in HTML, make links and sitemaps use the canonical form, and redirect equivalent host/path variants when supported. Check case collisions, pagination and filters. Filters that only rearrange or subset a board should not mint indexed copies by default. Choose collision identities from reliable source IDs or full URLs with meaningful query parameters.
3. **Improve what a page answers.** Use descriptive headings and label facts precisely. Include provenance, original links and dates where known. Link to useful collections and guides. Keep category/location pages when they serve a distinct search intent; avoid publishing every possible filter combination. Never make up an employer, location, salary or deadline to satisfy schema.
4. **Use schema on eligible pages only.** Match it to human-visible content. For jobs, provide one posting per detail page, an application path, original posted date and verified employer/location details. Leave guessed expiry dates and unverified remote requirements out. Remove expired listings/markup promptly. Keep application/consent pages and internal search results out of the sitemap. Use real content changes for `lastmod` or omit it; Google ignores `priority` and `changefreq`.
5. **Check ChatGPT Search access separately.** Allow `OAI-SearchBot` on the public URLs at both `robots.txt` and the host/CDN. The wildcard group may already allow it. If you add a specific robots group, check which default restrictions it overrides. Consult the published OpenAI IP ranges if the host filters crawlers. `GPTBot` concerns model training and is a separate owner decision. Bing is for Bing visibility and diagnostics; it is not an OpenAI submission console. No special file, new schema or sitemap submission to OpenAI is required by its publisher guidance.

## 3. Validate and deploy

- Build from current upstream. Parse the sitemap and verify each entry points to an actual artifact with one matching canonical and indexable robots directives. Check for invalid XML, case collisions, pages without real content, invalid schema, expiry, and essential internal links. Add recurring artifact checks to the publish pipeline when deployments or data are frequent.
- Test the first response and rendered page for the homepage, a durable content page, one representative listing, one noindex transaction page, and an expired or deliberately missing page. Test modified clicks/links and normal application or account flows if URL handling changed. Use a rich-result tester for a representative `JobPosting`.
- Deploy through the project's normal release path. Record the commit, deployment status and production URLs. Repeat live HTTP checks against the deployed version before submitting. Preserve an active verification method and roll back through the usual release process if public routing breaks.

Example live checks; replace the host and paths:

```bash
curl -fsS -D - https://example.com/robots.txt
curl -fsS -D - https://example.com/sitemap.xml
curl -fsSL -A 'OAI-SearchBot' https://example.com/ -o /tmp/example-home.html
curl -sS -o /dev/null -w '%{http_code}\n' https://example.com/intentionally-missing/
```

## 4. Use the browser consoles

1. Open [Google Search Console](https://search.google.com/search-console) and [Bing Webmaster Tools](https://www.bing.com/webmasters/). Reuse a signed-in session where available. Stop at sign-in or MFA and hand the tab to the owner. Do not request or record passwords, verification codes or session cookies.
2. Select the exact domain or URL-prefix property. If ownership is missing, use the property's approved verification method; domain-wide DNS verification and scoped HTML verification are different. If importing from Google into Bing, get confirmation for the cross-account permission and select only the intended site. Manual Bing verification is also available.
3. Google → **Sitemaps** → enter the canonical production sitemap only if it is missing or needs resubmitting. Keep a successful existing entry; Google rereads it. Use **URL Inspection → Test live URL** to see what Google's inspection crawler can fetch; then **Request indexing** for a small number of important changed URLs if needed. A live test, a request, and actual indexing are three separate outcomes.
4. Bing → **Sitemaps** → check submitted, detected and imported entries for the verified site. Submit the absolute sitemap URL once if needed; record its processing status and **URL Inspection** for a sample. Consider IndexNow later if reliable post-deploy change detection is available. Only send real additions, edits and removals to an indexing API; use Google's API only for eligible page types.
5. Record what the UI actually confirmed, including report date or pending status. After about two weeks, compare Google impressions/indexed pages, rich-result issues, Bing crawling/impressions and ChatGPT referrals tagged `utm_source=chatgpt.com`. Sample both branded and relevant non-branded ChatGPT searches with Search enabled. Record the prompt, date and verified citation URL if shown. A sample is not a rank report or a promise of coverage.

## JobberMed execution record — 15 November 2026

| Check | Starting observation |
| --- | --- |
| Production | `https://jobbermed.com/` on GitHub Pages. Apex HTTPS and trailing slashes on directory URLs; sampled slashless job, HTTP apex and www redirects worked. Unknown job URL returned 404. |
| Crawler access | Live `robots.txt` allowed Google, Bing and OpenAI on public routes via `User-agent: *`. The sample listing returned 200 with ordinary and synthetic crawler user agents. |
| Google Pages, report dated Nov 9 | 3 indexed; 98 not indexed: 81 crawled/currently not indexed, 15 redirect, 1 soft 404, 1 not found. Exclusions are diagnoses, not all defects. |
| Google Sitemaps | `https://jobbermed.com/sitemap.xml` had status **Success**, submitted and last read Nov 10, with 981 discovered URLs. A production GET on Nov 15 contained 989 entries, reflecting different snapshots. |
| Bing | Sign-in screen opened and handed off to the owner. Verification and submission are tracked separately from Google. |

On the original local snapshot, the audit found 15 active case-folded slug collision groups. It also found that none of the 821 generated listing pages had a clickable application link in the raw HTML. Some `JobPosting` descriptions contained no substantive details, and several `addressCountry` values were missing or were actually regions. The changes make job pages and board links use the same source identity and URL resolver, preserve the board's quick-view dialog, add original application links and stable canonicals, and suppress indexing/markup for thin pages. The sitemap and JSON-LD are checked before GitHub Pages uploads the build.

JobberMed local validation:

```bash
npm --prefix web run build
python3 web/scripts/verify-seo.py
./scripts/check_master_jobs_bridge.sh
git diff --check
```

The Nov 15 build contained 895 external listing pages, of which 776 were included in the 882-URL sitemap. The artifact check validated 655 `JobPosting` records. A rendered job detail confirmed the original source link, readable job facts and a matching canonical. Navigating back to the board reset the canonical to the homepage and removed the job's structured data. Lint passed for the changed files; the full repo lint still flags the existing Fast Refresh export warning in the auth session module.

Direct Apply is a separate publication lifecycle. It loads from Supabase and GitHub Pages does not currently generate its public detail HTML. The audited board showed zero Direct Apply roles. Before promoting these URLs to search, make a public-only snapshot at publish/close or use a server route with real status codes. Do not snapshot applicant details, auth state or drafts. Audit original listing links and close unknown-deadline listings when the source reports them closed; the current data cannot prove a source's availability when it omits a deadline.

Official references: [Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Google JobPosting rules](https://developers.google.com/search/docs/appearance/structured-data/job-posting), [Search Console URL Inspection](https://support.google.com/webmasters/answer/9012289), [Bing sitemap help](https://www.bing.com/webmasters/help/sitemaps-3b5cf6ed), [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots), [OpenAI publisher FAQs](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq).
