/**
 * Admin access is gated by ORBIT_ADMIN_EMAIL — set this in Vercel env vars
 * to your own account email. Only that user can open /orbit-control.
 */
export function getAdminEmail(): string | null {
  const email = process.env.ORBIT_ADMIN_EMAIL?.trim().toLowerCase();
  return email || null;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = getAdminEmail();
  if (!admin || !email) return false;
  return email.trim().toLowerCase() === admin;
}
