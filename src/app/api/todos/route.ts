import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    let query = insforge.database.from("todos").select("*");
    
    if (userId) {
      query = query.eq("user_id", userId);
    } else {
      query = query.is("user_id", null);
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      console.error("[Todos GET API] Error fetching todos:", error);
      throw error;
    }
    
    // Seed default tasks in sandbox mode if database is empty
    if ((!data || data.length === 0) && !userId) {
      const defaults = [
        { title: "Review team briefing and dashboard stats", completed: false, user_id: null },
        { title: "Connect WhatsApp client and sync device status", completed: true, user_id: null },
        { title: "Establish custom daily briefing interval rules", completed: false, user_id: null }
      ];
      
      const { data: seeded, error: seedError } = await insforge.database
        .from("todos")
        .insert(defaults)
        .select();
        
      if (!seedError && seeded) {
        return NextResponse.json({ success: true, todos: seeded });
      }
    }
    
    return NextResponse.json({ success: true, todos: data || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { title, userId } = await request.json();
    if (!title) {
      return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });
    }
    
    const newTodo = {
      title,
      user_id: userId || null,
      completed: false
    };
    
    const { data, error } = await insforge.database
      .from("todos")
      .insert([newTodo])
      .select();
      
    if (error) {
      console.error("[Todos POST API] Error creating todo:", error);
      throw error;
    }
    
    return NextResponse.json({ success: true, data: data?.[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, completed, title } = await request.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }
    
    const updates: any = {};
    if (completed !== undefined) updates.completed = completed;
    if (title !== undefined) updates.title = title;
    
    const { data, error } = await insforge.database
      .from("todos")
      .update(updates)
      .eq("id", id)
      .select();
      
    if (error) {
      console.error("[Todos PUT API] Error updating todo:", error);
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
      .from("todos")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("[Todos DELETE API] Error deleting todo:", error);
      throw error;
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
