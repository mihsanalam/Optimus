import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    let query = insforge.database.from("sticky_notes").select("*");
    
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.is("user_id", null);
    }
    
    const { data, error } = await query.order("created_at", { ascending: true });
    
    if (error) {
      console.error("[Sticky Notes GET API] Error fetching notes:", error);
      throw error;
    }
    
    // Seed default notes in sandbox mode if database is empty
    if ((!data || data.length === 0) && !userId) {
      const defaults = [
        {
          content: "💡 Project Idea:\nIntegrate a Slack slash-command to automatically query the daily briefing and output priority reminders.",
          color: "indigo",
          position_x: 0,
          position_y: 0,
          user_id: null
        },
        {
          content: "📌 Focus Session:\nRefactor the Baileys session directory handling before pushing code freeze changes to repository.",
          color: "yellow",
          position_x: 0,
          position_y: 0,
          user_id: null
        }
      ];
      
      const { data: seeded, error: seedError } = await insforge.database
        .from("sticky_notes")
        .insert(defaults)
        .select();
        
      if (!seedError && seeded) {
        return NextResponse.json({ success: true, notes: seeded });
      }
    }
    
    return NextResponse.json({ success: true, notes: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { content = "", color = "yellow", position_x = 0, position_y = 0, userId } = await request.json();
    
    const newNote = {
      content,
      color,
      position_x,
      position_y,
      user_id: userId || null
    };
    
    const { data, error } = await insforge.database
      .from("sticky_notes")
      .insert([newNote])
      .select();
      
    if (error) {
      console.error("[Sticky Notes POST API] Error creating note:", error);
      throw error;
    }
    
    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, content, color, position_x, position_y } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }
    
    const updates: any = {
      updated_at: new Date().toISOString()
    };
    if (content !== undefined) updates.content = content;
    if (color !== undefined) updates.color = color;
    if (position_x !== undefined) updates.position_x = position_x;
    if (position_y !== undefined) updates.position_y = position_y;
    
    const { data, error } = await insforge.database
      .from("sticky_notes")
      .update(updates)
      .eq("id", id)
      .select();
      
    if (error) {
      console.error("[Sticky Notes PUT API] Error updating note:", error);
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
      .from("sticky_notes")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("[Sticky Notes DELETE API] Error deleting note:", error);
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
