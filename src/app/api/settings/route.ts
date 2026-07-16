import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings, type Theme } from "@/lib/settings";

const VALID_THEMES: Theme[] = ["light", "dark", "system"];

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const update: { maxFileSizeMb?: number; theme?: Theme } = {};

  if (body.maxFileSizeMb !== undefined) {
    const maxFileSizeMb = Number(body.maxFileSizeMb);
    if (!Number.isFinite(maxFileSizeMb) || maxFileSizeMb <= 0) {
      return NextResponse.json(
        { error: "maxFileSizeMb must be a positive number" },
        { status: 400 }
      );
    }
    update.maxFileSizeMb = maxFileSizeMb;
  }

  if (body.theme !== undefined) {
    if (!VALID_THEMES.includes(body.theme)) {
      return NextResponse.json(
        { error: `theme must be one of: ${VALID_THEMES.join(", ")}` },
        { status: 400 }
      );
    }
    update.theme = body.theme;
  }

  await updateSettings(update);
  const settings = await getSettings();
  return NextResponse.json(settings);
}
