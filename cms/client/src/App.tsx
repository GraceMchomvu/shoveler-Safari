import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ToastProvider } from "./components/Toast";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import { ForgotPasswordPage, LoginPage, ResetPasswordPage } from "./pages/AuthPages";
import { PageEditor, PagesList, PostEditor, PostsList } from "./pages/ContentPages";
import {
  AccountPage,
  ActivityPage,
  AnalyticsPage,
  ApiKeysPage,
  BackupsPage,
  CommentsPage,
  FilesPage,
  FormDetailPage,
  FormsPage,
  MediaPage,
  MenusPage,
  NotificationsPage,
  SearchPage,
  SecurityPage,
  SeoPage,
  SettingsPage,
  ThemePage,
  UsersPage,
} from "./pages/ModulePages";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-[var(--muted)]">
        Opening your website manager…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="pages" element={<PagesList />} />
        <Route path="pages/:id" element={<PageEditor />} />
        <Route path="posts" element={<PostsList />} />
        <Route path="posts/:id" element={<PostEditor />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="menus" element={<MenusPage />} />
        <Route path="forms" element={<FormsPage />} />
        <Route path="forms/:id" element={<FormDetailPage />} />
        <Route path="comments" element={<CommentsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="theme" element={<ThemePage />} />
        <Route path="seo" element={<SeoPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="backups" element={<BackupsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="api-keys" element={<ApiKeysPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
