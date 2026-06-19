import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") || "optimus_gmail_auth";
  const mockParam = searchParams.get("mock");

  const clientId = process.env.GOOGLE_CLIENT_ID;

  // Resolve host and protocol dynamically from headers
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const siteUrl = `${protocol}://${host}`;
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
    // Missing client ID, redirect to dashboard with error
    const dashboardUrl = new URL("/integrations", request.url);
    dashboardUrl.searchParams.set("gmail_status", "error");
    dashboardUrl.searchParams.set("gmail_error", "Google Client ID is missing. Please configure your environment variables.");
    return NextResponse.redirect(dashboardUrl.toString());
  }
}
