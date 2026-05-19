import { NextResponse } from "next/server";
import { generateContentCandidates } from "@/lib/nanoBananaClient";
import { buildNanoBananaPrompt } from "@/lib/nanoBananaInstructions";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const { topic, details, taskId } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // 1. Generate content candidates using Gemini 2.5
    const prompt = buildNanoBananaPrompt(topic, details);
    const candidates = await generateContentCandidates(topic, prompt);

    // 2. Format the generated candidates to store in DB
    const dbCandidates = candidates.map((c: Record<string, string>) => ({
      task_id: taskId || null, // Optional link to a specific task/campaign
      topic: topic,
      title: c.title,
      body: c.body,
      platform: c.platform,
      tone: c.tone,
      target_audience: c.target_audience,
      hook: c.hook,
      status: "draft"
    }));

    // 3. Save candidates to Supabase
    const { data: insertedData, error } = await supabase
      .from("content_candidates")
      .insert(dbCandidates)
      .select();

    if (error) {
      console.error("Error saving candidates to DB:", error);
      return NextResponse.json(
        { error: "Failed to save candidates to database", details: error.message },
        { status: 500 }
      );
    }

    // 4. Return success response with generated candidates
    return NextResponse.json({
      success: true,
      candidates: insertedData,
    });
  } catch (error: unknown) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
