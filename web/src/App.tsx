import { Navigate, Route, Routes } from "react-router-dom";
import { CardPrimitive } from "./components/CardPrimitive";
import { RequireAuth, RequireRole } from "./features/auth/guards";
import { AccessRequestCard } from "./features/access-requests/components/AccessRequestCard";
import { RouteShell } from "./layouts/RouteShell";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { MdcnDashboardPage } from "./pages/MdcnDashboardPage";
import { NativeJobDetailPage } from "./pages/NativeJobDetailPage";
import { NativeJobsPage } from "./pages/NativeJobsPage";
import { RecruiterDashboardPage } from "./pages/RecruiterDashboardPage";
import { RecruiterJobApplicantsPage } from "./pages/RecruiterJobApplicantsPage";
import { RecruiterJobNewPage } from "./pages/RecruiterJobNewPage";
import { SigninPage } from "./pages/SigninPage";
import { SignupPage } from "./pages/SignupPage";

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

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/native-jobs" element={<NativeJobsPage />} />
      <Route path="/native-jobs/:jobId" element={<NativeJobDetailPage />} />
      <Route path="/signin" element={<SigninPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />

      <Route
        path="/recruiter"
        element={
          <RequireRole roles={["recruiter"]} fallback={<AccessRequestCard requiredRole="recruiter" />}>
            <RecruiterDashboardPage />
          </RequireRole>
        }
      />

      <Route
        path="/recruiter/jobs/new"
        element={
          <RequireRole roles={["recruiter"]} fallback={<AccessRequestCard requiredRole="recruiter" />}>
            <RecruiterJobNewPage />
          </RequireRole>
        }
      />

      <Route
        path="/recruiter/jobs/:jobId/applicants"
        element={
          <RequireRole roles={["recruiter"]} fallback={<AccessRequestCard requiredRole="recruiter" />}>
            <RecruiterJobApplicantsPage />
          </RequireRole>
        }
      />

      <Route
        path="/mdcn"
        element={
          <RequireRole roles={["mdcn_official"]} fallback={<AccessRequestCard requiredRole="mdcn_official" />}>
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
