const INTERNAL_ORIGIN = "https://internal.invalid";

/**
 * Accept only same-origin path redirects. URL parsers treat backslashes as
 * authority separators, so a simple `startsWith("/")` check is not sufficient.
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }

  try {
    const target = new URL(value, INTERNAL_ORIGIN);
    if (target.origin !== INTERNAL_ORIGIN) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
