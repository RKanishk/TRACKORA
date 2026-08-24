import { useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { useApiResource } from "@/hooks/useApiResource";
import { getCurrentTenant } from "@/services/tenants.service";
import type { Tenant } from "@/types/api";

export interface LayoutOutletContext {
  tenant: Tenant | null;
  tenantLoading: boolean;
  tenantError: unknown;
  reloadTenant: () => void;
}

/** Typed accessor for pages rendered inside the dashboard layout. */
export function useLayoutContext(): LayoutOutletContext {
  return useOutletContext<LayoutOutletContext>();
}

/**
 * The authenticated app shell: dark rail + top header + routed content.
 * The current tenant is fetched once here and shared with child pages via
 * the outlet context, so the header and Settings don't double-fetch.
 */
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    data: tenant,
    loading: tenantLoading,
    error: tenantError,
    reload: reloadTenant,
  } = useApiResource<Tenant>((signal) => getCurrentTenant(signal));

  const context: LayoutOutletContext = {
    tenant,
    tenantLoading,
    tenantError,
    reloadTenant,
  };

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Header
          tenant={tenant}
          tenantLoading={tenantLoading}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-8 lg:py-8">
          <Outlet context={context} />
        </main>
      </div>
    </div>
  );
}
