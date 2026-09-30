/**
 * Origin used for QR codes and share links.
 * Lovable preview / localhost origins require a Lovable login for external
 * devices, so we always point guests at the public published site instead.
 */
const PUBLIC_ORIGIN = "https://pixel-perfect-vision-361.lovable.app";

export function shareOrigin(): string {
  if (typeof window === "undefined") return PUBLIC_ORIGIN;
  const host = window.location.hostname;
  const isPrivatePreview =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("id-preview--") ||
    host.endsWith(".lovableproject.com");
  return isPrivatePreview ? PUBLIC_ORIGIN : window.location.origin;
}

export function shareLink(token: string): string {
  return `${shareOrigin()}/s/${token}`;
}
