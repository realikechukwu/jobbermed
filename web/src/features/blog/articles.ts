// Career guides shown at /blog. The app renders these blocks as React and
// scripts/prerender-seo.mjs bundles this file to write the static pages, so
// keep it free of browser and React imports.
//
// Figures quoted in the articles come from data/master_jobs.json as it stood
// on 10 November 2026 (959 adverts posted from 11 September 2026).

export const CV_MATCH_URL = "https://cv.jobbermed.com";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2" | "h3"; text: string }
  | { type: "ul" | "ol"; items: string[] }
  | { type: "table"; columns: [string, string]; rows: [string, string][] }
  /** A sample email, CV line or subject line, shown as written. */
  | { type: "example"; lines: string[] }
  /** An inline screenshot or illustration with an optional caption. */
  | { type: "image"; src: string; alt: string; caption?: string; width?: number; height?: number }
  /** The CV Match call to action. */
  | { type: "cta" };

export type Article = {
  slug: string;
  title: string;
  description: string;
  /** ISO date. */
  published: string;
  updated?: string;
  readMinutes: number;
  category: string;
  image: string;
  body: ArticleBlock[];
};

export type InlineSegment = { text: string; href?: string };

/** Splits text containing [label](url) links into plain and linked segments. */
export function parseInline(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let cursor = 0;
  let match = pattern.exec(text);

  while (match) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index) });
    }
    segments.push({ text: match[1], href: match[2] });
    cursor = match.index + match[0].length;
    match = pattern.exec(text);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments;
}

export const CV_MATCH_CTA = {
  heading: "Check your CV against the advert",
  text: "Paste a job advert and your CV into CV Match. You get a match score, a list of what is missing and a rewritten CV to download as a PDF. It is free for three analyses a day and needs no account.",
  button: "Open CV Match",
};

export const ARTICLES: Article[] = [
  {
    slug: "how-to-use-jobbermed",
    title: "How to Use JobberMed: Search Filters, CV Match and Job Alerts",
    description:
      "A step-by-step guide to finding healthcare jobs on JobberMed: filter by specialty, state and published salary, pre-load CV Match from any advert, save a shortlist and set up daily or weekly email alerts.",
    published: "2026-11-15",
    readMinutes: 5,
    category: "Using JobberMed",
    image: "/images/guides/how-to.svg",
    body: [
      {
        type: "p",
        text: "JobberMed collects healthcare vacancies from popular Nigerian job boards every day and lists them alongside roles posted directly by hospitals, clinics, HMOs and NGOs. You can search, filter, bookmark jobs and check your CV without creating an account. Signing up is free and adds personalised email alerts and application tracking.",
      },
      { type: "h2", text: "1. Filter by specialty, state and job type" },
      {
        type: "p",
        text: "Start on the [JobberMed home page](/) with the specialty rings beneath the search bar. Each ring shows the live count of open adverts in that profession. Tap a ring to narrow the feed:",
      },
      {
        type: "ul",
        items: [
          "[Doctors](/doctor-jobs) — medical officers, house officers, registrars and consultants.",
          "[Nurses & Midwives](/nursing-jobs) — staff nurses, ICU, theatre, matron and midwifery roles.",
          "[Pharmacists](/pharmacist-jobs) — hospital, community, regulatory, industrial and intern pharmacists.",
          "[Med Lab](/medical-laboratory-scientist-jobs) — medical laboratory scientists, haematology, microbiology and lab technicians.",
          "[Dentists](/dentist-jobs), [Public Health](/public-health-jobs), [Management](/healthcare-management-jobs) and [Allied Health](/allied-health-jobs) — radiographers, sonographers, physiotherapists, optometrists, dietitians, HMO officers and programme leads.",
        ],
      },
      {
        type: "p",
        text: "Next, use the search filters to combine your specialty with a state or work pattern:",
      },
      {
        type: "ul",
        items: [
          "Location dropdown: The busiest states appear at the top under Most jobs, followed by an A-to-Z list of every state with live openings (including [Lagos](/healthcare-jobs/lagos), [Abuja](/healthcare-jobs/abuja), [Rivers](/healthcare-jobs/rivers) and [Oyo](/healthcare-jobs/oyo)).",
          "Job type dropdown: Filter for Full-time, Part-time, Locum / cover, Remote, NGO / humanitarian or Entry level / internship.",
          "Keyword search: Type a hospital name, sub-specialty or town into the top search bar (for example, sonographer, Dialysis, Lekki or Federal Medical Centre) and press Search.",
        ],
      },
      {
        type: "image",
        src: "/images/guides/how-to-search-filters.png",
        alt: "JobberMed home page showing the specialty rings, location and job-type dropdowns, the Salary shown pill and active filter chips",
        caption: "Combine a specialty ring, a state and the Salary shown toggle to narrow the feed. Active filters appear as removable chips above the results count.",
      },
      {
        type: "p",
        text: "Every specialty and state combination also has its own page link you can bookmark or share, such as [doctor jobs in Lagos](/doctor-jobs/lagos) or [nursing jobs in Abuja](/nursing-jobs/abuja).",
      },
      { type: "h2", text: "2. Spot published salaries and closing dates first" },
      {
        type: "p",
        text: "Most Nigerian healthcare adverts omit pay, and around half close within four weeks of posting. Use two filter options to prioritise:",
      },
      {
        type: "ul",
        items: [
          "Salary shown button: Click Salary shown to hide adverts that leave pay unstated. Only listings with a monthly naira figure, shift rate or public-sector grade (such as [CONMESS or CONHESS](/blog/conmess-conhess-explained)) remain.",
          "Sort menu: Sort: Recommended mixes listings from different job boards so one website never crowds out the rest, while keeping employer-posted roles first. Switch to Sort: Newest for today's postings, or Sort: Closing soon to catch the nearest deadlines.",
        ],
      },
      { type: "h2", text: "3. Read the summary and pre-load CV Match" },
      {
        type: "p",
        text: "Click any job card (or its Details button) to open the slide-in detail panel without leaving your search results. The panel extracts the employer, location, dates, salary, Requirements and Responsibilities into a clean checklist.",
      },
      {
        type: "image",
        src: "/images/guides/how-to-detail-cv-match.png",
        alt: "JobberMed slide-in job detail panel showing extracted responsibilities, the Check my CV against this job button and the source application button",
        caption: "The slide-in detail panel shows extracted requirements and responsibilities alongside a one-click link that pre-loads the advert into CV Match.",
      },
      {
        type: "p",
        text: "Inside the panel, click [Check my CV against this job](https://cv.jobbermed.com) in the Before you apply card. JobberMed passes the job title, employer, requirements and responsibilities straight into CV Match. Upload or paste your CV there to get:",
      },
      {
        type: "ol",
        items: [
          "A match score comparing your clinical experience, licences and keywords with the advert.",
          "A list of missing requirements to address before you apply.",
          "A tailored CV rewritten for that specific role, ready to download as a PDF.",
        ],
      },
      {
        type: "p",
        text: "CV Match is free for three analyses a day and needs no account. When your CV is ready, click the Apply button at the bottom of the panel to open the original posting.",
      },
      { type: "h2", text: "4. Save a shortlist on your device" },
      {
        type: "p",
        text: "Browsing on a ward break? Tap the bookmark icon in the top-right corner of any job card or inside the detail panel to save it on your phone or laptop.",
      },
      {
        type: "image",
        src: "/images/guides/how-to-saved-jobs.png",
        alt: "JobberMed Saved filter active in the filter bar showing a shortlist of three bookmarked healthcare jobs",
        caption: "Tap the bookmark icon on any role, then click Saved in the filter bar to view only your shortlisted jobs.",
      },
      {
        type: "p",
        text: "Click Saved in the filter bar at any time to narrow the board down to your bookmarked roles. Saved jobs also appear on your [Dashboard](/dashboard) when you sign in.",
      },
      { type: "h2", text: "5. Set up email alerts and track applications" },
      {
        type: "p",
        text: "A [free JobberMed account](/signup) unlocks two extra features:",
      },
      {
        type: "ul",
        items: [
          "Personalised job alert emails: Open [Job alert emails](/account/personalization) from your dashboard, tick Turn on tailored job alerts, pick Daily or Weekly delivery, and select your specialties and states.",
          "Direct applications and status tracking: Apply directly on employer-posted listings on JobberMed and check your [Dashboard](/dashboard) to see whether your application is Submitted, In review or Shortlisted.",
        ],
      },
      {
        type: "p",
        text: "Hiring for a hospital, clinic, HMO or NGO? [Request recruiter access](/request-access/recruiter) to post vacancies on JobberMed.",
      },
      { type: "h2", text: "Quick reference: what needs an account?" },
      {
        type: "table",
        columns: ["Feature", "Access"],
        rows: [
          ["Search, specialty rings, state, job-type & salary filters", "No account — use the [home page](/) or specialty pages."],
          ["Save jobs shortlist", "No account — tap the bookmark icon and toggle Saved."],
          ["CV Match score & tailored PDF", "No account (3 free/day) — click Check my CV against this job or open [cv.jobbermed.com](https://cv.jobbermed.com)."],
          ["Career & salary guides", "No account — browse [/blog](/blog)."],
          ["Daily or weekly job alert emails", "Free account — configure in [Email settings](/account/personalization)."],
          ["Employer applications & status tracking", "Free account — track on your [Dashboard](/dashboard)."],
        ],
      },
      { type: "cta" },
    ],
  },
  {
    slug: "non-clinical-hmo-health-tech-jobs-nigeria",
    title: "Non-Clinical Jobs for Doctors and Nurses in Nigeria",
    description:
      "Find HMO, claims, telehealth and health-tech jobs for doctors and nurses in Nigeria. Compare advertised salaries and learn how to tailor your CV for a career change.",
    published: "2026-11-15",
    readMinutes: 5,
    category: "Career transitions",
    image: "/images/guides/cv.svg",
    body: [
      {
        type: "p",
        text: "If you want to move from ward work into a non-clinical job, search for the work you would do rather than your current title. Start with case management, provider relations, medical claims, clinical operations or health-tech implementation. Browse [healthcare management jobs in Nigeria](/healthcare-management-jobs), including listings in [Lagos](/healthcare-management-jobs/lagos) and [Abuja](/healthcare-management-jobs/abuja).",
      },
      {
        type: "p",
        text: "Doctors and nurses can bring experience in reading clinical records, explaining care to patients and coordinating with different teams. Some roles involve clinical judgement or direct patient care. Check the duties and licence requirements even when a job is advertised as remote or office-based.",
      },
      { type: "h2", text: "HMO and health-tech jobs to search for" },
      { type: "h3", text: "Case management and utilisation review" },
      {
        type: "p",
        text: "Case managers coordinate care, review records and follow up with providers. Utilisation review roles may assess care requests or support pre-authorisation according to the insurer’s process. Search for clinical case reviewer, utilisation review officer or case management associate. A [Reliance Health case management advert](https://apply.workable.com/get-reliance-health/j/6CFE23B6C9/) accepted medical or nursing qualifications and asked for a current professional licence and relevant experience.",
      },
      { type: "h3", text: "Provider network and relations" },
      {
        type: "p",
        text: "Provider teams work with partner hospitals and clinics. Duties can include onboarding facilities, monitoring service quality, resolving provider problems and helping manage contracts. Search for provider relations officer, network officer or provider network manager. [AfriTPA’s careers page](https://afritpahealth.com/careers.html) shows how one employer describes provider contracting and network management.",
      },
      { type: "h3", text: "Medical claims and hospital HMO desks" },
      {
        type: "p",
        text: "On the hospital side, an HMO officer may check eligibility, submit pre-authorisation requests and follow up on rejected claims. On the insurer or third-party administrator side, claims teams may check documentation, billing and plan terms. Search for HMO billing officer, claims officer, claims auditor or claims adjudicator. Get familiar with the [NHIA claims submission and review procedure](https://www.nhia.gov.ng/download/standard-operating-procedure-for-claims-submission-review-and-payment/) and learn which tariff or contract the employer uses.",
      },
      { type: "h3", text: "Telehealth, clinical operations and health-tech implementation" },
      {
        type: "p",
        text: "Search for telehealth nurse, care coordinator, operations nurse, clinical product specialist or EMR implementation specialist. A telehealth clinician may still assess patients. A clinical operations or implementation role may focus on scheduling, training staff or improving how a service runs. Ask whether the role includes patient contact, evening cover or time on site.",
      },
      { type: "h2", text: "HMO and health-tech salaries in Nigeria" },
      {
        type: "p",
        text: "These are amounts from individual adverts, so use them as examples when comparing roles. Confirm whether each figure is gross or take-home and whether the employer pays separately for shifts, travel or overtime. Some of the adverts may have closed.",
      },
      {
        type: "table",
        columns: ["Advertised role", "Monthly pay in the advert"],
        rows: [
          ["[HMO Officer, St Dominic Catholic Hospital, Ibadan](https://www.hotnigerianjobs.com/hotjobs/982368/hmo-officer-at-stdominic-catholic-hospital.html)", "₦90,000 to ₦130,000."],
          ["[Hybrid Telehealth Nurse / Care Coordinator, ExcelHealth](https://www.hotnigerianjobs.com/hotjobs/963069/telehealth-nurse-care-coordinator-hybrid-at-excelh.html)", "₦100,000 to ₦200,000, depending on experience."],
          ["[Health-tech Business Development Executive, Abuja](https://www.myjobmag.com/job/business-development-executive-healthtech-emr-medical-devices-and-telemedicine)", "₦200,000 to ₦300,000."],
          ["[Operations Nurse, Dokitami, Lagos](https://www.hotnigerianjobs.com/hotjobs/976174/operations-nurse-at-dokitami.html)", "₦350,000."],
        ],
      },
      {
        type: "p",
        text: "If you are comparing an offer with hospital work, include the value of your current call pay, allowances and benefits. See the [guide to CONMESS and CONHESS](/blog/conmess-conhess-explained) for public-sector pay context.",
      },
      { type: "h2", text: "How to write a CV for an HMO or health-tech job" },
      {
        type: "p",
        text: "Show how your hospital experience relates to the job. If you handled pre-authorisations, say what you checked and how you followed up. If you tested an electronic medical record (EMR) workflow, explain the problem you spotted, who you worked with and what improved. Use figures from your own work and keep patient details out of the CV.",
      },
      {
        type: "example",
        lines: [
          "Example CV bullets. Replace the details with your own experience.",
          "Recorded and prioritised about 45 outpatient visits per day in the EMR, then flagged incomplete referrals for follow-up.",
          "Coordinated pre-authorisation requests with six HMOs and followed up on missing documentation before claims submission.",
        ],
      },
      {
        type: "p",
        text: "Use the [healthcare CV guide](/blog/healthcare-cv-nigeria) to organise your experience. [CV Match](https://cv.jobbermed.com) compares your CV with a specific advert, highlights gaps and suggests a rewrite you can review and save as a PDF.",
      },
      { type: "h2", text: "What to check before you apply" },
      {
        type: "ul",
        items: [
          "Licence. If the role involves clinical practice or the employer asks for a licence, check that your [MDCN practising licence](https://mdcn.gov.ng/page/about-us/mdcn-act-other-regulation) or [NMCN licence](https://nmcn.gov.ng/renewal.html) is current. Read the requirements for the specific post.",
          "NYSC. State your status where applicable and follow the advert’s instructions for discharge or exemption evidence.",
          "Tools and workflows. List Excel, HMO portals, EMR systems or reporting tools you have used. Give an example of what you did with them.",
          "Work pattern and application. Confirm the office location, hybrid schedule, shifts and travel. For an email application, follow the employer’s instructions. [How to apply for a healthcare job by email](/blog/apply-for-healthcare-job-by-email)",
        ],
      },
      {
        type: "p",
        text: "Browse [healthcare management jobs](/healthcare-management-jobs), [doctor jobs](/doctor-jobs) or [nursing jobs](/nursing-jobs) on JobberMed. Search for a role that fits your experience, then [check your CV against the advert](https://cv.jobbermed.com) before you apply.",
      },
    ],
  },
  {
    slug: "medical-officer-locum-doctor-jobs-nigeria",
    title: "How to Get a Medical Officer (MO) or Locum Doctor Job in Nigeria (2026 Guide)",
    description:
      "Find Medical Officer and locum doctor jobs in Nigeria. Check MDCN and NYSC requirements, compare advertised pay examples from ₦380k to ₦800k, and tailor your CV.",
    published: "2026-11-15",
    readMinutes: 5,
    category: "Medical careers",
    image: "/images/guides/cv.svg",
    body: [
      {
        type: "p",
        text: "Looking for a Medical Officer (MO) job after housemanship or NYSC, or a locum shift that fits around your exams? Start with [doctor jobs in Nigeria](/doctor-jobs). Look for Medical Officer, Resident Medical Officer (RMO), Senior Medical Officer (SMO) and locum doctor, then confirm the hours and clinical responsibilities in the original advert.",
      },
      {
        type: "p",
        text: "This guide draws on a JobberMed snapshot of 969 healthcare adverts from five Nigerian job boards, dated 16 September to 14 November 2026. The pay examples below come from individual adverts. Some have already closed, so use the live listings for vacancies you can apply for today.",
      },
      { type: "h2", text: "1. MDCN and NYSC requirements for Medical Officer and locum jobs" },
      {
        type: "ul",
        items: [
          "Medical degree. Have your MBBS, MBChB or other recognised equivalent ready. Use the employer’s required documents list.",
          "Full MDCN registration and a current annual practising licence. Provisional registration is for approved, supervised housemanship. If you have just finished, complete full registration and check your licence before taking a Medical Officer role or a locum shift. [MDCN licensure requirements](https://mdcn.gov.ng/page/about-us/mdcn-act-other-regulation)",
          "NYSC evidence where applicable. Keep the relevant discharge or exemption document ready, or check what official evidence applies to your circumstances. Read the advert alongside the [NYSC Act](https://www.nysc.gov.ng/downloads/nysc-decree.php).",
          "Experience for the duties in the advert. A maternity hospital may look for obstetric experience. An outpatient clinic may ask for BLS and experience with electronic medical records (EMR). Confirm which procedures you would be expected to perform, what supervision is available and how referrals work.",
        ],
      },
      { type: "h2", text: "2. Where to find Medical Officer and locum doctor vacancies" },
      {
        type: "ul",
        items: [
          "Private hospitals and maternity centres. Browse [doctor jobs in Lagos](/doctor-jobs/lagos) and [doctor jobs in Abuja](/doctor-jobs/abuja) for permanent posts and ward, emergency or maternity cover.",
          "HMO clinics, wellness centres and telemedicine. Check whether the job is in person or remote, what the consultation schedule looks like and how emergencies are escalated.",
          "Specialist centres. Search for roles in dialysis, paediatrics, fertility or critical care if your training and experience fit the job.",
          "NGOs, universities and public hospitals. Check institutional recruitment pages for programme or hospital posts. See [how to apply for NGO and UN roles](/blog/ngo-jobs-in-nigeria) if you want to move into public health.",
        ],
      },
      { type: "h2", text: "3. Medical Officer and locum doctor salary in Nigeria" },
      {
        type: "p",
        text: "Compare advertised figures within the same type of work. A monthly salary, an hourly rate and a public sector grade tell you different things. These late-2026 examples show why the role, location and hours matter when you compare offers.",
      },
      {
        type: "table",
        columns: ["Advertised role", "Pay quoted"],
        rows: [
          ["[Full-time Medical Officer, paediatrics, Ikeja](https://medlocumjobs.com/jobs/medical-officer-paediatrics-2304)", "₦380,000 to ₦500,000 per month."],
          ["[Full-time Medical Officer, wellness clinic, Lekki](https://jobanchor.com.ng/jobs/13024)", "₦800,000 per month. The advert asked for three to five years of relevant experience after housemanship."],
          ["[Locum Medical Officer, Lagos](https://medlocumjobs.com/jobs/medical-officer-2322)", "₦2,500 per hour in this advert. Confirm billable hours and payment timing with the employer."],
          ["[Medical Officer, OAUTHC, Ile-Ife](https://fcc.gov.ng/job-listings/obafemi-awolowo-university-teaching-hospitals-complex-ile-ife/)", "CONMESS 3 Step 2 in the October 2026 recruitment notice."],
        ],
      },
      {
        type: "p",
        text: "For a locum shift, agree the rate, start and finish times, cover expected after handover, and when the invoice or payment is due. For a monthly post, confirm gross versus take-home pay, call allowances, overtime and any accommodation in writing. For public sector offers, check the exact grade and step. [Guide to CONMESS and CONHESS](/blog/conmess-conhess-explained)",
      },
      { type: "h2", text: "4. Write a Medical Officer or locum doctor CV" },
      {
        type: "ol",
        items: [
          "Put your MDCN registration and annual licence status near the top, with your NYSC status where relevant.",
          "Describe the work you did in terms a recruiter can verify. Name the ward or service, its workload and your own responsibilities. For procedures, distinguish cases you led from those you assisted or did under supervision. Keep patient details out of the CV.",
          "Use the advert’s wording for skills you have. Mention EMR documentation, ultrasound or a current BLS certificate when it fits the role and you can substantiate it.",
        ],
      },
      {
        type: "p",
        text: "For structure, use the [healthcare CV guide for Nigeria](/blog/healthcare-cv-nigeria). When you find a specific role, [CV Match](https://cv.jobbermed.com) compares the advert with your CV, flags gaps and suggests a tailored rewrite you can review and save as a PDF.",
      },
      { type: "h2", text: "5. Send your application and verify the employer" },
      {
        type: "p",
        text: "Check the closing date and apply through the original advert. If the employer asks for an email, use its specified subject line and file format. A name such as Amina-Bello-Medical-Officer-CV.pdf helps the recruiter find your CV. Verify the hospital and contact details independently before sharing documents. Treat unexplained interview or processing fees as a warning sign. [How to apply by email](/blog/apply-for-healthcare-job-by-email) · [How to spot a fake job advert](/blog/fake-healthcare-job-adverts)",
      },
      { type: "h2", text: "Frequently asked questions" },
      { type: "h3", text: "Can I work as a locum doctor on provisional MDCN registration?" },
      {
        type: "p",
        text: "Provisional registration allows supervised training at an approved housemanship centre. After completing housemanship, obtain full registration and a current annual practising licence before taking up ordinary Medical Officer or locum work. [MDCN guidance for house officers](https://www.mdcn.gov.ng/page/recent-news/press-release-on-professional-ethics-for-house-officers)",
      },
      { type: "h3", text: "What should I search for after NYSC?" },
      {
        type: "p",
        text: "Try Medical Officer, Resident Medical Officer, GP, locum doctor and your preferred city. Read the level and years of experience in the advert before applying. If you are still looking for your first supervised placement, start with the [medical housemanship guide](/blog/medical-housemanship-in-nigeria).",
      },
      {
        type: "p",
        text: "[Browse current doctor jobs](/doctor-jobs) and [check your CV against the advert](https://cv.jobbermed.com) before you apply.",
      },
    ],
  },
  {
    slug: "medical-housemanship-in-nigeria",
    title: "Medical Housemanship in Nigeria: MDCN Portal, Pay and Centres",
    description:
      "Apply for medical housemanship in Nigeria through the MDCN portal or directly to accredited hospitals. Check posting deadlines, CONMESS pay and accommodation.",
    published: "2026-11-15",
    readMinutes: 5,
    category: "Medical careers",
    image: "/images/guides/locations.svg",
    body: [
      {
        type: "p",
        text: "There are two routes into medical housemanship in Nigeria. Use the [MDCN Housemanship Portal](https://housemanship.mdcn.gov.ng/) for hospitals in the federal centralised scheme. For accredited hospitals outside that scheme, apply through the hospital or its recruitment authority when it advertises a house officer vacancy.",
      },
      {
        type: "p",
        text: "Housemanship, also called a house job, is 12 months of supervised training at a centre approved by the Medical and Dental Council of Nigeria (MDCN). Medical graduates typically rotate through medicine, surgery, paediatrics, and obstetrics and gynaecology. Dental graduates follow the approved dental rotations. Both routes require satisfactory completion of housemanship before applying for full registration. [MDCN registration guidelines](https://mdcn.gov.ng/public/storage/documents/sub_document_1215406857.pdf)",
      },
      { type: "h2", text: "How to apply through the MDCN Housemanship Portal" },
      {
        type: "ol",
        items: [
          "Register with your provisional certificate. On the [MDCN registration page](https://housemanship.mdcn.gov.ng/auth/register), enter your provisional registration folio number and the date of issue as shown on the certificate. Use an email address you can access.",
          "Watch [MDCN announcements](https://www.mdcn.gov.ng/) for vacancy releases. When you sign in, the list shows centres with available places for selection. If your preferred hospital is missing, check again after the next official release or compare other centres.",
          "Confirm the centre before submitting. Check that you can relocate and report on time. MDCN’s FAQ says a confirmed choice cannot simply be reset.",
          "Save your posting letter and check the reporting date. The portal emails a copy to you and the centre after a successful selection. Ask the hospital which documents to bring and where to report. Follow the date on your letter. A missed deadline can cancel your posting and release the slot.",
        ],
      },
      {
        type: "p",
        text: "Use the [official MDCN posting instructions](https://www.mdcn.gov.ng/page/housemanship/how-it-works) and the [MDCN FAQ](https://mdcn.gov.ng/frequently-asked-questions) for portal problems. MDCN prohibits applicants and intermediaries from soliciting postings from its staff. Avoid anyone offering to sell you a slot.",
      },
      { type: "h2", text: "How to apply directly for house officer jobs" },
      {
        type: "p",
        text: "Check state teaching hospitals, health service commissions, military hospitals and private or faith-based centres for official house officer adverts. Confirm that the centre is approved by MDCN for your medical or dental programme before you accept an offer. Ask the recruitment office about the application deadline, interview and documents.",
      },
      {
        type: "p",
        text: "Keep your provisional registration certificate, degree evidence and a short medical CV ready. Include relevant clerkships, electives, research and leadership. Follow the documents and submission method in the advert. When you find a vacancy, [CV Match](https://cv.jobbermed.com) can help you tailor your existing CV to it. See the [JobberMed guide to healthcare CVs](/blog/healthcare-cv-nigeria).",
      },
      {
        type: "p",
        text: "MDCN’s [placement procedure](https://mdcn.gov.ng/page/recent-news/notice-on-the-standard-operating-procedures-sop-for-house-officers-placement-for014) directs house officers employed by accredited centres outside the centralised scheme to upload their employment letters to the portal when they resume. Ask the hospital’s housemanship office how to complete the registration and records for your placement.",
      },
      { type: "h2", text: "MDCN-accredited housemanship centres in Nigeria" },
      {
        type: "p",
        text: "Start with the [September 2026 MDCN accreditation list](https://www.mdcn.gov.ng/public/storage/documents/document_966972577.pdf). It separates medical and dental training quotas. A quota tells you how many trainees the centre is approved to take. Check the portal or institution for current vacancies.",
      },
      {
        type: "table",
        columns: ["Location", "Examples of centres to check"],
        rows: [
          ["Lagos", "Lagos University Teaching Hospital (LUTH), Lagos State University Teaching Hospital (LASUTH) and Federal Medical Centre, Ebute-Metta."],
          ["Abuja", "National Hospital Abuja, Federal Medical Centre Jabi and University of Abuja Teaching Hospital, Gwagwalada."],
          ["Port Harcourt", "University of Port Harcourt Teaching Hospital (UPTH) and Rivers State University Teaching Hospital (RSUTH)."],
          ["Abeokuta, Benin City and Jos", "Federal Medical Centre Abeokuta, University of Benin Teaching Hospital (UBTH) and Jos University Teaching Hospital (JUTH)."],
        ],
      },
      {
        type: "p",
        text: "Compare supervision across your rotations, call schedules and commuting time. If you need house officer quarters, ask the hospital whether a room is available when you resume, how it is allocated and what it costs.",
      },
      { type: "h2", text: "House officer salary in Nigeria and CONMESS pay" },
      {
        type: "p",
        text: "For a federal placement, check the [official CONMESS salary circular](https://nsiwc.gov.ng/download/implementation-of-the-new-national-minimum-wage-in-the-federal-public-service-the-consolidated-medical-salary-structure-conmess/) and ask which grade and step apply to your offer. Confirm your gross monthly pay, deductions and allowances with the hospital to estimate what you will take home. MDCN’s centralised scheme uses monthly hospital clearance for payment.",
      },
      {
        type: "p",
        text: "For a direct offer from a state, private, faith-based or military centre, ask the employer who pays you, when your first payment is due and whether call pay or accommodation is included. Compare the written terms and your living costs. See [how CONMESS grades and steps work](/blog/conmess-conhess-explained).",
      },
      { type: "h2", text: "Housemanship FAQs" },
      { type: "h3", text: "Can I do my housemanship outside the MDCN portal?" },
      {
        type: "p",
        text: "Yes. You can apply directly to centres outside the federal centralised scheme if MDCN approves them for your training. Confirm current accreditation and follow MDCN’s requirements for recording the placement.",
      },
      { type: "h3", text: "How long do I have to resume after an MDCN posting?" },
      {
        type: "p",
        text: "MDCN’s FAQ describes a two-week reporting window for centralised placements. Use the deadline in your posting letter and confirm the hospital’s reporting arrangements as soon as you receive it.",
      },
      { type: "h3", text: "What should I search for when looking for vacancies?" },
      {
        type: "p",
        text: "Try “house officer”, “housemanship”, “house job” or “dental house officer” with the name of a state or hospital. Start with [doctor jobs in Nigeria](/doctor-jobs) or [dental jobs in Nigeria](/dentist-jobs) on JobberMed, then confirm the vacancy and application process with the employer.",
      },
    ],
  },
  {
    slug: "ngo-jobs-in-nigeria",
    title: "NGO Jobs in Nigeria: How to Apply for NGO and UN Roles",
    description:
      "Find NGO and UN jobs in Nigeria, from public health roles in Abuja to humanitarian jobs in Borno. Learn where to apply and how to show hospital QI work on your CV.",
    published: "2026-11-15",
    readMinutes: 5,
    category: "Public health careers",
    image: "/images/guides/locations.svg",
    body: [
      {
        type: "p",
        text: "To find NGO jobs in Nigeria, search by role as well as organisation. Try “health programme officer”, “medical officer”, “nutrition officer” or “monitoring and evaluation officer”. Browse [public health jobs in Nigeria](/public-health-jobs) and check the employer’s own careers portal for the full requirements and application deadline.",
      },
      {
        type: "p",
        text: "If you are a doctor, nurse or other clinician moving from hospital work into humanitarian health, start with evidence of what you have already improved. A quality improvement project can show how you used data, worked with a team and followed a change through to a measurable result.",
      },
      { type: "h2", text: "Where to find NGO and UN jobs in Nigeria" },
      {
        type: "table",
        columns: ["What you are looking for", "Where to search"],
        rows: [
          ["Public health and programme jobs", "Start with [public health jobs in Abuja](/public-health-jobs/abuja) and the [FHI 360 careers page](https://www.fhi360.org/join-our-team/). Search for programme officer, health specialist and project coordinator."],
          ["Medical and humanitarian field jobs", "Check [ReliefWeb Jobs](https://reliefweb.int/jobs), [MSF careers](https://www.msf.org/work-msf) and [public health jobs in Borno](/public-health-jobs/borno). Search for medical officer, emergency health, nutrition and field coordinator."],
          ["UN jobs in Nigeria", "Use [UN Careers](https://careers.un.org/) for UN Secretariat roles. Check [UNICEF Nigeria vacancies](https://jobs.unicef.org/cw/en-us/Search/?location=nigeria) and [WHO Careers](https://www.who.int/careers) for those agencies’ openings."],
        ],
      },
      {
        type: "p",
        text: "Check Abuja for programme, partnership and technical roles. For field roles, search the duty stations and surrounding states you can work in, including Maiduguri, Yola and Damaturu. Read how much travel the job requires and where the post is actually based before applying.",
      },
      { type: "h2", text: "NGO job requirements and roles to search for" },
      {
        type: "p",
        text: "Read the essential criteria first. Match your degree and experience to the advert, keep your NYSC documents ready where applicable, and show your current professional registration and practising licence for clinical posts that require them. An MPH or another relevant master’s degree can help for technical or senior posts that ask for one.",
      },
      {
        type: "ul",
        items: [
          "Health and nutrition: Medical officer, nurse, midwife, pharmacist, nutrition officer and public health specialist.",
          "Monitoring, evaluation, accountability and learning (MEAL): M&E assistant, data officer and reporting officer. Look for the tools named in the advert, such as KoboToolbox, ODK, DHIS2, Power BI or Excel.",
          "Water, sanitation and hygiene (WASH): WASH officer, environmental health officer and hygiene promotion officer.",
          "Protection and operations: Case management, psychosocial support, grants, finance, procurement and logistics.",
        ],
      },
      { type: "h2", text: "How to apply for an NGO or UN job in Nigeria" },
      {
        type: "ol",
        items: [
          "Tailor your CV to the job description. Use the employer’s terms for work you have actually done. Put the most relevant outcomes near the top and show what you personally contributed. [CV Match](https://cv.jobbermed.com) can compare your CV with a job advert and suggest a tailored version you can review before submitting.",
          "Build the skills the role asks for. Practise a relevant task, such as building a small survey in KoboToolbox, checking data quality or writing a one-page report. For field posts, check which security training the employer requires or provides.",
          "Apply on the official portal. Use the link in the original advert and follow its instructions. For UN Secretariat posts, [UN Careers explains how to apply through Inspira](https://careers.un.org/how-to-apply?language=en), including how to complete your profile and motivation statement. Other agencies use their own application systems.",
          "Check the duty station and contract. Confirm travel, contract length, work arrangements, insurance and any accommodation or field allowances. Get the terms in writing before accepting an offer.",
          "Prepare for a competency-based interview. Use the STAR method (situation, task, action and result) to describe a time you solved a problem, handled limited resources or worked with people who disagreed. Make your contribution and the outcome clear. [UN assessment guidance](https://careers.un.org/assessment?language=en)",
        ],
      },
      { type: "h3", text: "How to put hospital quality improvement (QI) on an NGO CV" },
      {
        type: "p",
        text: "Pick a project you can explain from start to finish. Name the problem, how you measured it, what you did with the team and how the result changed. Examples include reviewing delays in urgent treatment, reducing clinic waiting times, auditing adherence to a protocol or training staff and checking whether practice improved.",
      },
      {
        type: "example",
        lines: [
          "Example CV bullet with illustrative figures",
          "Led a six-week clinic flow audit with the nursing team. Reviewed waiting times, changed how patients were directed at arrival and re-audited the same measure. Median waiting time fell from 48 to 33 minutes in the audit sample.",
        ],
      },
      {
        type: "p",
        text: "Use your own figures, describe how you collected them and leave out identifying patient details. If you have no follow-up measurement, describe the change you made or what the audit found. That still gives the recruiter an example of how you use evidence.",
      },
      { type: "h2", text: "Frequently asked questions about NGO jobs in Nigeria" },
      { type: "h3", text: "Can I get an NGO job with no NGO experience?" },
      {
        type: "p",
        text: "Look for roles that accept related experience, such as programme assistant, field assistant or a short-term data collection post. Hospital audit work, community outreach and relevant volunteering can help you show that you meet the criteria. Check internship eligibility before applying, as some programmes have education or graduation requirements.",
      },
      { type: "h3", text: "How much do NGO and UN jobs pay in Nigeria?" },
      {
        type: "p",
        text: "Pay varies by organisation, grade, contract and duty station. The [International Civil Service Commission](https://icsc.un.org/home/datasalaryscales) distinguishes worldwide salary scales for internationally recruited UN Professional posts from local scales for General Service staff. For any offer, confirm the currency, gross or net pay, allowances and benefits with the recruiter.",
      },
      { type: "h3", text: "Do UN jobs have an application fee?" },
      {
        type: "p",
        text: "The [UN recruitment guide](https://careers.un.org/how-to-apply?language=en) says the UN charges no fee at any stage. If a message asks for money or sends you to an unfamiliar form, look for the same vacancy on the employer’s website before sharing documents. See [how to spot a fake healthcare job advert](/blog/fake-healthcare-job-adverts).",
      },
      {
        type: "p",
        text: "[Browse public health vacancies](/public-health-jobs) to find a role that fits your experience, then [check your CV against the advert](https://cv.jobbermed.com) before sending it.",
      },
    ],
  },
  {
    slug: "nursing-jobs-in-nigeria-career-guide",
    title: "Landing a Nursing Job in Nigeria (2026 Career Guide)",
    description:
      "How to find nursing jobs in Nigeria, from Lagos and Abuja to regional hospitals. Check NMCN and NYSC requirements, compare pay, and prepare for applications and interviews.",
    published: "2026-11-15",
    readMinutes: 4,
    category: "Nursing careers",
    image: "/images/guides/cv.svg",
    body: [
      {
        type: "p",
        text: "Landing a nursing job in Nigeria takes more than a qualification. Whether you are targeting a federal teaching hospital, a private clinic in Lagos or Abuja, or an NGO or corporate health role, show employers that your licence is current and that your clinical experience fits the post.",
      },
      {
        type: "p",
        text: "Start with [nursing jobs across Nigeria](/nursing-jobs), [nursing jobs in Lagos](/nursing-jobs/lagos) or [nursing jobs in Abuja](/nursing-jobs/abuja). When you find a role you want, [CV Match](https://cv.jobbermed.com) can compare your CV with the advert and help you tailor it.",
      },
      { type: "h2", text: "1. Check your requirements before you apply" },
      {
        type: "ul",
        items: [
          "Academic qualification. Check whether the post accepts your nursing qualification or specifies a degree such as a BNSc. Public adverts can set different entry requirements for nursing officers, senior officers and tutors.",
          "NMCN registration and a current practising licence. Use the category of registration the advert asks for. The [Nursing and Midwifery Council of Nigeria](https://nmcn.gov.ng/licensing.html) says practising licences are renewable every three years.",
          "NYSC documents. If NYSC applies to you, have your discharge or exemption certificate ready. Check the wording for your qualification and the specific role. [Official NYSC rules](https://www.nysc.gov.ng/downloads/nysc-decree.php)",
          "Relevant certifications. List dual registration as a nurse and midwife, current BLS or ACLS training, or a post-basic qualification in areas such as ICU, theatre, emergency nursing, paediatrics or oncology when it matches the role.",
        ],
      },
      { type: "h2", text: "2. Where to look for nursing jobs and what to ask about pay" },
      {
        type: "table",
        columns: ["Sector", "Where to look and what to check"],
        rows: [
          ["Federal teaching hospitals", "Check the hospital's recruitment page and official notices. Ask for the CONHESS grade, step and applicable allowances."],
          ["Private specialist hospitals and clinics", "Check employer career pages and JobberMed. Ask for the basic salary, shift pattern, night pay and overtime terms."],
          ["NGOs and humanitarian organisations", "Look on the organisation's own careers portal. Check the duty station, contract length and any field or accommodation allowance."],
          ["Oil, gas and corporate health", "Look for occupational health and site clinic roles. Check rotation, site requirements and any safety training named in the advert."],
          ["State hospitals", "Check state recruitment notices and the hospital's own website. Ask which salary scale and allowances apply."],
          ["Military and paramilitary services", "Use official recruitment channels and check whether the post is civilian or requires joining the service."],
        ],
      },
      {
        type: "p",
        text: "In JobberMed’s September–November 2026 sample, private registered nurse and midwife adverts that disclosed pay mostly quoted ₦125,000 to ₦260,000 a month. The sample was small and weighted towards Lagos. In one [October 2026 teaching hospital notice](https://fcc.gov.ng/job-listings/obafemi-awolowo-university-teaching-hospitals-complex-ile-ife/), Nursing Officer II was listed at CONHESS 7 Step 2 and Senior Nursing Officer at CONHESS 9 Step 1. Use the [CONMESS and CONHESS guide](/blog/conmess-conhess-explained) to understand grades before comparing actual offers.",
      },
      {
        type: "p",
        text: "If you can relocate, include regional teaching hospitals and NGO field posts in your search. Ask about allowances, accommodation, travel and the length of the contract before you compare the offer with a job in Lagos or Abuja.",
      },
      { type: "h2", text: "3. Five steps to improve your application" },
      {
        type: "ol",
        items: [
          "Write a CV that shows your clinical work. Put your NMCN registration category and practising licence status near the top. Use numbers you can explain, such as the size of your ward or your typical patient caseload. [Tailor your CV to a specific advert](https://cv.jobbermed.com) and check the result before sending it.",
          "Apply through healthcare recruitment channels. Browse [nursing vacancies on JobberMed](/nursing-jobs) and follow the link to the original advert. For a federal or state position, also check the employer’s own recruitment page for the deadline and required documents.",
          "Stay in touch with your nursing network. Ask former supervisors, colleagues and contacts from your clinical postings to share relevant openings. Local nursing association groups can also help you hear about roles.",
          "Prepare for a written assessment if the employer uses one. Review drug calculations, IV flow rates, core pharmacology and professional ethics. Ask the recruiter what the assessment covers if the invitation leaves that out.",
          "Practise for the clinical panel. Prepare a few examples of how you prioritised care, escalated a concern or handled a challenging shift. Use the STAR method: situation, task, action and result. Keep patient details confidential.",
        ],
      },
      { type: "h2", text: "Quick FAQ" },
      { type: "h3", text: "Can I work as a nurse in Nigeria before finishing NYSC?" },
      {
        type: "p",
        text: "Check both your NYSC status and the advert. Some teaching hospital posts explicitly ask for evidence of completion, exemption or exclusion, depending on the qualification. If you are still serving, ask the recruiter which evidence they accept for the specific post and check the [official NYSC rules](https://www.nysc.gov.ng/downloads/nysc-decree.php).",
      },
      { type: "h3", text: "Which nursing specialties should I look for?" },
      {
        type: "p",
        text: "Search by specialty as well as job title. Try ICU or critical care, theatre or perioperative nursing, emergency nursing and midwifery. For offshore or worksite posts, check which occupational health experience and safety qualifications the employer lists.",
      },
      { type: "h2", text: "Find your next nursing role" },
      {
        type: "p",
        text: "[Browse nursing and midwifery jobs](/nursing-jobs) to find a role that fits your experience. Then [check your CV against the advert](https://cv.jobbermed.com) before applying.",
      },
    ],
  },
  {
    slug: "healthcare-cv-nigeria",
    title: "How to write a CV for a healthcare job in Nigeria",
    description:
      "What Nigerian hospitals, clinics and pharmacies look for on a CV, based on more than 900 healthcare job adverts: licence, NYSC status, numbers and the advert's own words.",
    published: "2026-11-10",
    readMinutes: 5,
    category: "CV & credentials",
    image: "/images/guides/cv.svg",
    body: [
      {
        type: "p",
        text: "Most CV advice online is written for bankers and software engineers. A hospital reads your CV differently. The person screening it wants to know whether you are licensed, whether you have finished NYSC, and whether you have done the work in the advert. Everything else comes second.",
      },
      {
        type: "p",
        text: "We read healthcare job adverts all day. JobberMed collected more than 900 of them from five Nigerian job boards between 11 September and 10 November 2026. This guide follows what those adverts ask for.",
      },
      { type: "h2", text: "Put your licence at the top" },
      {
        type: "p",
        text: "About 45% of the adverts asked for a licence or registration with a professional council. For doctors and dentists that council is MDCN. For nurses and midwives it is NMCN, for pharmacists PCN, and for medical laboratory scientists MLSCN.",
      },
      {
        type: "p",
        text: "Write it in the first few lines, under your name and phone number. Name the council, the type of registration and the year your practising licence covers. A screener who cannot find your licence in ten seconds may not keep looking.",
      },
      { type: "example", lines: ["MDCN full registration, 2023. Practising licence current for 2026."] },
      { type: "h2", text: "Say where you stand on NYSC" },
      {
        type: "p",
        text: "About one in five adverts mentioned NYSC. Teaching hospitals ask for a discharge or exemption certificate. Some private pharmacies and laboratories want the opposite and advertise for serving corps members. Either way the employer is sorting applicants by NYSC status, so state yours in one line.",
      },
      { type: "example", lines: ["NYSC completed, Kaduna State, 2025."] },
      { type: "h2", text: "Describe the work with numbers" },
      {
        type: "p",
        text: "\"Managed patients in the emergency unit\" tells the reader nothing they could not guess from your job title. Say how many, how often, and what you did yourself.",
      },
      {
        type: "ul",
        items: [
          "Covered a 24-bed medical ward on night shifts with a consultant on call.",
          "Performed about 40 caesarean sections as first surgeon during a 12-month rotation.",
          "Dispensed an average of 120 prescriptions a day in a community pharmacy.",
          "Ran the haematology and chemistry benches and reported about 60 samples per shift.",
        ],
      },
      {
        type: "p",
        text: "If you do not have the exact figure, estimate honestly. A rough number you can defend at interview is better than a vague sentence.",
      },
      { type: "h2", text: "Use the words in the advert" },
      {
        type: "p",
        text: "A screener with a pile of applications scans each CV for the terms in the advert. If the advert says \"theatre nurse\" and your CV says \"perioperative nursing\", you are asking the screener to translate. Use the advert's words wherever they are true of you.",
      },
      {
        type: "p",
        text: "This is the slow part of applying, because it means editing your CV for every job. We built a free tool to speed it up. [CV Match](https://cv.jobbermed.com) takes the advert and your CV, scores how well they match, tells you what is missing and writes a tailored version you can download as a PDF.",
      },
      { type: "cta" },
      { type: "h2", text: "Keep it to two pages" },
      {
        type: "p",
        text: "A house officer or a newly qualified nurse needs one page. Most other people need two. Consultants applying to teaching hospitals are the exception, because interview panels expect publications, fellowships and teaching listed in full.",
      },
      {
        type: "p",
        text: "Applying for your first house job? See the [medical housemanship guide](/blog/medical-housemanship-in-nigeria) for the MDCN portal and direct application routes.",
      },
      {
        type: "p",
        text: "Cut what nobody asked for. Your primary school and your marital status do not help. Some federal adverts ask for state of origin and local government area, so add those only when the advert requests them.",
      },
      { type: "h2", text: "Send a PDF with a clear file name" },
      {
        type: "p",
        text: "Save the file as your name and the role, such as Amina-Bello-Medical-Officer-CV.pdf. An employer who downloads thirty files called CV.pdf cannot tell which one is yours. A PDF also keeps your layout the same on a phone as on a laptop.",
      },
      { type: "h2", text: "Check these before you send" },
      {
        type: "ul",
        items: [
          "Your council registration and licence year are in the first few lines.",
          "Your NYSC status is stated in one line.",
          "Each job has at least one number in it.",
          "The job title and key terms from the advert appear in your CV.",
          "The file is a PDF named with your name and the role.",
        ],
      },
      {
        type: "p",
        text: "When your CV is ready, the newest [doctor jobs](/doctor-jobs), [nursing jobs](/nursing-jobs) and [pharmacist jobs](/pharmacist-jobs) are on JobberMed.",
      },
    ],
  },
  {
    slug: "apply-for-healthcare-job-by-email",
    title: "How to apply for a healthcare job by email",
    description:
      "Over half of Nigerian healthcare adverts ask for email applications. How to write the subject line, the email and the attachments so your CV gets opened.",
    published: "2026-11-10",
    readMinutes: 5,
    category: "Applications",
    image: "/images/guides/email.svg",
    body: [
      {
        type: "p",
        text: "JobberMed collected more than 900 healthcare job adverts from five Nigerian job boards between 11 September and 10 November 2026. Just over half asked applicants to apply by email. About one in five pointed to an online recruitment portal.",
      },
      {
        type: "p",
        text: "Email is how most clinics, pharmacies and private hospitals in Nigeria hire. A careless email gets a good CV ignored before anyone opens it.",
      },
      { type: "h2", text: "Copy the subject line from the advert" },
      {
        type: "p",
        text: "More than half of the email adverts told applicants what to write in the subject line. Most asked for the job title. Some asked for the job title with a location or a reference code.",
      },
      {
        type: "p",
        text: "Employers sort their mail by subject. A hospital hiring a pharmacist, two nurses and a laboratory scientist in the same week filters its inbox by job title. An email titled \"Job application\" matches none of those filters. Copy the subject from the advert character for character. If the advert gives none, use the job title and your name.",
      },
      { type: "example", lines: ["Subject: Application for Medical Officer, Chidi Okafor"] },
      { type: "h2", text: "Write a short email in place of a cover letter" },
      {
        type: "p",
        text: "The employer reads the email body before the CV. Many applicants leave it blank or paste in a full page. Four or five sentences work better. Name the job, say that you meet the main requirements, and say what you have attached.",
      },
      {
        type: "example",
        lines: [
          "Dear Hiring Manager,",
          "I am applying for the Registered Nurse role at your Lekki clinic, advertised on JobberMed.",
          "I am registered with NMCN and hold a current practising licence. I have three years of experience on a medical and surgical ward, and I completed NYSC in 2024.",
          "My CV and licence are attached as PDFs. I can start in two weeks. My number is 0803 000 0000.",
          "Yours faithfully,",
          "Ngozi Adeyemi",
        ],
      },
      { type: "h2", text: "Attach what the advert asks for" },
      {
        type: "p",
        text: "Read the advert for a list of documents. Teaching hospitals often ask for certificates, the practising licence and the NYSC discharge certificate together. Private employers usually want a CV alone. Fifteen scanned certificates sent to a clinic that asked for a CV make your email slow to open on mobile data.",
      },
      {
        type: "p",
        text: "Send PDFs. Name each file with your name and what it contains. If the advert asks for one merged PDF, merge them before you send.",
      },
      { type: "h2", text: "Tailor the CV before you attach it" },
      {
        type: "p",
        text: "The email gets your CV opened. The CV still has to match the job. Before you attach it, paste the advert and your CV into [CV Match](https://cv.jobbermed.com). It gives you a match score, lists the requirements your CV does not mention and produces a rewritten CV as a PDF.",
      },
      { type: "cta" },
      { type: "h2", text: "Apply in the first few days" },
      {
        type: "p",
        text: "About half of the adverts gave a closing date. Among the ones we could measure, half closed within 28 days of posting and a quarter closed within 14. The rest gave no closing date, so you cannot tell when the employer will stop reading. Treat those as urgent.",
      },
      {
        type: "p",
        text: "Send from an address that is your own name. Check that the files are attached. Then send the email once. Sending the same application three times does not move it up the list.",
      },
      { type: "h2", text: "Find the employer's address on the original advert" },
      {
        type: "p",
        text: "Some job boards hide the employer's email address behind a login or an image to block spam. Each JobberMed listing links to the original advert, where the address is shown. Do not guess an address. If someone replies asking for money before an interview, read [how to spot a fake healthcare job advert](/blog/fake-healthcare-job-adverts) before you answer.",
      },
    ],
  },
  {
    slug: "conmess-conhess-explained",
    title: "CONMESS & CONHESS Salary Structure in Nigeria (2026 Breakdown)",
    description:
      "Complete 2026 breakdown of the CONMESS and CONHESS salary structures in Nigeria: grade levels, monthly basic pay for doctors, nurses and pharmacists, allowances and private hospital pay.",
    published: "2026-11-10",
    updated: "2026-11-15",
    readMinutes: 6,
    category: "Pay & progression",
    image: "/images/guides/salary.svg",
    body: [
      {
        type: "p",
        text: "Federal teaching hospitals, federal medical centres (FMCs) and specialist public hospitals in Nigeria rarely print a naira figure on a recruitment notice. Instead, they list a salary grade—such as CONMESS 3 or CONHESS 9—and expect applicants to know what it pays.",
      },
      {
        type: "p",
        text: "Between September and November 2026, JobberMed collected more than 900 Nigerian healthcare job adverts from five major job boards. Only 16% stated a salary in naira, while 12% quoted a CONMESS or CONHESS grade level. The remaining 72% gave no usable pay information. Whether you are applying for a federal post or benchmarking a private hospital offer, knowing how grades, steps and allowances work puts you in a stronger position.",
      },
      { type: "h2", text: "What are CONMESS and CONHESS?" },
      {
        type: "p",
        text: "Nigeria’s federal healthcare payroll is regulated by the [National Salaries, Incomes and Wages Commission (NSIWC)](https://nsiwc.gov.ng/) and paid through IPPIS using two distinct salary structures:",
      },
      {
        type: "ul",
        items: [
          "CONMESS (Consolidated Medical Salary Structure): Exclusively covers medical doctors and dental surgeons in federal public service, spanning 7 grade levels (CONMESS 1 to CONMESS 7).",
          "CONHESS (Consolidated Health Salary Structure): Covers all other health professionals—including nurses, midwives, pharmacists, medical laboratory scientists, radiographers, physiotherapists, optometrists and health support staff—spanning 15 grade levels (CONHESS 1 to CONHESS 15).",
        ],
      },
      {
        type: "p",
        text: "Each structure is a ladder of grade levels, and each level contains vertical incremental steps. The grade in the advert is the level you enter on based on your qualification and role; your step increases automatically with each year of service, while moving to the next grade requires promotion or completing specialist training.",
      },
      { type: "h2", text: "CONMESS salary structure breakdown (doctors and dentists)" },
      {
        type: "p",
        text: "Following the NSIWC minimum wage consequential adjustments, the [official CONMESS salary circular](https://nsiwc.gov.ng/download/implementation-of-the-new-national-minimum-wage-in-the-federal-public-service-the-consolidated-medical-salary-structure-conmess/) sets the baseline consolidated salary before call duty, hazard and specialist allowances are added.",
      },
      {
        type: "table",
        columns: ["CONMESS grade & cadre", "Approx. monthly basic pay (before allowances)"],
        rows: [
          ["CONMESS 01 — House Officer / Dental Intern ([medical housemanship guide](/blog/medical-housemanship-in-nigeria))", "~₦213,700 (single fixed step)."],
          ["CONMESS 02 — Medical Officer / Dental Officer (NYSC & entry level)", "~₦228,800 to ₦275,100 across steps."],
          ["CONMESS 03 — Junior Registrar (Residency) / Medical Officer II", "~₦309,100 to ₦369,700 across steps."],
          ["CONMESS 04 — Senior Registrar II / Senior Medical Officer", "~₦386,200 to ₦477,600 across steps."],
          ["CONMESS 05 — Senior Registrar I / Principal Medical Officer", "~₦456,900 to ₦556,300 across steps."],
          ["CONMESS 06 — Consultant (entry & hospital specialist grades)", "~₦592,700 to ₦719,700 across steps."],
          ["CONMESS 07 — Chief Consultant / Director of Medical Services", "~₦829,400 to ₦998,200+ across steps."],
        ],
      },
      {
        type: "p",
        text: "In JobberMed’s advert sample, almost every vacancy that quoted CONMESS 2 or CONMESS 3 was a residency or medical officer post in a teaching hospital, across specialties such as anaesthesia, psychiatry, radiology and internal medicine. For example, an [October 2026 OAUTHC recruitment notice](https://fcc.gov.ng/job-listings/obafemi-awolowo-university-teaching-hospitals-complex-ile-ife/) placed Medical Officers on CONMESS 3 Step 2. More than 90% of adverts quoting CONMESS 5 or CONMESS 6 were consultant posts. Browse active [doctor jobs in Nigeria](/doctor-jobs) and [dentist jobs in Nigeria](/dentist-jobs) to compare current openings.",
      },
      { type: "h2", text: "CONHESS salary structure breakdown (nurses, pharmacists and allied health)" },
      {
        type: "p",
        text: "Under the [NSIWC CONHESS circular](https://nsiwc.gov.ng/nsiwc-news-update/circulars-salary-structures/), entry grades depend on your professional qualification, council registration and whether the post is an internship or full officer appointment.",
      },
      {
        type: "table",
        columns: ["CONHESS grade & typical cadre", "Approx. monthly basic pay (before allowances)"],
        rows: [
          ["CONHESS 04 – 05 — Health Assistants / Junior Technicians", "~₦83,000 to ₦112,500 across steps."],
          ["CONHESS 06 — Registered Nurse (Diploma) / Pharmacy, Lab & Dental Technicians", "~₦119,900 to ₦160,900 across steps."],
          ["CONHESS 07 — Nursing Officer II (BNSc or dual RN/RM entry)", "~₦155,900 to ₦211,100 across steps."],
          ["CONHESS 08 — Intern Pharmacist / Intern Medical Lab Scientist / Nursing Officer I", "~₦174,500 to ₦239,400 across steps."],
          ["CONHESS 09 — Pharmacist / Medical Lab Scientist / Radiographer / Physiotherapist / Senior Nursing Officer", "~₦199,000 to ₦269,900 across steps."],
          ["CONHESS 10 – 12 — Principal Officers / Assistant Chief / Chief Nursing Officer (CNO)", "~₦228,800 to ₦376,600 across steps."],
          ["CONHESS 13 – 15 — Assistant Director / Deputy Director / Director of Nursing or Pharmacy", "~₦350,000 to ₦678,800+ across steps."],
        ],
      },
      {
        type: "p",
        text: "Across federal recruitment notices on JobberMed, CONHESS 9 appeared most often for qualified [pharmacists](/pharmacist-jobs), [medical laboratory scientists](/medical-laboratory-scientist-jobs), [allied health professionals](/allied-health-jobs) and senior [nurses](/nursing-jobs). Interns in pharmacy and medical laboratory science were advertised on CONHESS 8, while technicians sat on CONHESS 6. Watch out for mislabelled adverts: we spotted a radiographer and a pharmacist advertised under CONMESS, which is the doctors’ scale. Always confirm with the hospital’s HR office which salary table applies.",
      },
      { type: "h2", text: "Allowances that increase your take-home pay" },
      {
        type: "p",
        text: "Basic CONMESS and CONHESS figures are only the base of a federal payslip. Depending on your cadre, duty roster and posting, total monthly gross pay is substantially higher once statutory allowances are added:",
      },
      {
        type: "ul",
        items: [
          "Call duty and shift duty allowance: Paid to doctors on call and nurses or allied health staff covering rotating night and weekend shifts; often the largest addition to monthly take-home pay.",
          "Hazard allowance: A flat monthly risk allowance paid across clinical cadres in public health institutions.",
          "Specialist, teaching and rural posting allowances: Paid to certified consultants on CONMESS 5–7, clinical supervisors and staff posted to designated stations.",
          "Medical Residency Training Fund (MRTF) and uniform allowance: Annual examination and training grants for resident doctors, plus uniform maintenance allowances for federal nurses.",
        ],
      },
      {
        type: "p",
        text: "State teaching hospitals and state health service commissions run separate payrolls from federal IPPIS and may adopt a modified percentage of federal CONMESS or CONHESS tables. Always ask HR or a current staff member on your grade for the net monthly take-home pay after pension and tax deductions.",
      },
      { type: "h2", text: "How private hospital pay compares in Nigeria" },
      {
        type: "p",
        text: "Private employers quote a single monthly package in naira when they disclose pay. In JobberMed’s 2026 sample (where two thirds of salary-disclosing adverts were in [Lagos](/healthcare-jobs/lagos) and [Abuja](/healthcare-jobs/abuja)), advertised pay mostly fell into these ranges:",
      },
      {
        type: "ul",
        items: [
          "Medical Officers: ₦470,000 to ₦670,000 a month (see the [Medical Officer and locum doctor jobs guide](/blog/medical-officer-locum-doctor-jobs-nigeria) for individual examples from ₦380,000 to ₦800,000 and hourly locum rates).",
          "Registered Nurses and Midwives: ₦125,000 to ₦260,000 a month (see the [nursing career guide](/blog/nursing-jobs-in-nigeria-career-guide)).",
          "Qualified Pharmacists: ₦170,000 to ₦300,000 a month.",
        ],
      },
      { type: "h2", text: "Show that you qualify for the grade on your CV" },
      {
        type: "p",
        text: "Federal teaching hospitals and top private employers screen strictly against the qualification, council practising licence (MDCN, NMCN, PCN, MLSCN) and NYSC discharge or exemption certificate tied to each grade level. Read our [guide to writing a healthcare CV in Nigeria](/blog/healthcare-cv-nigeria), then paste the job advert and your CV into [CV Match](https://cv.jobbermed.com) to check your match score, spot missing requirements and download a tailored PDF before you apply.",
      },
      { type: "cta" },
    ],
  },
  {
    slug: "fake-healthcare-job-adverts",
    title: "How to spot a fake healthcare job advert",
    description:
      "Checks to run before you apply or pay anything: fees, email addresses, pay that is too high, overseas offers and how to trace an advert back to its source.",
    published: "2026-11-10",
    readMinutes: 5,
    category: "Safer job searches",
    image: "/images/guides/safety.svg",
    body: [
      {
        type: "p",
        text: "JobberMed gathers adverts from five job boards. We do not employ anyone, and we cannot vouch for every employer whose advert appears here. You need to check each advert yourself. These are the checks we would run.",
      },
      { type: "h2", text: "Look at who is asking for money" },
      {
        type: "p",
        text: "Private hospitals, clinics, pharmacies and recruitment agencies do not charge applicants. If one asks you to pay for a form, an interview slot, a medical test or \"processing\" before you have a signed offer, stop.",
      },
      {
        type: "p",
        text: "Public institutions are less simple. Some charge an application fee, and they collect it through an official channel such as Remita on the hospital's own website. A request to transfer money to a personal bank account is a scam, whatever name is on the letterhead.",
      },
      { type: "h2", text: "Check the email address, then check the business" },
      {
        type: "p",
        text: "A federal teaching hospital writing from a free Gmail address deserves a second look. Go to the hospital's own website and confirm that the vacancy is listed there.",
      },
      {
        type: "p",
        text: "Small clinics and pharmacies are different. Plenty of real ones use Gmail or Yahoo, so the address alone proves nothing. Look the business up. Check that it has a street address, a phone number that someone answers and a location on a map.",
      },
      { type: "h2", text: "Compare the pay with other adverts" },
      {
        type: "p",
        text: "Scam adverts promise more than the job pays. In the adverts we collected between September and November 2026, medical officer roles that stated a salary mostly paid between ₦470,000 and ₦670,000 a month. Registered nurse roles mostly paid between ₦125,000 and ₦260,000.",
      },
      {
        type: "p",
        text: "An advert that offers a newly qualified nurse ₦900,000 a month for light duties is almost certainly not real. Our guide to [CONMESS, CONHESS and private pay](/blog/conmess-conhess-explained) has more figures.",
      },
      { type: "h2", text: "Verify overseas offers with the destination country" },
      {
        type: "p",
        text: "Adverts for jobs in the UK, Canada or the Gulf often promise visa sponsorship in return for a fee paid to an agent. Check the employer before you pay anyone.",
      },
      {
        type: "p",
        text: "For UK jobs, the Home Office publishes a register of licensed sponsors. An employer that is not on the register cannot sponsor your visa. You will also need registration with the regulator for your profession in that country, and the regulator's website explains the real process and the real fees.",
      },
      { type: "h2", text: "Watch how they contact you" },
      {
        type: "p",
        text: "Be careful when the whole interview happens in a WhatsApp chat, when an offer arrives with no interview, or when someone presses you to decide today. Real employers use WhatsApp to arrange interviews, so the app is not the warning sign. The warning sign is an employer who will not name a place to meet or put the offer in writing.",
      },
      { type: "h2", text: "Trace the advert back to its source" },
      {
        type: "p",
        text: "Every JobberMed listing names the job board it came from and links to the original advert. For a federal hospital, also check the hospital's website or the newspaper notice that the advert cites. If the only copy of a vacancy is a forwarded message, treat it as unverified.",
      },
      { type: "h2", text: "If you have already paid" },
      {
        type: "p",
        text: "Call your bank at once and ask them to recall the transfer. Report the fraud to the police. Tell the job board that carried the advert so they can remove it. If you found it on JobberMed, email [hello@jobbermed.com](mailto:hello@jobbermed.com) with the link so we can review it.",
      },
      { type: "h2", text: "When the advert checks out" },
      {
        type: "p",
        text: "Once you trust the advert, put your effort into the application. [CV Match](https://cv.jobbermed.com) compares your CV with the advert and shows what to change before you send it.",
      },
      { type: "cta" },
    ],
  },
  {
    slug: "where-healthcare-jobs-are-nigeria",
    title: "Where Nigeria's healthcare jobs are, by state and profession",
    description:
      "We counted more than 900 Nigerian healthcare job adverts by state, employer, profession and pay. Lagos and Abuja had almost half. Elsewhere, teaching hospitals hire in large rounds.",
    published: "2026-11-10",
    readMinutes: 6,
    category: "The job market",
    image: "/images/guides/locations.svg",
    body: [
      {
        type: "p",
        text: "Between 11 September and 10 November 2026, JobberMed collected more than 900 healthcare job adverts from five Nigerian job boards. We counted where the jobs were, who posted them and what they paid.",
      },
      {
        type: "p",
        text: "This is a count of what those boards advertised. Jobs filled by word of mouth do not appear in it.",
      },
      { type: "h2", text: "Almost half the adverts were in Lagos and Abuja" },
      {
        type: "p",
        text: "Lagos had 30% of the adverts. Abuja had 19%.",
      },
      {
        type: "p",
        text: "The two cities hire differently. The Lagos adverts came from many small employers, and the average employer posted fewer than two. In Abuja, one hospital posted more than 40% of the adverts. That hospital was the African Medical Centre of Excellence.",
      },
      {
        type: "p",
        text: "You can see the current lists for [Lagos](/healthcare-jobs/lagos) and [Abuja](/healthcare-jobs/abuja).",
      },
      {
        type: "p",
        text: "For humanitarian or development work, see [how to apply for NGO and UN jobs in Nigeria](/blog/ngo-jobs-in-nigeria), including where to look for public health roles in Abuja and field posts in Borno.",
      },
      { type: "h2", text: "Outside the two cities, jobs arrive in rounds" },
      {
        type: "p",
        text: "Plateau State was third, and about three quarters of its adverts came from Jos University Teaching Hospital. In Ondo State, more than nine in ten came from the Federal Medical Centre in Owo. In Anambra State, more than eight in ten came from Nnamdi Azikiwe University Teaching Hospital. In Sokoto State, about three quarters came from Usmanu Danfodiyo University Teaching Hospital.",
      },
      {
        type: "p",
        text: "If you want to work in one of these states, a daily look at a job board shows you almost nothing for weeks. Then a federal hospital posts dozens of vacancies in one notice with one closing date. Learn which federal hospitals are near you, and have your certificates scanned and ready before the notice appears.",
      },
      { type: "h2", text: "Doctors were the largest group" },
      {
        type: "ul",
        items: [
          "[Doctors](/doctor-jobs): 25% of adverts",
          "[Nurses and midwives](/nursing-jobs): 16%",
          "[Pharmacists](/pharmacist-jobs): 12%",
          "[Allied health](/allied-health-jobs), such as radiographers and physiotherapists: 10%",
          "[Medical laboratory scientists](/medical-laboratory-scientist-jobs): 9%",
          "[Healthcare management](/healthcare-management-jobs): 5%",
          "[Dentists](/dentist-jobs): 5%",
          "[Public health](/public-health-jobs): 4%",
        ],
      },
      {
        type: "p",
        text: "The remaining 14% were for other roles inside health organisations, such as HMO officers, front desk staff and medical sales representatives.",
      },
      {
        type: "p",
        text: "If you are exploring HMO work, claims or digital health, see our guide to [non-clinical jobs for doctors and nurses in Nigeria](/blog/non-clinical-hmo-health-tech-jobs-nigeria).",
      },
      { type: "h2", text: "Most adverts did not state the pay" },
      {
        type: "p",
        text: "About 16% of the adverts gave a salary in naira, and two thirds of those were in Lagos. Another 12% gave a public service grade such as CONMESS 3. The remaining 72% gave nothing you could compare.",
      },
      {
        type: "p",
        text: "If you are negotiating outside Lagos, you have almost no published pay to point to. Our guide to [CONMESS, CONHESS and private pay](/blog/conmess-conhess-explained) lists the figures we found.",
      },
      { type: "h2", text: "Closing dates were short or missing" },
      {
        type: "p",
        text: "About half of the adverts gave a closing date. Among the ones we could measure, half closed within 28 days of posting, and a quarter closed within 14 days. The rest gave no closing date at all.",
      },
      { type: "h2", text: "What to do with these numbers" },
      {
        type: "p",
        text: "In Lagos and Abuja, new adverts appear every day from small employers who each wrote their own requirements. Apply within days, and change your CV for each advert. [CV Match](https://cv.jobbermed.com) does the comparison for you and rewrites the CV to fit.",
      },
      {
        type: "p",
        text: "In other states, watch the federal hospitals. Their recruitment rounds are large and their document lists are long, so the applicants who prepared early have the advantage.",
      },
      { type: "cta" },
      { type: "h2", text: "How we counted" },
      {
        type: "p",
        text: "We took each advert's location and employer from its text and merged different spellings of the same employer. We removed duplicate adverts before counting. An advert that named two states was counted in both.",
      },
    ],
  },
];

export function getArticle(slug: string | undefined): Article | null {
  return ARTICLES.find((article) => article.slug === slug) ?? null;
}

export const BLOG_INDEX_META = {
  path: "/blog",
  title: "Career Guides for Healthcare Professionals in Nigeria | JobberMed",
  description:
    "Practical guides for doctors, nurses, pharmacists and other health workers in Nigeria: CVs, email applications, salary grades, job scams and where the jobs are.",
  heading: "Career guides",
  intro: "Practical advice on applying for healthcare jobs in Nigeria, based on the adverts we collect every day.",
};

export function formatArticleDate(isoDate: string): string {
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [year, month, day] = isoDate.split("-").map((part) => Number.parseInt(part, 10));
  return `${day} ${months[month - 1]} ${year}`;
}
