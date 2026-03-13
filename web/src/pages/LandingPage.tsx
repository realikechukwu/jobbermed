import { useEffect, useRef } from "react";
import "../styles/landing.css";

const ROLES = ["Doctors", "Nurses", "Pharmacists", "Med Lab", "Radiographers", "Dentists", "Allied Health"];

/* ── pre-computed survey data (294 responses) ── */

const SURVEY_TOTAL = 294;

const CHALLENGE_BUBBLES = [
  { stat: "59%", label: "No clear salary information" },
  { stat: "46%", label: "Jobs not advertised publicly" },
  { stat: "40%", label: "Too much misinformation & fake postings" },
  { stat: "28%", label: "Jobs shared too late" },
  { stat: "25%", label: "Too many irrelevant roles" },
];

const DISCOVERY_STATS = [
  { stat: "64%", label: "WhatsApp / Telegram groups", accent: false },
  { stat: "41%", label: "Colleagues & word of mouth", accent: false },
  { stat: "35%", label: "Job listing websites", accent: true },
  { stat: "14%", label: "Rarely see any openings", accent: false },
];

const FEATURES = [
  {
    title: "Built for healthcare professionals",
    desc: "Explore roles for doctors, nurses, pharmacists, med lab professionals, radiographers, dentists, and allied health workers.",
  },
  {
    title: "Filter by specialty and location",
    desc: "Quickly narrow jobs to the profession and location that matter most to you.",
  },
  {
    title: "Clean interface, less clutter",
    desc: "Browse relevant healthcare jobs without the noise of generic job boards.",
  },
  {
    title: "Tailored job alerts",
    desc: "Get curated alerts based on your profession and preferred location.",
  },
];

const HEADLINE_STATS = [
  { value: "294", label: "Professionals surveyed" },
  { value: "94%", label: "Open to new opportunities" },
  { value: "44%", label: "Say finding jobs is difficult" },
  { value: "3.5/5", label: "Average difficulty rating" },
];

function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    const items = container.querySelectorAll(".reveal-item");
    items.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return containerRef;
}

export function LandingPage() {
  const surveyRef = useScrollReveal();
  const challengeRef = useScrollReveal();
  const discoveryRef = useScrollReveal();
  const solutionRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  return (
    <div className="landing-page">
      <div className="top-strip" />

      {/* ── Hero ── */}
      <section className="hero-banner">
        <div className="hero-inner">
          <a className="brand-link" href="https://jobbermed.com/" aria-label="Go to homepage">
            <img src="/images/logo.png" alt="JobberMed" className="brand-logo" />
          </a>

          <h1 className="landing-headline">Find healthcare jobs faster</h1>

          <p className="landing-copy">
            Built for doctors, nurses, pharmacists, med lab professionals, radiographers, dentists,
            and allied health workers. Filter by specialty and location, and get tailored job alerts
            straight to your inbox.
          </p>
        </div>
      </section>

      {/* ── Primary CTAs ── */}
      <section className="landing-action">
        <div className="landing-action-inner">
          <div className="landing-ctas">
            <a className="landing-cta-primary" href="https://jobbermed.com/subscribe">
              Get weekly job alerts
            </a>
            <a className="landing-cta-secondary" href="https://jobbermed.com/">
              Browse jobs
            </a>
          </div>

          <div className="landing-roles" aria-label="Roles covered">
            <div className="landing-roles-track">
              {[...ROLES, ...ROLES].map((role, i) => (
                <span key={`${role}-${i}`} className="landing-role-chip">
                  {role}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Survey Intro ── */}
      <section className="survey-intro" ref={surveyRef}>
        <div className="survey-intro-inner">
          <p className="survey-eyebrow reveal-item">Research-backed</p>
          <h2 className="survey-heading reveal-item">
            We asked <span className="accent-text">{SURVEY_TOTAL}</span> healthcare professionals
            about their job search
          </h2>
          <p className="survey-subtext reveal-item">
            Doctors, nurses, pharmacists, and allied health workers across Nigeria shared the
            challenges they face finding opportunities. Here's what they told us — and how we're
            solving it.
          </p>

          <div className="stat-pills">
            {HEADLINE_STATS.map((s, i) => (
              <div key={i} className={`stat-pill reveal-item`} style={{ transitionDelay: `${i * 100}ms` }}>
                <span className="stat-pill-value">{s.value}</span>
                <span className="stat-pill-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Challenges — Chat Bubbles ── */}
      <section className="survey-challenges" ref={challengeRef}>
        <div className="survey-challenges-inner">
          <div className="chat-thread">
            <div className="chat-bubble chat-question reveal-item">
              <span className="chat-avatar">Q</span>
              <div className="chat-content">
                <p className="chat-label">We asked</p>
                <p className="chat-text">
                  What challenges do you face when searching for healthcare jobs in Nigeria?
                </p>
              </div>
            </div>

            {CHALLENGE_BUBBLES.map((c, i) => (
              <div
                key={i}
                className="chat-bubble chat-response reveal-item"
                style={{ transitionDelay: `${(i + 1) * 120}ms` }}
              >
                <div className="chat-content">
                  <div className="chat-response-text">
                    <span className="chat-stat">{c.stat}</span>
                    <span className="chat-desc">{c.label}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Discovery Methods ── */}
      <section className="survey-discovery" ref={discoveryRef}>
        <div className="survey-discovery-inner">
          <div className="chat-thread">
            <div className="chat-bubble chat-question reveal-item">
              <span className="chat-avatar">Q</span>
              <div className="chat-content">
                <p className="chat-label">We asked</p>
                <p className="chat-text">
                  How do you currently find health-related job opportunities?
                </p>
              </div>
            </div>

            <div className="discovery-bars reveal-item" style={{ transitionDelay: "150ms" }}>
              {DISCOVERY_STATS.map((d, i) => (
                <div key={i} className={`discovery-bar${d.accent ? " discovery-bar--accent" : ""}`}>
                  <div className="discovery-bar-fill" style={{ width: d.stat }} />
                  <div className="discovery-bar-content">
                    <span className="discovery-bar-stat">{d.stat}</span>
                    <span className="discovery-bar-label">{d.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-bubble chat-insight reveal-item" style={{ transitionDelay: "300ms" }}>
              <div className="chat-content">
                <p className="chat-text">
                  Most healthcare professionals still rely on WhatsApp groups, Telegram channels,
                  and word of mouth to find new roles. Only <strong>35%</strong> use job listing
                  websites, largely because there hasn't been a platform built specifically for
                  them. <strong>Until now.</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── What we offer ── */}
      <section className="survey-solutions" ref={solutionRef}>
        <div className="survey-solutions-inner">
          <p className="survey-eyebrow reveal-item">What we offer</p>
          <h2 className="survey-heading reveal-item">
            A better way to find <span className="accent-text">healthcare jobs</span>
          </h2>

          <div className="solutions-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="solution-card reveal-item"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <h3 className="solution-title">{f.title}</h3>
                <p className="solution-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="survey-final-cta" ref={ctaRef}>
        <div className="survey-final-cta-inner">
          <h2 className="final-cta-heading reveal-item">
            Join the professionals who want better
          </h2>
          <p className="final-cta-sub reveal-item">
            Stop relying on WhatsApp forwards and word of mouth. Get verified, curated healthcare
            job opportunities delivered straight to you.
          </p>
          <div className="landing-ctas final-ctas reveal-item" style={{ transitionDelay: "100ms" }}>
            <a className="landing-cta-primary" href="https://jobbermed.com/subscribe">
              Get weekly job alerts
            </a>
            <a className="landing-cta-secondary" href="https://jobbermed.com/">
              Browse jobs
            </a>
          </div>
        </div>
      </section>

      {/* ── Recruiter callout ── */}
      <section className="recruiter-strip">
        <p className="recruiter-text">
          <strong>Hiring healthcare professionals?</strong>{" "}
          Advertise your roles to a focused audience.{" "}
          <a className="recruiter-link" href="mailto:hello@jobbermed.com">
            Contact us
          </a>{" "}
          to post on JobberMed.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="footer-strip">
        <div className="landing-footer-inner">
          <div className="footer-inner">
            <a className="footer-link" href="https://jobbermed.com/">Home</a>
            <a className="footer-link" href="https://jobbermed.com/subscribe">Subscribe</a>
            <a className="footer-link" href="https://jobbermed.com/about">About</a>
          </div>
          <p className="landing-footer-copy">&copy; JobberMed 2026</p>
        </div>
      </footer>
    </div>
  );
}
