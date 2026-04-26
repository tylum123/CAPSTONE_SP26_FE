export type SupportedRole = "admin" | "farmer" | "worker";

export function normalizeAuthRole(role: unknown): SupportedRole | null {
  const normalized = String(role || "").trim().toLowerCase();

  if (normalized === "admin") return "admin";
  if (normalized === "farmer") return "farmer";
  if (normalized === "worker") return "worker";

  return null;
}

export function mapAuthUser(data: any, fallbackEmail = "") {
  const resolvedUserId = String(
    data?.userId ?? data?.id ?? data?.user_id ?? ""
  ).trim();

  const email = String(data?.email ?? fallbackEmail ?? "");

  return {
    id: resolvedUserId,
    userId: resolvedUserId,
    email,
    fullName: String(data?.fullName ?? data?.full_name ?? data?.name ?? email),
  };
}

export function resolveTokenExpiresAt(data: any): string | undefined {
  const value = data?.expiresAt ?? data?.expires_at ?? data?.expiration;
  return value ? String(value) : undefined;
}
