import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
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
