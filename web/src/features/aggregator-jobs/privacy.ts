export const PRIVACY_UPDATED = "Last updated: 15 November 2026";

export const PRIVACY_INTRO =
  "JobberMed values your privacy. This policy explains what information we collect when you browse healthcare vacancies, use CV Match, apply through Direct Apply or subscribe to job alerts, how we protect your data, and the choices you have.";

export const PRIVACY_SECTIONS: Array<{ title: string; text: string }> = [
  {
    title: "Information we collect",
    text: "When you subscribe to job alerts or create a JobberMed account (by email and password or Google Sign-In), we collect your email address, account profile and saved alert preferences (such as preferred clinical specialties, Nigerian states, job sources and daily or weekly email frequency). When you submit a Direct Apply application or request recruiter access, we collect the details you provide, including your name, email address, phone number, CV or resume link, cover note and organisation details. We also collect basic, aggregated usage analytics to keep the website reliable and improve search quality.",
  },
  {
    title: "Saved jobs on your device and CV Match",
    text: "When you tap the bookmark icon on a job listing, your saved shortlist is stored locally in your browser (localStorage) on your own device so you can return to it without creating an account. When you click 'Check my CV against this job' on an advert, only the public job description is passed in the link to CV Match (cv.jobbermed.com); any CV text or file you paste or upload in CV Match is used solely to generate your match score, missing-requirement flags and rewritten PDF.",
  },
  {
    title: "How we use your information",
    text: "We use your contact details and preferences to send our weekly nationwide digest or your personalised daily or weekly healthcare job alerts, to manage your account, and to process recruiter access requests. When you apply to a Direct Apply role posted on JobberMed, your application details are shared with the hiring hospital, clinic, HMO or NGO and authorised regulatory reviewers (such as MDCN officials where applicable) so they can review your submission and update your application status. We never sell your personal information or share it with third parties for marketing.",
  },
  {
    title: "External job listings",
    text: "Most vacancies in the main JobberMed feed are aggregated daily from partner job boards (including HotNigerianJobs, MyJobMag, JobsInNigeria, MedicalWorldNigeria and MedLocum) and employer portals. When you follow an external application link, you leave JobberMed and any information you submit is governed by that website's or employer's privacy policy.",
  },
  {
    title: "Data storage and security",
    text: "Account authentication, saved alert preferences and Direct Apply submissions are stored securely using Supabase with role-based access controls. Newsletter and job alert emails are delivered through Brevo. Both providers process data under strict security and privacy commitments.",
  },
  {
    title: "Your choices, unsubscribe and data deletion",
    text: "You can unsubscribe from job alert emails at any time using the one-click unsubscribe link in every email, or change your delivery frequency, specialties and states in your account personalisation settings. You can clear bookmarked jobs on your device at any time by unticking the bookmark icon or clearing your browser storage.",
  },
];

export const PRIVACY_CONTACT_EMAIL = "hello@jobbermed.com";
