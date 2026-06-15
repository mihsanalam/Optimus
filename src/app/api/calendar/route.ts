import { NextResponse } from "next/server";
import { getValidGmailToken, listGoogleCalendarEvents, createGoogleCalendarEvent, deleteGoogleCalendarEvent } from "@/lib/gmailHelper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const gmailAccessToken = searchParams.get("gmailAccessToken");
    const gmailRefreshToken = searchParams.get("gmailRefreshToken");

    const resolved = await getValidGmailToken({
      gmailAccessToken,
      gmailRefreshToken,
      userId
    });

    if (!resolved.accessToken) {
      return NextResponse.json({ success: true, isConnected: false, events: [] });
    }

    const events = await listGoogleCalendarEvents(resolved.accessToken);
    return NextResponse.json({ success: true, isConnected: true, events });
  } catch (err: any) {
    console.error("[Calendar GET API] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, gmailAccessToken, gmailRefreshToken, summary, startISO, endISO, description, location } = await request.json();

    if (!summary || !startISO || !endISO) {
      return NextResponse.json({ success: false, error: "Missing required event fields (summary, startISO, endISO)" }, { status: 400 });
    }

    const resolved = await getValidGmailToken({
      gmailAccessToken,
      gmailRefreshToken,
      userId
    });

    if (!resolved.accessToken) {
      return NextResponse.json({ success: false, error: "Google Calendar not connected" }, { status: 400 });
    }

    const success = await createGoogleCalendarEvent(
      resolved.accessToken,
      summary,
      startISO,
      endISO,
      description,
      location
    );

    if (success) {
      return NextResponse.json({ success: true, message: "Calendar event created successfully" });
    } else {
      return NextResponse.json({ success: false, error: "Failed to create Google Calendar event" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[Calendar POST API] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");
    const userId = searchParams.get("userId");
    const gmailAccessToken = searchParams.get("gmailAccessToken");
    const gmailRefreshToken = searchParams.get("gmailRefreshToken");

    if (!eventId) {
      return NextResponse.json({ success: false, error: "Event ID is required" }, { status: 400 });
    }

    const resolved = await getValidGmailToken({
      gmailAccessToken,
      gmailRefreshToken,
      userId
    });

    if (!resolved.accessToken) {
      return NextResponse.json({ success: false, error: "Google Calendar not connected" }, { status: 400 });
    }

    const success = await deleteGoogleCalendarEvent(resolved.accessToken, eventId);
    if (success) {
      return NextResponse.json({ success: true, message: "Calendar event deleted successfully" });
    } else {
      return NextResponse.json({ success: false, error: "Failed to delete Google Calendar event" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("[Calendar DELETE API] Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
