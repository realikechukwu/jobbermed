// Career guides shown at /blog. The app renders these blocks as React and
// scripts/prerender-seo.mjs bundles this file to write the static pages, so
// keep it free of browser and React imports.
//
// Figures quoted in the articles come from data/master_jobs.json as it stood
// on 10 November 2026 (959 adverts posted from 11 September 2026).

export const CV_MATCH_URL = "https://cv.jobbermed.com";

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] }
  /** A sample email, CV line or subject line, shown as written. */
  | { type: "example"; lines: string[] }
  /** The CV Match call to action. */
  | { type: "cta" };

export type Article = {
  slug: string;
  title: string;
  description: string;
  /** ISO date. */
  published: string;
  readMinutes: number;
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
    slug: "healthcare-cv-nigeria",
    title: "How to write a CV for a healthcare job in Nigeria",
    description:
      "What Nigerian hospitals, clinics and pharmacies look for on a CV, based on 959 healthcare job adverts: licence, NYSC status, numbers and the advert's own words.",
    published: "2026-11-10",
    readMinutes: 5,
    body: [
      {
        type: "p",
        text: "Most CV advice online is written for bankers and software engineers. A hospital reads your CV differently. The person screening it wants to know whether you are licensed, whether you have finished NYSC, and whether you have done the work in the advert. Everything else comes second.",
      },
      {
        type: "p",
        text: "We read healthcare job adverts all day. JobberMed collected 959 of them from five Nigerian job boards between 11 September and 10 November 2026. This guide follows what those adverts ask for.",
      },
      { type: "h2", text: "Put your licence at the top" },
      {
        type: "p",
        text: "428 of the 959 adverts asked for a licence or registration with a professional council. For doctors and dentists that council is MDCN. For nurses and midwives it is NMCN, for pharmacists PCN, and for medical laboratory scientists MLSCN.",
      },
      {
        type: "p",
        text: "Write it in the first few lines, under your name and phone number. Name the council, the type of registration and the year your practising licence covers. A screener who cannot find your licence in ten seconds may not keep looking.",
      },
      { type: "example", lines: ["MDCN full registration, 2023. Practising licence current for 2026."] },
      { type: "h2", text: "Say where you stand on NYSC" },
      {
        type: "p",
        text: "185 adverts mentioned NYSC. Teaching hospitals ask for a discharge or exemption certificate. Some private pharmacies and laboratories want the opposite and advertise for serving corps members. Either way the employer is sorting applicants by NYSC status, so state yours in one line.",
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
    body: [
      {
        type: "p",
        text: "JobberMed collected 959 healthcare job adverts from five Nigerian job boards between 11 September and 10 November 2026. 503 of them asked applicants to apply by email. Another 197 pointed to an online recruitment portal.",
      },
      {
        type: "p",
        text: "Email is how most clinics, pharmacies and private hospitals in Nigeria hire. A careless email gets a good CV ignored before anyone opens it.",
      },
      { type: "h2", text: "Copy the subject line from the advert" },
      {
        type: "p",
        text: "284 of the adverts told applicants what to write in the subject line. Most asked for the job title. Some asked for the job title with a location or a reference code.",
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
        text: "497 of the adverts gave a closing date. Among the ones we could measure, half closed within 28 days of posting and a quarter closed within 14. The other 462 adverts gave no closing date, so you cannot tell when the employer will stop reading. Treat those as urgent.",
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
    title: "What CONMESS and CONHESS mean on a job advert",
    description:
      "Federal hospital adverts quote a grade such as CONMESS 3 or CONHESS 9 in place of a salary. What the grades are, which roles sit on them and how private pay compares.",
    published: "2026-11-10",
    readMinutes: 5,
    body: [
      {
        type: "p",
        text: "Federal hospitals rarely print a salary in naira. They print a grade, such as CONMESS 3 or CONHESS 9, and assume you know what it pays.",
      },
      {
        type: "p",
        text: "JobberMed collected 959 healthcare job adverts from five Nigerian job boards between 11 September and 10 November 2026. 118 of them quoted a salary grade and 152 quoted a figure in naira. The other 689 gave no usable pay information.",
      },
      { type: "h2", text: "The two salary structures" },
      {
        type: "p",
        text: "CONMESS is the Consolidated Medical Salary Structure. It covers doctors and dentists in federal service. CONHESS is the Consolidated Health Salary Structure. It covers the other health professions, including nurses, pharmacists, medical laboratory scientists, radiographers and physiotherapists, along with health support staff.",
      },
      {
        type: "p",
        text: "Each structure is a ladder of grade levels, and each level has steps. The grade in the advert is the level you would enter on. Your step within that level depends on your years in service.",
      },
      { type: "h2", text: "Which grades the adverts used for doctors" },
      {
        type: "p",
        text: "42 adverts quoted CONMESS 2 or CONMESS 3. All but one were residency posts in teaching hospitals, in specialties such as anaesthesia, psychiatry, radiology and internal medicine.",
      },
      {
        type: "p",
        text: "27 adverts quoted CONMESS 5 or CONMESS 6, and 25 of those were consultant posts. Three adverts at CONMESS 7 were for a director of medical or health services.",
      },
      { type: "h2", text: "Which grades the adverts used for other professions" },
      {
        type: "p",
        text: "CONHESS 9 appeared most often. Hospitals used it for pharmacists, medical laboratory scientists, radiographers, physiotherapists, optometrists and senior nursing officers.",
      },
      {
        type: "p",
        text: "Intern pharmacists and intern medical laboratory scientists were advertised on CONHESS 8. Technician roles in pharmacy, dentistry, anaesthesia and the laboratory were mostly on CONHESS 6.",
      },
      {
        type: "p",
        text: "Some adverts carry the wrong label. We saw a radiographer and a pharmacist advertised under CONMESS, which is the doctors' structure. When the grade does not fit the profession, ask the hospital which table applies before you assume the higher figure.",
      },
      { type: "h2", text: "How to turn a grade into naira" },
      {
        type: "p",
        text: "The National Salaries, Incomes and Wages Commission issues the salary tables, and the government revises them. A figure you find on a blog or in a WhatsApp group may come from an old table. Ask the hospital's human resources office, or a colleague on that grade, what the current monthly pay is.",
      },
      {
        type: "p",
        text: "Ask about allowances too. Call duty, hazard and rural posting allowances are paid on top of the basic figure and change your take-home pay.",
      },
      { type: "h2", text: "How private pay compares" },
      {
        type: "p",
        text: "Private employers print naira when they print anything. Ten medical officer adverts stated a salary, and most fell between ₦470,000 and ₦670,000 a month. 22 registered nurse and midwife adverts stated a salary, mostly between ₦125,000 and ₦260,000 a month. 24 adverts for qualified pharmacists stated a salary, mostly between ₦170,000 and ₦300,000 a month.",
      },
      {
        type: "p",
        text: "These are advertised figures from a small sample, and 105 of the 152 adverts with a naira salary were in Lagos. Use them to judge whether an offer is in the normal range. Do not treat them as a national average.",
      },
      { type: "h2", text: "Show that you qualify for the grade" },
      {
        type: "p",
        text: "A federal advert lists the documents each post requires, usually a current practising licence and an NYSC discharge or exemption certificate. Your CV should mention every one of them. [CV Match](https://cv.jobbermed.com) compares the advert with your CV and lists the requirements your CV leaves out.",
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
      "We counted 959 Nigerian healthcare job adverts by state, employer, profession and pay. Lagos and Abuja had almost half. Elsewhere, teaching hospitals hire in large rounds.",
    published: "2026-11-10",
    readMinutes: 6,
    body: [
      {
        type: "p",
        text: "Between 11 September and 10 November 2026, JobberMed collected 959 healthcare job adverts from five Nigerian job boards. We counted where the jobs were, who posted them and what they paid.",
      },
      {
        type: "p",
        text: "This is a count of what those boards advertised. Jobs filled by word of mouth do not appear in it.",
      },
      { type: "h2", text: "Almost half the adverts were in Lagos and Abuja" },
      {
        type: "p",
        text: "Lagos had 292 adverts, which is 30% of the total. Abuja had 179, which is 19%.",
      },
      {
        type: "p",
        text: "The two cities hire differently. The Lagos adverts came from about 160 employers, so the average employer posted fewer than two. In Abuja, one hospital posted 79 of the 179 adverts. That hospital was the African Medical Centre of Excellence.",
      },
      {
        type: "p",
        text: "You can see the current lists for [Lagos](/healthcare-jobs/lagos) and [Abuja](/healthcare-jobs/abuja).",
      },
      { type: "h2", text: "Outside the two cities, jobs arrive in rounds" },
      {
        type: "p",
        text: "Plateau State was third with 65 adverts, and 50 of them came from Jos University Teaching Hospital. Ondo State had 43, and 40 came from the Federal Medical Centre in Owo. Anambra State had 43, and 37 came from Nnamdi Azikiwe University Teaching Hospital. Sokoto State had 32, and 25 came from Usmanu Danfodiyo University Teaching Hospital.",
      },
      {
        type: "p",
        text: "If you want to work in one of these states, a daily look at a job board shows you almost nothing for weeks. Then a federal hospital posts forty vacancies in one notice with one closing date. Learn which federal hospitals are near you, and have your certificates scanned and ready before the notice appears.",
      },
      { type: "h2", text: "Doctors were the largest group" },
      {
        type: "ul",
        items: [
          "[Doctors](/doctor-jobs): 241 adverts",
          "[Nurses and midwives](/nursing-jobs): 152",
          "[Pharmacists](/pharmacist-jobs): 111",
          "[Allied health](/allied-health-jobs), such as radiographers and physiotherapists: 95",
          "[Medical laboratory scientists](/medical-laboratory-scientist-jobs): 91",
          "[Healthcare management](/healthcare-management-jobs): 49",
          "[Dentists](/dentist-jobs): 48",
          "[Public health](/public-health-jobs): 39",
        ],
      },
      {
        type: "p",
        text: "The remaining 133 adverts were for other roles inside health organisations, such as HMO officers, front desk staff and medical sales representatives.",
      },
      { type: "h2", text: "Most adverts did not state the pay" },
      {
        type: "p",
        text: "152 adverts gave a salary in naira, and 105 of those were in Lagos. Another 118 gave a public service grade such as CONMESS 3. The other 689 gave nothing you could compare.",
      },
      {
        type: "p",
        text: "If you are negotiating outside Lagos, you have almost no published pay to point to. Our guide to [CONMESS, CONHESS and private pay](/blog/conmess-conhess-explained) lists the figures we found.",
      },
      { type: "h2", text: "Closing dates were short or missing" },
      {
        type: "p",
        text: "497 adverts gave a closing date. Among the ones we could measure, half closed within 28 days of posting, and a quarter closed within 14 days. The other 462 adverts gave no closing date at all.",
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
