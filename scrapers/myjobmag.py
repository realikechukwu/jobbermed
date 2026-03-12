#!/usr/bin/env python3
"""MyJobMag scraper"""

import re
import time
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .base import BaseScraper
from config import SCRAPER_CONFIG
from utils import (
    NIGERIAN_LOCATIONS, #clean_ad_content,
    extract_email,
    extract_first_match,
    extract_location,
    extract_phone,
    DEADLINE_PATTERNS,
    EXPERIENCE_PATTERNS,
    JOB_TYPE_PATTERNS,
    QUALIFICATION_PATTERNS,
    SALARY_PATTERNS,
)


class MyJobMagScraper(BaseScraper):
    name = "myjobmag"
    base_url = "https://www.myjobmag.com"
    field_url = "https://www.myjobmag.com/jobs-by-field/medical"
    industry_url = "https://www.myjobmag.com/jobs-by-industry/medical"

    def __init__(self):
        super().__init__()
        self.config = SCRAPER_CONFIG.get(self.name, {})
        self.rate_limit = self.config.get("rate_limit", 2.0)
        self.max_pages = self.config.get("max_pages", 5)

    def _norm_title(self, text: str) -> str:
        return re.sub(r"\s+", " ", (text or "").strip()).lower()

    def _page_url(self, base_url: str, page: int) -> str:
        return base_url if page == 1 else f"{base_url}/{page}"

    def _clean(self, text: str) -> str:
        return re.sub(r"\s+", " ", (text or "").strip())

    def _normalize_date(self, text: str) -> str:
        if not text:
            return ""
        text = self._clean(text)
        text = re.sub(r"(?i)^(posted|deadline):\s*", "", text).strip()

        from datetime import datetime

        for fmt in ("%b %d, %Y", "%B %d, %Y"):
            try:
                return datetime.strptime(text, fmt).date().isoformat()
            except ValueError:
                pass
        return text

    def scrape_listing_page(self, url: str, source_kind: str, page: int) -> list[dict]:
        html = self.get_page(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "html.parser")
        jobs = []

        for a in soup.select("li.job-list-li h2 a[href]"):
            title = self._clean(a.get_text(" ", strip=True))
            link = urljoin(url, a.get("href", "").strip())
            if not title or not link:
                continue

            jobs.append({
                "title": title,
                "link": link,
                "source_kind": source_kind,
                "listing_page": page,
                "_norm_title": self._norm_title(title),
            })

        return jobs

    def _extract_deadline(self, soup: BeautifulSoup) -> str:
        for node in soup.select("div.read-date-sec-li"):
            text = self._clean(node.get_text(" ", strip=True))
            if "deadline" in text.lower():
                return self._normalize_date(text)
        return ""

    def _extract_posted_date(self, soup: BeautifulSoup) -> str:
        node = soup.select_one("#posted-date")
        return self._normalize_date(node.get_text(" ", strip=True)) if node else ""

    def _extract_title(self, soup: BeautifulSoup) -> str:
        node = soup.select_one("li.read-head h1") or soup.select_one("h1")
        return self._clean(node.get_text(" ", strip=True)) if node else ""

    def _extract_main_block(self, soup: BeautifulSoup):
        return soup.select_one("#printable") or soup.select_one(".job-description")

    def scrape_job_details(self, url: str) -> dict:
        html = self.get_page(url)
        if not html:
            return {}

        soup = BeautifulSoup(html, "html.parser")
        #soup = clean_ad_content(soup)

        title_on_page = self._extract_title(soup)
        posted_date = self._extract_posted_date(soup)
        deadline = self._extract_deadline(soup)

        main = self._extract_main_block(soup)
        if not main:
            return {
                "title_on_page": title_on_page,
                "posted_date": posted_date,
                "deadline": deadline,
                "description": "",
                "location": "",
                "salary": "",
                "requirements": "",
                "responsibilities": "",
                "how_to_apply": "",
                "experience": "",
                "qualification": "",
                "job_type": "",
                "company": "",
                "email": "",
                "phone": "",
                "website": "",
                "contact_info": "",
                "raw_content": "",
            }

        for bad in main.select("script, style, noscript"):
            bad.decompose()

        full_text = main.get_text("\n", strip=True)
        full_text = re.sub(r"\n{2,}", "\n\n", full_text).strip()

        details = {
            "title_on_page": title_on_page,
            "posted_date": posted_date,
            "deadline": deadline,
            "description": full_text[:3000],
            "location": extract_location(full_text, NIGERIAN_LOCATIONS) or "",
            "salary": extract_first_match(SALARY_PATTERNS, full_text) or "",
            "requirements": "",
            "responsibilities": "",
            "how_to_apply": "",
            "experience": extract_first_match(EXPERIENCE_PATTERNS, full_text) or "",
            "qualification": extract_first_match(QUALIFICATION_PATTERNS, full_text) or "",
            "job_type": extract_first_match(JOB_TYPE_PATTERNS, full_text) or "",
            "company": "",
            "email": extract_email(full_text) or "",
            "phone": extract_phone(full_text) or "",
            "website": "",
            "contact_info": "",
            "raw_content": full_text[:5000],
        }

        company_match = re.search(r"\bat\s+(.+)$", title_on_page or "", re.I)
        if company_match:
            details["company"] = company_match.group(1).strip(" -–|:")

        req_match = re.search(
            r"(?:requirements?|qualifications?(?:\s+and\s+experience)?)[:\s]*(.*?)(?=responsibilities|job summary|summary|method of application|how to apply|deadline|$)",
            full_text,
            re.I | re.S,
        )
        if req_match and len(req_match.group(1).strip()) > 20:
            details["requirements"] = req_match.group(1).strip()[:2000]

        resp_match = re.search(
            r"(?:responsibilities?|duties)[:\s]*(.*?)(?=requirements|qualifications|method of application|how to apply|deadline|$)",
            full_text,
            re.I | re.S,
        )
        if resp_match and len(resp_match.group(1).strip()) > 20:
            details["responsibilities"] = req_match.group(1).strip()[:2000] if False else resp_match.group(1).strip()[:2000]

        apply_match = re.search(
            r"(?:method of application|how to apply)[:\s]*(.*?)(?=note:|deadline|closing date|$)",
            full_text,
            re.I | re.S,
        )
        if apply_match and len(apply_match.group(1).strip()) > 10:
            details["how_to_apply"] = apply_match.group(1).strip()[:1000]

        contact_bits = [x for x in [details["email"], details["phone"]] if x]
        details["contact_info"] = " / ".join(contact_bits)

        return details

    def run(self) -> list[dict]:
        print(f"\n📋 Collecting MyJobMag links from field + industry ({self.max_pages} pages each)...")

        listing_sources = [
            ("field", self.field_url),
            ("industry", self.industry_url),
        ]

        deduped = {}
        for source_kind, base_url in listing_sources:
            print(f"\n  Source: {source_kind}")
            for page in range(1, self.max_pages + 1):
                url = self._page_url(base_url, page)
                print(f"    Page {page}/{self.max_pages}...", end=" ")

                jobs = self.scrape_listing_page(url, source_kind, page)
                if not jobs:
                    print("No more jobs.")
                    break

                added = 0
                for job in jobs:
                    key = job["_norm_title"]
                    if key not in deduped:
                        deduped[key] = job
                        added += 1

                print(f"✅ {len(jobs)} found, {added} new")

                if page < self.max_pages:
                    time.sleep(self.rate_limit)

        job_links = list(deduped.values())

        print(f"\n📊 Total deduped links: {len(job_links)}")
        print("🔍 Fetching details...")

        all_jobs = []
        for i, job in enumerate(job_links, 1):
            print(f"  [{i}/{len(job_links)}] {job['title'][:50]}...", end=" ")

            details = self.scrape_job_details(job["link"])

            full_job = {
                "title": details.get("title_on_page") or job["title"],
                "company": details.get("company", ""),
                "location": details.get("location", ""),
                "state": "",
                "country": "Nigeria",
                "job_type": details.get("job_type", ""),
                "salary": details.get("salary", ""),
                "posted_date": details.get("posted_date", ""),
                "deadline": details.get("deadline", ""),
                "description": details.get("description", ""),
                "requirements": details.get("requirements", ""),
                "responsibilities": details.get("responsibilities", ""),
                "how_to_apply": details.get("how_to_apply", ""),
                "experience": details.get("experience", ""),
                "qualification": details.get("qualification", ""),
                "email": details.get("email", ""),
                "phone": details.get("phone", ""),
                "website": details.get("website", ""),
                "contact_info": details.get("contact_info", ""),
                "raw_content": details.get("raw_content", ""),
                "link": job["link"],
            }

            all_jobs.append(self._add_metadata(full_job))
            print("✅")

            if i < len(job_links):
                time.sleep(self.rate_limit)

        print(f"✅ Scraped {len(all_jobs)} jobs")
        return all_jobs