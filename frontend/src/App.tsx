import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "@/context/AuthProvider";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { RequirePermission } from "@/routes/RequirePermission";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

/**
 * Application routes.
 *
 * Everything under "/" is gated by <ProtectedRoute> (auth) and rendered inside
 * <DashboardLayout> (the app shell). Planned sections additionally pass through
 * <RequirePermission> so the route's visibility mirrors the sidebar and the
 * backend RBAC — though the API remains the real authority on every request.
 *
 * The permission on each planned route matches its NAV_ITEMS entry in
 * src/config/navigation.ts. Dashboard and Settings are available to every
 * authenticated user (Settings is read-only without `tenant:manage`).
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />

            <Route
              path="orders"
              element={
                <RequirePermission permissions={["shipments:read"]}>
                  <PlaceholderPage id="orders" />
                </RequirePermission>
              }
            />
            <Route
              path="drivers"
              element={
                <RequirePermission permissions={["drivers:read"]}>
                  <PlaceholderPage id="drivers" />
                </RequirePermission>
              }
            />
            <Route
              path="customers"
              element={
                <RequirePermission permissions={["shipments:manage"]}>
                  <PlaceholderPage id="customers" />
                </RequirePermission>
              }
            />
            <Route
              path="deliveries"
              element={
                <RequirePermission permissions={["shipments:read"]}>
                  <PlaceholderPage id="deliveries" />
                </RequirePermission>
              }
            />
            <Route
              path="tracking"
              element={
                <RequirePermission permissions={["shipments:read"]}>
                  <PlaceholderPage id="tracking" />
                </RequirePermission>
              }
            />
            <Route
              path="analytics"
              element={
                <RequirePermission permissions={["analytics:read"]}>
                  <PlaceholderPage id="analytics" />
                </RequirePermission>
              }
            />
            <Route
              path="team"
              element={
                <RequirePermission permissions={["users:read"]}>
                  <PlaceholderPage id="team" />
                </RequirePermission>
              }
            />

            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Unknown paths fall back to the dashboard (which redirects to login
            if the session isn't authenticated). */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
