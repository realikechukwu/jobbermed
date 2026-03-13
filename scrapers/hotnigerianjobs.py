#!/usr/bin/env python3
"""Hot Nigerian Jobs scraper"""

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


class HotNigerianJobsScraper(BaseScraper):
    name = "hotnigerianjobs"
    base_url = "https://www.hotnigerianjobs.com"

    # We will cover 246 to 250 as discussed
    field_ids = [246, 247, 248, 249, 250]

    def __init__(self):
        super().__init__()
        self.config = SCRAPER_CONFIG.get(self.name, {})
        self.rate_limit = self.config.get("rate_limit", 6.0)
        self.field_pages = self.config.get("field_pages", {})

    def build_field_page_url(self, field_id: int, page: int) -> str:
        if page == 0:
            return f"{self.base_url}/field/{field_id}/"
        return f"{self.base_url}/field/{field_id}/{page}/"

    def normalize_posted_date(self, value: str) -> str:
        """
        Convert strings like:
        'Posted on Wed 11th Mar, 2026'
        'Posted on Fri 13th Mar, 2026 -'
        into:
        '2026-03-11'
        """
        if not value:
            return ""

        text = value.strip()
        text = re.sub(r"(?i)^posted on\s*", "", text).strip()
        text = re.sub(r"\b(\d+)(st|nd|rd|th)\b", r"\1", text, flags=re.I)
        text = text.replace(",", "").strip()
        text = re.sub(r"\s*[-–—|]+\s*$", "", text).strip()

        from datetime import datetime

        for fmt in (
            "%a %d %b %Y",
            "%A %d %b %Y",
            "%a %d %B %Y",
            "%A %d %B %Y",
            "%d %b %Y",
            "%d %B %Y",
        ):
            try:
                return datetime.strptime(text, fmt).date().isoformat()
            except ValueError:
                continue

        return ""

    def scrape_listing_page(self, url: str, field_id: int, page: int) -> list[dict]:
        """Get job links from listing page"""
        html = self.get_page(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "html.parser")
        jobs = []

        for a in soup.select("div.mycase span.jobheader a[href]"):
            try:
                title = a.get_text(" ", strip=True)
                link = urljoin(url, a.get("href", "").strip())

                if not title or not link:
                    continue

                jobs.append({
                    "title": title,
                    "link": link,
                    "field_id": field_id,
                    "listing_page": page,
                })
            except Exception:
                continue

        return jobs

    def extract_posted_date(self, main) -> str:
        for span in main.select("span.semibio"):
            text = span.get_text(" ", strip=True)
            if re.search(r"(?i)\bposted on\b", text):
                return self.normalize_posted_date(text)
        return ""

    def extract_title(self, soup: BeautifulSoup) -> str:
        selectors = [
            "span.jobheader h1",
            "div.mycase h1",
            "h1",
        ]
        for selector in selectors:
            node = soup.select_one(selector)
            if node:
                text = node.get_text(" ", strip=True)
                if text:
                    return text
        return ""

    def extract_main_block(self, soup: BeautifulSoup):
        selectors = [
            "div.middlecol div.mycase",
            "div.mycase",
        ]
        for selector in selectors:
            node = soup.select_one(selector)
            if node:
                return node
        return None

    def clean_lines(self, lines: list[str]) -> list[str]:
        cleaned = []
        seen = set()

        for line in lines:
            line = " ".join(line.split()).strip()
            if not line:
                continue

            low = line.lower()

            if low.startswith("posted on"):
                continue
            if "hotnigerianjobs.com" in low:
                continue
            if low in {"share this job:", "apply now", "more jobs"}:
                continue

            if line not in seen:
                cleaned.append(line)
                seen.add(line)

        return cleaned

    def scrape_job_details(self, url: str) -> dict:
        """Extract full details from individual job page"""
        html = self.get_page(url)
        if not html:
            return {}

        soup = BeautifulSoup(html, "html.parser")
        #soup = clean_ad_content(soup)

        main = self.extract_main_block(soup)
        if not main:
            return {}

        title_on_page = self.extract_title(soup)
        posted_date = self.extract_posted_date(main)

        lines = [line.strip() for line in main.get_text("\n").splitlines() if line.strip()]
        cleaned_lines = self.clean_lines(lines)
        full_text = "\n".join(cleaned_lines).strip()

        details = {
            "title_on_page": title_on_page,
            "posted_date": posted_date,
            "description": "",
            "location": "",
            "salary": "",
            "requirements": "",
            "responsibilities": "",
            "how_to_apply": "",
            "deadline": "",
            "experience": "",
            "qualification": "",
            "job_type": "",
            "company": "",
            "email": "",
            "phone": "",
            "website": "",
            "contact_info": "",
            "raw_content": full_text[:5000],
        }

        # Company extraction from title pattern: "Job Title at Company"
        title_source = title_on_page or ""
        company_match = re.search(r"\bat\s+(.+)$", title_source, re.IGNORECASE)
        if company_match:
            details["company"] = company_match.group(1).strip(" -–|:")

        details["location"] = extract_location(full_text, NIGERIAN_LOCATIONS)
        details["salary"] = extract_first_match(SALARY_PATTERNS, full_text) or ""
        details["job_type"] = extract_first_match(JOB_TYPE_PATTERNS, full_text) or ""
        details["experience"] = extract_first_match(EXPERIENCE_PATTERNS, full_text) or ""
        details["qualification"] = extract_first_match(QUALIFICATION_PATTERNS, full_text) or ""
        details["deadline"] = extract_first_match(DEADLINE_PATTERNS, full_text) or ""
        details["email"] = extract_email(full_text) or ""
        details["phone"] = extract_phone(full_text) or ""

        contact_bits = [x for x in [details["email"], details["phone"]] if x]
        details["contact_info"] = " / ".join(contact_bits)

        req_match = re.search(
            r"(?:requirements?|qualifications?(?:\s+and\s+experience)?)[:\s]*(.*?)(?=responsibilities|job summary|summary|method of application|how to apply|deadline|closing date|$)",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if req_match and len(req_match.group(1).strip()) > 20:
            details["requirements"] = req_match.group(1).strip()[:2000]

        resp_match = re.search(
            r"(?:responsibilities?|duties)[:\s]*(.*?)(?=requirements|qualifications|method of application|how to apply|deadline|closing date|$)",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if resp_match and len(resp_match.group(1).strip()) > 20:
            details["responsibilities"] = resp_match.group(1).strip()[:2000]

        apply_match = re.search(
            r"(?:method of application|how to apply)[:\s]*(.*?)(?=note:|deadline|closing date|$)",
            full_text,
            re.IGNORECASE | re.DOTALL,
        )
        if apply_match and len(apply_match.group(1).strip()) > 10:
            details["how_to_apply"] = apply_match.group(1).strip()[:1000]

        # Fallback description: first meaningful chunk
        if not details["description"]:
            if details["requirements"]:
                details["description"] = full_text.split(details["requirements"], 1)[0].strip()[:3000]
            else:
                details["description"] = full_text[:3000]

        return details

    def run(self) -> list[dict]:
        """Main entry point"""
        print("\n📋 Collecting Hot Nigerian Jobs links with per-field page limits...")

        job_links = []
        seen_links = set()

        for field_id in self.field_ids:
            pages_for_field = self.field_pages.get(field_id, 1)
            print(f"\n  Field {field_id} ({pages_for_field} page(s))...")

            for page in range(0, pages_for_field):
                url = self.build_field_page_url(field_id, page)
                print(f"    Page {page + 1}/{pages_for_field}...", end=" ")

                jobs = self.scrape_listing_page(url, field_id, page)
                if not jobs:
                    print("No more jobs.")
                    break

                added = 0
                for job in jobs:
                    if job["link"] in seen_links:
                        continue
                    seen_links.add(job["link"])
                    job_links.append(job)
                    added += 1

                print(f"✅ {added} jobs")

                if page < pages_for_field - 1:
                    time.sleep(self.rate_limit)

        print(f"\n📊 Total links: {len(job_links)}")
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