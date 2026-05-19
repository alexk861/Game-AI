import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdminAuthorized } from "@/lib/adminAuth";

export async function POST(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("content_candidates")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating candidate status:", error);
      return NextResponse.json(
        { error: "Failed to update candidate status", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, candidate: data });
  } catch (error: unknown) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
