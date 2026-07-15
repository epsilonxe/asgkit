import type { NextRequest } from "next/server";

export const INTERNAL_IP_HEADER = "x-asgkit-internal-client-ip";

const IPV4_MAPPED_PATTERN = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/;

// Reads the real TCP peer address set by server.js. Never trusts headers
// the client itself could have sent (there's no reverse proxy in this LAN
// deployment, so x-forwarded-for would be client-controlled).
export function getClientIp(request: NextRequest): string | null {
  const raw = request.headers.get(INTERNAL_IP_HEADER);
  if (!raw) return null;
  const ipv4Mapped = raw.match(IPV4_MAPPED_PATTERN);
  return ipv4Mapped ? ipv4Mapped[1] : raw;
}
