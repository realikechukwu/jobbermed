#!/usr/bin/env python3
"""Check the generated Pages artifact before publishing it."""

import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser


ORIGIN = "https://jobbermed.com"
DIST = Path(__file__).resolve().parents[1] / "dist"
SITEMAP = ORIGIN + "/sitemap.xml"


class Page(HTMLParser):
    def __init__(self, file):
        super().__init__()
        self.canonicals, self.links, self.schemas = [], [], []
        self.robots, self.heading_count, self.schema_buffer = "", 0, None
        self.feed(file.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs.get("href"))
        if tag == "meta" and attrs.get("name") == "robots":
            self.robots = attrs["content"]
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag == "h1":
            self.heading_count += 1
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self.schema_buffer = ""

    def handle_data(self, data):
        if self.schema_buffer is not None:
            self.schema_buffer += data

    def handle_endtag(self, tag):
        if tag == "script" and self.schema_buffer is not None:
            self.schemas.append(json.loads(self.schema_buffer))
            self.schema_buffer = None


def verify():
    locations = [element.text for element in ET.parse(DIST / "sitemap.xml").findall("./{*}url/{*}loc")]
    assert ORIGIN + "/" in locations and ORIGIN + "/blog/" in locations
    assert len(locations) == len({url.casefold() for url in locations}), "case-insensitive sitemap collision"
    robots = RobotFileParser()
    robots.parse((DIST / "robots.txt").read_text(encoding="utf-8").splitlines())
    assert SITEMAP in (robots.site_maps() or []), "robots.txt does not point at sitemap.xml"
    job_markup_count = 0
    for url in locations:
        assert url.startswith(ORIGIN + "/") and url.endswith("/"), url
        assert all(robots.can_fetch(agent, url) for agent in ("Googlebot", "bingbot", "OAI-SearchBot")), url
        path = urlsplit(url).path
        page = Page(DIST / path.lstrip("/") / "index.html")
        assert page.canonicals == [url], (url, page.canonicals)
        assert "noindex" not in page.robots and page.heading_count == 1, url
        postings = [schema for schema in page.schemas if schema.get("@type") == "JobPosting"]
        is_listing = bool(re.fullmatch(r"/jobs/[^/]+/", path))
        if is_listing:
            assert any(link.startswith(("https://", "http://")) and urlsplit(link).netloc != urlsplit(ORIGIN).netloc for link in page.links), url
        if postings:
            assert is_listing and len(postings) == 1, url
            posting = postings[0]
            assert posting["url"] == url and "<li>" in posting["description"], url
            assert posting["jobLocation"]["address"]["addressCountry"], url
            assert date.fromisoformat(posting["datePosted"]) <= date.today(), url
            if "validThrough" in posting:
                assert date.fromisoformat(posting["validThrough"]) >= date.today(), url
            job_markup_count += 1

    for file in (DIST / "signin/index.html", DIST / "signup/index.html", DIST / "404.html"):
        page = Page(file)
        assert "noindex" in page.robots, file
        assert ORIGIN + "/" + str(file.parent.relative_to(DIST)) + "/" not in locations, file
        if file.name == "404.html":
            assert not page.canonicals, file

    for file in (DIST / "jobs").glob("*/index.html") if (DIST / "jobs").exists() else []:
        url = f"{ORIGIN}/jobs/{file.parent.name}/"
        if url not in locations:
            page = Page(file)
            assert "noindex" in page.robots, url
            assert all(schema.get("@type") != "JobPosting" for schema in page.schemas), url

    print(f"Verified {len(locations)} canonical sitemap URLs and {job_markup_count} JobPosting records.")


if __name__ == "__main__":
    try:
        verify()
    except (AssertionError, OSError, ValueError, KeyError, ET.ParseError) as error:
        sys.exit(f"SEO artifact check failed: {error}")
