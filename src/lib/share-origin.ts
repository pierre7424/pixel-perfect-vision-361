/**
 * Origin used for QR codes and share links.
 *
 * Lovable preview origins (id-preview--…, project--…-dev, localhost) require a
 * Lovable login for external devices, so guests scanning a QR generated there
 * would be asked to sign in. We therefore always point guests at the public
 * published site, unless the app is already served from a custom domain.
 */
const PUBLIC_ORIGIN = "https://pixel-perfect-vision-361.lovable.app";

export function shareOrigin(): string {
  if (typeof window === "undefined") return PUBLIC_ORIGIN;
  const host = window.location.hostname;

  // Any Lovable-hosted origin (preview, draft, published) → use the stable
  // public address so the scanner never lands on a private preview.
  const isLovableHosted =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".lovable.app") ||
    host.endsWith(".lovableproject.com") ||
    host.endsWith(".lovable.dev");

  return isLovableHosted ? PUBLIC_ORIGIN : window.location.origin;
}

export function shareLink(token: string): string {
  return `${shareOrigin()}/s/${token}`;
}
