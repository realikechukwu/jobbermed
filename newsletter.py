#!/usr/bin/env python3
"""Send weekly job digest newsletter via Brevo"""

import json
import os
import sys
from datetime import date, datetime, timezone
from html import escape
from pathlib import Path
from urllib.parse import urljoin

import requests
from dotenv import load_dotenv

from config import EMAIL_CONFIG, MASTER_JOBS_PATH

BREVO_API_URL = "https://api.brevo.com/v3"
BREVO_TIMEOUT = 30


def is_expired(deadline_str: str) -> bool:
    """Return True if the deadline has already passed."""
    if not deadline_str:
        return False
    try:
        return date.fromisoformat(str(deadline_str)[:10]) < date.today()
    except ValueError:
        return False


def load_jobs(filepath: Path, limit: int = 20) -> list:
    """Load and return top N non-expired jobs sorted by date."""
    if not filepath.exists():
        print(f"❌ {filepath} not found")
        sys.exit(1)

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    jobs = data.get("jobs", []) if isinstance(data, dict) else data

    # Filter out expired jobs before selecting top N
    jobs = [j for j in jobs if not is_expired(j.get("deadline", ""))]

    # Sort by date_posted descending (newest first)
    jobs.sort(key=lambda j: j.get("date_posted", ""), reverse=True)

    return jobs[:limit]


def format_date(date_str: str) -> str:
    """Format ISO date to readable format."""
    if not date_str:
        return "Date not specified"
    try:
        d = datetime.fromisoformat(date_str)
        return d.strftime("%d %b %Y")
    except ValueError:
        return date_str


def get_email_cta_url() -> str:
    """Return the configurable CTA URL used in legacy digest emails."""
    value = os.getenv("EMAIL_CTA_URL", "/signup").strip()
    return value or "/signup"


def build_email_html(
    jobs: list,
    *,
    headline_text: str = "Healthcare jobs across Nigeria and Africa.",
    subheadline_text: str = "Your weekly roundup of open roles.",
    intro_text: str | None = None,
    include_signup_cta: bool = True,
) -> str:
    """Build the JobberMed digest with inline styles for email clients."""
    invalid_salary_values = {"", "n", "n,", "na", "n/a", "none", "null", "-", "--", "nil"}
    job_rows = []

    for job in jobs:
        title = escape(str(job.get("job_title") or "Untitled Role"))
        company = str(job.get("company") or "Company not listed").strip()
        location = str(job.get("location") or "").strip()
        apply_url = escape(str(job.get("apply_url") or "https://jobbermed.com/"), quote=True)
        employer = escape(" · ".join(filter(None, (company, location))))

        salary = str(job.get("salary") or "").strip()
        posted = str(job.get("date_posted") or "").strip()
        deadline = str(job.get("deadline") or "").strip()
        job_type = str(job.get("job_type") or "").strip()

        details = [escape(job_type)] if job_type else []
        if salary.lower() not in invalid_salary_values:
            details.append(f'<strong style="color:#1800ad;">{escape(salary)}</strong>')
        if deadline:
            details.append(f"Closes {escape(format_date(deadline))}")
        if posted:
            details.append(f"Posted {escape(format_date(posted))}")
        details_html = ""
        if details:
            details_html = (
                '<p style="margin:8px 0 0;color:#555561;font-size:13px;line-height:1.55;">'
                + " &middot; ".join(details)
                + "</p>"
            )

        job_rows.append(f"""
                <tr>
                  <td class="gutter" style="padding:0 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:16px 0;border-top:1px solid #e8e8ec;">
                          <h3 style="margin:0;font-size:18px;line-height:1.3;font-weight:700;overflow-wrap:anywhere;">
                            <a href="{apply_url}" style="color:#1800ad;text-decoration:none;">{title}<span aria-hidden="true" style="white-space:nowrap;">&nbsp;↗</span></a>
                          </h3>
                          <p style="margin:5px 0 0;color:#111114;font-size:14px;line-height:1.5;">{employer}</p>
                          {details_html}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
        """)

    openings = f"{len(jobs)} open {'role' if len(jobs) == 1 else 'roles'}"
    listing_heading = "Job matches" if intro_text else openings
    intro_html = ""
    if intro_text:
        intro_html = f'<p style="margin:8px 0 0;color:#555561;font-size:15px;line-height:1.5;">{intro_text}</p>'

    signup_cta_html = ""
    if include_signup_cta:
        cta_url = escape(urljoin("https://jobbermed.com/", get_email_cta_url()), quote=True)
        signup_cta_html = f"""
                <tr>
                  <td class="gutter" style="padding:0 32px 24px;color:#555561;font-size:14px;line-height:1.5;">
                    <a href="{cta_url}" style="color:#1800ad;text-decoration:underline;">Set your job preferences</a>
                    in a free JobberMed account.
                  </td>
                </tr>
        """

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>JobberMed Job Digest</title>
  <style>
    @media only screen and (max-width: 480px) {{
      .email-frame {{ padding:0 !important; }}
      .gutter {{ padding-left:20px !important; padding-right:20px !important; }}
      .hero-title {{ font-size:30px !important; }}
    }}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#111114;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f5f5f8">
    <tr>
      <td class="email-frame" align="center" style="padding:28px 12px;">
        <!--[if mso]><table role="presentation" width="640" align="center" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff"
          style="width:100%;max-width:640px;background-color:#ffffff;text-align:left;">
          <tr>
            <td class="gutter" bgcolor="#0b0640"
              style="padding:26px 32px 32px;background-color:#0b0640;background-image:linear-gradient(100deg,#0b0640 5%,rgba(14,6,90,.93) 60%,rgba(14,6,90,.72) 100%),url('https://jobbermed.com/images/banner-hero.jpg');background-size:cover;background-position:center 30%;">
              <a href="https://jobbermed.com/" style="color:#ffffff;font-size:21px;line-height:1.2;letter-spacing:-.45px;font-weight:800;text-decoration:none;">Jobber<span style="color:#0cc0df;">Med</span></a>
              <h1 class="hero-title" style="margin:24px 0 10px;color:#ffffff;font-size:38px;line-height:1.13;letter-spacing:-1px;font-weight:750;">
                {escape(headline_text)}
              </h1>
              <p style="margin:0;color:#e5e5f7;font-size:16px;line-height:1.5;">{escape(subheadline_text)}</p>
            </td>
          </tr>
          <tr>
            <td class="gutter" style="padding:23px 32px 13px;">
              <h2 style="margin:0;color:#111114;font-size:21px;line-height:1.3;font-weight:700;">{listing_heading}</h2>
              {intro_html}
            </td>
          </tr>
          {"".join(job_rows)}
          <tr>
            <td class="gutter" style="padding:18px 32px 26px;border-top:1px solid #e8e8ec;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td bgcolor="#1800ad" style="border-radius:8px;background-color:#1800ad;mso-padding-alt:12px 18px;">
                    <a href="https://jobbermed.com/" style="display:inline-block;padding:12px 18px;color:#ffffff;font-size:15px;line-height:1.35;font-weight:700;text-decoration:none;mso-padding-alt:0;">Browse all jobs &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {signup_cta_html}
          <tr>
            <td class="gutter" bgcolor="#151727" style="padding:21px 32px;background-color:#151727;">
              <p style="margin:0 0 8px;color:#dedfea;font-size:13px;line-height:1.5;">You’re receiving this because you signed up for JobberMed job alerts.</p>
              <p style="margin:0;font-size:13px;line-height:1.5;">
                <a href="{{{{unsubscribe}}}}" style="color:#72e4f7;text-decoration:underline;">Unsubscribe</a>
                <span style="color:#a5a7b7;">&nbsp;·&nbsp;</span>
                <a href="https://jobbermed.com/" style="color:#72e4f7;text-decoration:underline;">Visit JobberMed</a>
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
"""


def weekly_campaign(headers: dict, name: str) -> dict | None:
    """Find an existing campaign so a rerun can reuse its draft or skip a send."""
    offset = 0
    while True:
        response = requests.get(
            f"{BREVO_API_URL}/emailCampaigns",
            params={"type": "classic", "excludeHtmlContent": "true", "limit": 100, "offset": offset},
            headers=headers,
            timeout=BREVO_TIMEOUT,
        )
        response.raise_for_status()
        campaigns = response.json().get("campaigns", [])
        for campaign in campaigns:
            if campaign["name"] == name:
                return campaign
        if len(campaigns) < 100:
            return None
        offset += len(campaigns)


def verify_weekly_list() -> None:
    expected_id = os.getenv("BREVO_EXPECTED_LIST_ID")
    if not expected_id:
        return
    if os.getenv("BREVO_LIST_ID") != expected_id or not os.getenv("BREVO_API_KEY"):
        raise ValueError("Brevo credentials must target the JobberMed weekly subscriber list.")

    response = requests.get(
        f"{BREVO_API_URL}/contacts/lists/{expected_id}",
        headers={"api-key": os.environ["BREVO_API_KEY"]},
        timeout=BREVO_TIMEOUT,
    )
    response.raise_for_status()
    if response.json().get("name") != "JobberMed Subscribers":
        raise ValueError("Brevo did not return the JobberMed Subscribers list.")
    print("Verified the JobberMed Subscribers list in Brevo.")


def send_campaign(html_content: str, job_count: int) -> bool:
    """Send email campaign via Brevo API."""

    api_key = os.getenv("BREVO_API_KEY")
    list_id = int(os.getenv("BREVO_LIST_ID", "0"))
    sender_email = os.getenv("BREVO_SENDER_EMAIL", "jobs@jobbermed.com")
    sender_name = os.getenv("BREVO_SENDER_NAME", "JobberMed")

    if not api_key:
        print("❌ BREVO_API_KEY not set")
        return False

    if not list_id:
        print("❌ BREVO_LIST_ID not set")
        return False

    # Generate subject with date
    today = datetime.now(timezone.utc)
    subject = f"{job_count} New Medical Jobs This Week — {today.strftime('%d %b %Y')}"

    # Create campaign
    campaign_url = f"{BREVO_API_URL}/emailCampaigns"

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key,
    }

    campaign_data = {
        "name": f"JobberMed Weekly Digest - {today.strftime('%G-W%V')}",
        "subject": subject,
        "sender": {
            "name": sender_name,
            "email": sender_email,
        },
        "type": "classic",
        "htmlContent": html_content,
        "recipients": {
            "listIds": [list_id],
        },
    }

    try:
        campaign = weekly_campaign(headers, campaign_data["name"])
        if campaign and campaign["status"] in {"sent", "queued", "in-Process"}:
            print(f"Campaign {campaign['id']} already {campaign['status']} for this week.")
            return True
        if campaign:
            if campaign["status"] != "draft" or campaign.get("recipients", {}).get("lists") != [list_id]:
                print(f"Campaign {campaign['id']} needs review before it can be sent.")
                return False
            campaign_id = campaign["id"]
            print(f"Reusing weekly campaign draft {campaign_id}.")
        else:
            response = requests.post(campaign_url, json=campaign_data, headers=headers, timeout=BREVO_TIMEOUT)
            response.raise_for_status()
            campaign_id = response.json()["id"]
            print(f"Campaign created: ID {campaign_id}.")

        send_url = f"{campaign_url}/{campaign_id}/sendNow"
        send_response = requests.post(send_url, headers=headers, timeout=BREVO_TIMEOUT)
        send_response.raise_for_status()
        if send_response.status_code == 204:
            print(f"Brevo accepted campaign {campaign_id} for sending.")
            return True
        print(f"Unexpected Brevo send response: {send_response.status_code}.")
        return False

    except (requests.RequestException, ValueError, KeyError) as e:
        print(f"❌ API request failed: {e}")
        return False


def main() -> None:
    load_dotenv()

    print("=" * 60)
    print("  JOBBERMED WEEKLY NEWSLETTER")
    print("=" * 60)

    if not EMAIL_CONFIG.get("weekly_newsletter_enabled", False):
        print("\n⏸️  Weekly newsletter is switched off in config.py (EMAIL_CONFIG). Nothing sent.")
        return

    try:
        verify_weekly_list()
    except (requests.RequestException, ValueError) as error:
        sys.exit(f"Unable to verify the weekly audience: {error}")

    jobs_file = MASTER_JOBS_PATH
    jobs = load_jobs(jobs_file, limit=20)
    print(f"\n📋 Loaded {len(jobs)} jobs")

    if len(jobs) == 0:
        print("⚠️  No jobs to send. Skipping newsletter.")
        return

    print("📝 Building email content...")
    html_content = build_email_html(jobs)

    preview_file = jobs_file.with_name("newsletter_preview.html")
    preview_file.parent.mkdir(parents=True, exist_ok=True)
    with open(preview_file, "w", encoding="utf-8") as f:
        f.write(html_content.replace("{{unsubscribe}}", "#"))
    print(f"📄 Preview saved: {preview_file}")

    if os.getenv("NEWSLETTER_DRY_RUN", "").lower() == "true":
        print("\n⏭️  Dry run mode — skipping send")
        return

    print("\n📤 Sending newsletter...")
    success = send_campaign(html_content, len(jobs))

    if success:
        print("\n" + "=" * 60)
        print("  ✅ NEWSLETTER SENT SUCCESSFULLY")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("  ❌ NEWSLETTER FAILED")
        print("=" * 60)
        sys.exit(1)


if __name__ == "__main__":
    main()
