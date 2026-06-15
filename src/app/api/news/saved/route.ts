import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    let query = insforge.database.from("saved_articles").select("*");
    
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.is("user_id", null);
    }
    
    const { data, error } = await query.order("saved_at", { ascending: false });
    
    if (error) {
      console.error("[Saved Articles GET API] Error:", error);
      throw error;
    }
    
    return NextResponse.json({ success: true, articles: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, link, description, source, pubDate, userId } = await request.json();
    
    if (!title || !link) {
      return NextResponse.json({ success: false, error: "Title and link are required" }, { status: 400 });
    }
    
    const newBookmark = {
      title,
      link,
      description: description || "",
      source: source || "",
      pub_date: pubDate || "",
      user_id: userId || null
    };
    
    const { data, error } = await insforge.database
      .from("saved_articles")
      .insert([newBookmark])
      .select();
      
    if (error) {
      console.error("[Saved Articles POST API] Error:", error);
      throw error;
    }
    
    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }
    
    const { error } = await insforge.database
      .from("saved_articles")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("[Saved Articles DELETE API] Error:", error);
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
