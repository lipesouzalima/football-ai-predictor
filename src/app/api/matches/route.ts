import { NextResponse } from "next/server";
import { getMatches } from "@/lib/world-cup-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const matches = await getMatches();
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
