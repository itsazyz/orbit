/** Map Supabase Auth errors to i18n keys under auth.errors.* */
export function getAuthErrorKey(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('rate limit') || lower.includes('email rate limit')) {
    return 'auth.errors.emailRateLimit';
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'auth.errors.emailTaken';
  }
  if (lower.includes('invalid email')) {
    return 'auth.errors.invalidEmail';
  }
  if (lower.includes('password') && lower.includes('least')) {
    return 'auth.errors.weakPassword';
  }
  if (lower.includes('signup is disabled')) {
    return 'auth.errors.signupDisabled';
  }

  return 'auth.errors.generic';
}
