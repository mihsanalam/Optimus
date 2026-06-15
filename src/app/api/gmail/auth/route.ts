import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") || "optimus_gmail_auth";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectUri = `${siteUrl}/api/gmail/callback`;

  if (clientId) {
    // Real Google OAuth redirect URL
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(
        "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events"
      )}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;
    
    return NextResponse.redirect(googleAuthUrl);
  } else {
    // Simulated Google OAuth redirect to our mock consent page
    const mockAuthUrl = new URL("/gmail-oauth-mock", request.url);
    mockAuthUrl.searchParams.set("state", state);
    mockAuthUrl.searchParams.set("redirect_uri", redirectUri);
    return NextResponse.redirect(mockAuthUrl.toString());
  }
}
