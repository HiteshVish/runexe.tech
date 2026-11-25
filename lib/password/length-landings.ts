export const PASSWORD_LENGTHS = [8, 12, 16, 20, 24, 32] as const;

export type PasswordLengthSlug = (typeof PASSWORD_LENGTHS)[number];

export function isPasswordLength(s: string): s is `${PasswordLengthSlug}` {
  return (PASSWORD_LENGTHS as readonly number[]).includes(parseInt(s, 10));
}

export function passwordLandingMeta(length: PasswordLengthSlug) {
  return {
    title: `${length} Character Password Generator – Free, Secure, No Signup | RunExe`,
    description: `Generate a free ${length}-character password in your browser with crypto.getRandomValues. No storage, no signup — by RunExe Technology.`,
    h1: `${length} character password generator`,
    lead: `Create a strong ${length}-character password instantly. Runs in your browser; nothing is uploaded or stored.`,
    path: `/tools/generate-password/${length}` as const,
    initialLength: length,
  };
}