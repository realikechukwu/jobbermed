import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { CardPrimitive } from "./components/CardPrimitive";
import { RequireAuth, RequireRole } from "./features/auth/guards";
import { RouteShell } from "./layouts/RouteShell";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AboutPage } from "./pages/AboutPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { LandingPage } from "./pages/LandingPage";
import { MdcnDashboardPage } from "./pages/MdcnDashboardPage";
import { NativeJobDetailPage } from "./pages/NativeJobDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { RecruiterDashboardPage } from "./pages/RecruiterDashboardPage";
import { RecruiterJobApplicantsPage } from "./pages/RecruiterJobApplicantsPage";
import { RecruiterJobNewPage } from "./pages/RecruiterJobNewPage";
import { RecruiterAccessRequestPage } from "./pages/RecruiterAccessRequestPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { PersonalizationPage } from "./pages/PersonalizationPage";
import { SigninPage } from "./pages/SigninPage";
import { SignupPage } from "./pages/SignupPage";
import { SubscribePage } from "./pages/SubscribePage";

function AdminOnlyFallback() {
  return (
    <RouteShell title="Admin access required" subtitle="This dashboard is reserved for platform administrators.">
      <section className="shell-content" aria-label="Admin access required">
        <CardPrimitive title="Access denied">
          <p className="meta">Your account is authenticated but does not have the admin role.</p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}

function RecruiterAccessRedirectFallback() {
  return <Navigate to="/request-access/recruiter" replace />;
}

function LegacyNativeJobRedirect() {
  const { jobId } = useParams();
  return <Navigate to={jobId ? `/jobs/direct/${jobId}` : "/?source=direct"} replace />;
}

function MdcnAccessRequiredFallback() {
  return (
    <RouteShell title="MDCN access required" subtitle="This dashboard is reserved for verified MDCN officials.">
      <section className="shell-content" aria-label="MDCN access required">
        <CardPrimitive title="Access restricted">
          <p className="meta">MDCN access is assigned by admin; contact an administrator.</p>
        </CardPrimitive>
      </section>
    </RouteShell>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/jobs/direct" element={<Navigate to="/?source=direct" replace />} />
      <Route path="/jobs/direct/:jobId" element={<NativeJobDetailPage />} />
      <Route path="/native-jobs" element={<LegacyNativeJobRedirect />} />
      <Route path="/native-jobs/:jobId" element={<LegacyNativeJobRedirect />} />
      <Route path="/signin" element={<SigninPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/subscribe" element={<SubscribePage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />

      <Route
        path="/account/change-password"
        element={
          <RequireAuth>
            <ChangePasswordPage />
          </RequireAuth>
        }
      />

      <Route
        path="/account/personalization"
        element={
          <RequireAuth>
            <PersonalizationPage />
          </RequireAuth>
        }
      />

      <Route
        path="/request-access/recruiter"
        element={
          <RequireAuth>
            <RecruiterAccessRequestPage />
          </RequireAuth>
        }
      />

      <Route
        path="/recruiter"
        element={
          <RequireRole roles={["recruiter"]} fallback={<RecruiterAccessRedirectFallback />}>
            <RecruiterDashboardPage />
          </RequireRole>
        }
      />

      <Route
        path="/recruiter/jobs/new"
        element={
          <RequireRole roles={["recruiter"]} fallback={<RecruiterAccessRedirectFallback />}>
            <RecruiterJobNewPage />
          </RequireRole>
        }
      />

      <Route
        path="/recruiter/jobs/:jobId/applicants"
        element={
          <RequireRole roles={["recruiter"]} fallback={<RecruiterAccessRedirectFallback />}>
            <RecruiterJobApplicantsPage />
          </RequireRole>
        }
      />

      <Route
        path="/mdcn"
        element={
          <RequireRole roles={["mdcn_official"]} fallback={<MdcnAccessRequiredFallback />}>
            <MdcnDashboardPage />
          </RequireRole>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireRole roles={["admin"]} fallback={<AdminOnlyFallback />}>
            <AdminDashboardPage />
          </RequireRole>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
