import { promises as fs } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const MAC_PATTERN = /([0-9a-fA-F]{1,2}(:[0-9a-fA-F]{1,2}){5})/;

async function lookupViaProcNetArp(ip: string): Promise<string | null> {
  let contents: string;
  try {
    contents = await fs.readFile("/proc/net/arp", "utf8");
  } catch {
    return null; // /proc/net/arp doesn't exist (e.g. non-Linux) - try the fallback.
  }

  const lines = contents.split("\n").slice(1); // skip header row
  for (const line of lines) {
    const columns = line.trim().split(/\s+/);
    if (columns.length < 6) continue;
    const [entryIp, , flags, hwAddress] = columns;
    if (entryIp !== ip) continue;
    // Flags 0x2 = a complete, resolved entry; anything else (e.g. 0x0
    // incomplete) means the MAC isn't actually known yet.
    if (flags !== "0x2") continue;
    if (hwAddress && hwAddress !== "00:00:00:00:00:00") {
      return hwAddress.toLowerCase();
    }
  }
  return null;
}

// Dev-convenience fallback for machines without /proc/net/arp (e.g. macOS).
// Not relied on in the deployed (Linux/Docker) path.
async function lookupViaArpCommand(ip: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("arp", ["-n", ip]);
    const match = stdout.match(MAC_PATTERN);
    return match ? match[1].toLowerCase() : null;
  } catch {
    return null;
  }
}

// Best-effort MAC resolution for a client IP via the OS's ARP cache. Only
// works when the client shares an L2 subnet with this server and already
// has a populated ARP entry - fails across routers, VPNs, or non-host-
// networked containers. Never throws; returns null on any failure so a
// lookup failure can never block a submission.
export async function lookupClientMac(ip: string): Promise<string | null> {
  const viaProc = await lookupViaProcNetArp(ip);
  if (viaProc) return viaProc;
  return lookupViaArpCommand(ip);
}
