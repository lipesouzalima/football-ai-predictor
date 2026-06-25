import { NextResponse } from "next/server";
import { refreshMatches } from "@/lib/world-cup-data";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const matches = await refreshMatches();
    return NextResponse.json({ success: true, count: matches.length, matches });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
