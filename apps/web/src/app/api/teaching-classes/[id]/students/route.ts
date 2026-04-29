import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify teaching class ownership
  const { data: tc } = await supabase
    .from("teaching_classes")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!tc) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  const { data: students, error } = await supabase
    .from("students")
    .select("id, name, nis, gender, is_active, sort_order")
    .eq("teaching_class_id", id)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: students ?? [] });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify teaching class ownership
  const { data: tc } = await supabase
    .from("teaching_classes")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!tc) {
    return NextResponse.json({ error: "Kelas tidak ditemukan" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { name, nis, gender } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    }

    // Get next sort_order
    const { data: last } = await supabase
      .from("students")
      .select("sort_order")
      .eq("teaching_class_id", id)
      .order("sort_order", { ascending: false })
      .limit(1);

    const sort_order = (last?.[0]?.sort_order ?? -1) + 1;

    const { data: student, error } = await supabase
      .from("students")
      .insert({
        teaching_class_id: id,
        name: name.trim(),
        nis: nis?.trim() || null,
        gender: (gender === "L" || gender === "P") ? gender : null,
        sort_order,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // student_count is maintained by frontend state; DB count is eventually consistent
    return NextResponse.json({ data: student }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
