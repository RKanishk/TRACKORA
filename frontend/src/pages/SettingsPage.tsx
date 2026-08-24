import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Building2, CreditCard, Save, UserCircle } from "lucide-react";

import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { useLayoutContext } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/context/auth-context";
import { ROLE_LABELS } from "@/lib/permissions";
import { toFriendlyError } from "@/lib/errors";
import { formatDate, formatRelativeTime } from "@/lib/format";
import type { Tone } from "@/lib/status";
import { updateTenant } from "@/services/tenants.service";
import type { Plan, Tenant, TenantStatus, UpdateTenantInput, UserStatus } from "@/types/api";

const PLAN_LABELS: Record<Plan, string> = {
  starter: "Starter",
  growth: "Growth",
  enterprise: "Enterprise",
};

const TENANT_STATUS_META: Record<TenantStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  suspended: { label: "Suspended", tone: "danger" },
  pending_verification: { label: "Pending verification", tone: "warning" },
};

const USER_STATUS_META: Record<UserStatus, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  invited: { label: "Invited", tone: "info" },
  suspended: { label: "Suspended", tone: "danger" },
};

/** The subset of tenant fields this page edits (mirrors updateTenantSchema, minus logoUrl). */
interface WorkspaceForm {
  name: string;
  website: string;
  industry: string;
  companySize: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

function toForm(t: Tenant): WorkspaceForm {
  return {
    name: t.name ?? "",
    website: t.website ?? "",
    industry: t.industry ?? "",
    companySize: t.companySize ?? "",
    addressLine1: t.addressLine1 ?? "",
    addressLine2: t.addressLine2 ?? "",
    city: t.city ?? "",
    state: t.state ?? "",
    postalCode: t.postalCode ?? "",
    country: t.country ?? "",
  };
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-medium text-ink">{children}</span>
    </div>
  );
}

export function SettingsPage() {
  const { tenant, tenantLoading, tenantError, reloadTenant } = useLayoutContext();
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission("tenant:manage");

  const [form, setForm] = useState<WorkspaceForm | null>(null);
  const [errors, setErrors] = useState<{ name?: string; website?: string }>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // Re-hydrate the form whenever the underlying tenant changes (initial load
  // and after a successful save, which bumps `updatedAt`). Not while editing —
  // the tenant object is stable between saves, so edits are never clobbered.
  useEffect(() => {
    if (tenant) setForm(toForm(tenant));
  }, [tenant?.id, tenant?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseline = useMemo(() => (tenant ? toForm(tenant) : null), [tenant]);
  const dirty = !!form && !!baseline && JSON.stringify(form) !== JSON.stringify(baseline);

  function set<K extends keyof WorkspaceForm>(key: K, value: string) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSavedFlash(false);
    // Clear the inline validation error for the field being edited.
    if (key === "name") setErrors((prev) => ({ ...prev, name: undefined }));
    else if (key === "website") setErrors((prev) => ({ ...prev, website: undefined }));
  }

  function validate(f: WorkspaceForm): boolean {
    const next: { name?: string; website?: string } = {};
    if (f.name.trim().length < 2) next.name = "Workspace name must be at least 2 characters.";
    if (f.website.trim() && !/^https?:\/\//i.test(f.website.trim())) {
      next.website = "Include the full URL, e.g. https://example.com";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!form || !validate(form)) return;
    setSaving(true);
    setSaveError(null);
    try {
      const patch: UpdateTenantInput = {
        name: form.name.trim(),
        website: form.website.trim(),
        industry: form.industry.trim(),
        companySize: form.companySize.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postalCode: form.postalCode.trim(),
        country: form.country.trim(),
      };
      await updateTenant(patch);
      setSavedFlash(true);
      reloadTenant();
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    if (baseline) setForm(baseline);
    setErrors({});
    setSaveError(null);
    setSavedFlash(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Manage your workspace and account.</p>
      </div>

      {tenantLoading && !tenant ? (
        <Card>
          <CardHeader title="Workspace" icon={<Building2 size={16} />} />
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </CardContent>
        </Card>
      ) : tenantError && !tenant ? (
        <Card>
          <ErrorState error={tenantError} onRetry={reloadTenant} />
        </Card>
      ) : tenant && form ? (
        <>
          {/* Workspace details (editable with tenant:manage) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <Card>
              <CardHeader
                title="Workspace"
                description="Your company's profile across Trackora."
                icon={<Building2 size={16} />}
                action={<Badge tone="neutral" dot={false}>{PLAN_LABELS[tenant.plan]}</Badge>}
              />
              <CardContent className="space-y-4">
                {!canManage && (
                  <div className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-xs text-ink-muted">
                    You have read-only access to workspace settings. Ask an owner or admin to make changes.
                  </div>
                )}

                <TextField
                  label="Workspace name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  error={errors.name}
                  disabled={!canManage || saving}
                  maxLength={80}
                  autoComplete="organization"
                />

                <TextField
                  label="Workspace URL"
                  value={tenant.slug}
                  prefix="trackora.app/"
                  disabled
                  readOnly
                  hint="The workspace URL is fixed and can't be changed here."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="Website"
                    value={form.website}
                    onChange={(e) => set("website", e.target.value)}
                    error={errors.website}
                    disabled={!canManage || saving}
                    placeholder="https://example.com"
                    inputMode="url"
                  />
                  <TextField
                    label="Industry"
                    value={form.industry}
                    onChange={(e) => set("industry", e.target.value)}
                    disabled={!canManage || saving}
                    placeholder="e.g. Logistics"
                  />
                </div>

                <TextField
                  label="Company size"
                  value={form.companySize}
                  onChange={(e) => set("companySize", e.target.value)}
                  disabled={!canManage || saving}
                  placeholder="e.g. 11–50"
                  hint="Number of employees, e.g. 1–10, 11–50, 51–200."
                />

                <div className="border-t border-line pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    Business address
                  </p>
                  <div className="space-y-4">
                    <TextField
                      label="Address line 1"
                      value={form.addressLine1}
                      onChange={(e) => set("addressLine1", e.target.value)}
                      disabled={!canManage || saving}
                      autoComplete="address-line1"
                    />
                    <TextField
                      label="Address line 2"
                      value={form.addressLine2}
                      onChange={(e) => set("addressLine2", e.target.value)}
                      disabled={!canManage || saving}
                      autoComplete="address-line2"
                    />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        label="City"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        disabled={!canManage || saving}
                        autoComplete="address-level2"
                      />
                      <TextField
                        label="State / Province"
                        value={form.state}
                        onChange={(e) => set("state", e.target.value)}
                        disabled={!canManage || saving}
                        autoComplete="address-level1"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <TextField
                        label="Postal code"
                        value={form.postalCode}
                        onChange={(e) => set("postalCode", e.target.value)}
                        disabled={!canManage || saving}
                        autoComplete="postal-code"
                      />
                      <TextField
                        label="Country"
                        value={form.country}
                        onChange={(e) => set("country", e.target.value)}
                        disabled={!canManage || saving}
                        autoComplete="country-name"
                      />
                    </div>
                  </div>
                </div>

                {saveError != null && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    {toFriendlyError(saveError).message}
                  </div>
                )}
              </CardContent>

              {canManage && (
                <CardFooter className="justify-end">
                  <span className="mr-auto text-sm text-emerald-600" aria-live="polite">
                    {savedFlash && !dirty ? "Saved" : ""}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleReset}
                    disabled={!dirty || saving}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving} disabled={!dirty}>
                    <Save size={16} />
                    Save changes
                  </Button>
                </CardFooter>
              )}
            </Card>
          </form>

          {/* Plan & billing (read-only here) */}
          <Card>
            <CardHeader
              title="Plan & billing"
              description="Your subscription tier and billing cadence."
              icon={<CreditCard size={16} />}
            />
            <CardContent className="divide-y divide-line">
              <InfoRow label="Plan">{PLAN_LABELS[tenant.plan]}</InfoRow>
              <InfoRow label="Billing cycle">
                <span className="capitalize">{tenant.billingCycle}</span>
              </InfoRow>
              <InfoRow label="Workspace status">
                <StatusBadge meta={TENANT_STATUS_META[tenant.status]} />
              </InfoRow>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-ink-muted">
                Plan and billing changes are managed by your account owner.
              </p>
            </CardFooter>
          </Card>

          {/* Account (read-only) */}
          {user && (
            <Card>
              <CardHeader title="Your account" icon={<UserCircle size={16} />} />
              <CardContent>
                <div className="mb-2 flex items-center gap-3">
                  <Avatar name={user.name} src={user.avatarUrl} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                  </div>
                </div>
                <div className="divide-y divide-line">
                  <InfoRow label="Role">{ROLE_LABELS[user.role]}</InfoRow>
                  <InfoRow label="Account status">
                    <StatusBadge meta={USER_STATUS_META[user.status]} />
                  </InfoRow>
                  <InfoRow label="Member since">{formatDate(user.createdAt)}</InfoRow>
                  <InfoRow label="Last sign-in">{formatRelativeTime(user.lastLoginAt)}</InfoRow>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
