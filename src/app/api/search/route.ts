import { NextResponse } from 'next/server';
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ success: true, results: [] });
    }

    // 1. Fetch Todos matching query
    const { data: todos, error: todosError } = await insforge.database
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .ilike('title', `%${query}%`)
      .limit(5);

    // 2. Fetch Sticky Notes matching query
    // Wrap in try-catch in case sticky_notes doesn't exist yet
    let notes: any[] = [];
    let notesError = null;
    try {
      const notesRes = await insforge.database
        .from('sticky_notes')
        .select('*')
        .eq('user_id', userId)
        .ilike('content', `%${query}%`)
        .limit(5);
      notes = notesRes.data || [];
      notesError = notesRes.error;
    } catch (e) {
      // Ignore if table doesn't exist
    }

    // Format results to Unified Search structure
    const results: any[] = [];

    if (todos && !todosError) {
      todos.forEach((todo: any) => {
        results.push({
          id: todo.id,
          type: 'task',
          title: todo.title,
          preview: todo.completed ? 'Completed Task' : 'Pending Task',
          timestamp: todo.created_at,
        });
      });
    }

    if (notes && !notesError && Array.isArray(notes)) {
      notes.forEach((note: any) => {
        results.push({
          id: note.id,
          type: 'note',
          title: 'Sticky Note',
          preview: note.content.substring(0, 60) + (note.content.length > 60 ? '...' : ''),
          timestamp: note.created_at || new Date().toISOString(),
        });
      });
    }

    // Sort by timestamp descending
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      results: results,
      total: results.length,
    });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
