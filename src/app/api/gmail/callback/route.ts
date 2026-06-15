import { NextResponse } from "next/server";
import { insforge } from "@/lib/insforge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state") || "optimus_gmail_auth";
  const mockEmail = searchParams.get("email") || "mihsan.dev@gmail.com";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectUri = `${siteUrl}/api/gmail/callback`;

  // Return url after oauth
  const dashboardUrl = new URL("/dashboard", request.url);
  dashboardUrl.searchParams.set("tab", "integrations");
  
  if (!code) {
    dashboardUrl.searchParams.set("gmail_status", "error");
    dashboardUrl.searchParams.set("gmail_error", "No code returned from auth provider");
    return NextResponse.redirect(dashboardUrl.toString());
  }

  // Helper to save credentials in the users table
  const saveToDatabase = async (userId: string, credentials: any) => {
    if (!userId || userId === "optimus_gmail_auth") return;
    try {
      const { error: dbErr } = await insforge.database
        .from("users")
        .update({
          gmail_credentials: credentials
        })
        .eq("id", userId);
      if (dbErr) {
        console.error("[Gmail OAuth Callback] Error updating db user credentials:", dbErr);
      } else {
        console.log("[Gmail OAuth Callback] Successfully saved credentials for user:", userId);
      }
    } catch (dbErr) {
      console.error("[Gmail OAuth Callback] Exception updating user credentials:", dbErr);
    }
  };

  // 1. Mock Authentication Fallback
  if (!clientId || code.startsWith("mock_")) {
    const creds = {
      email: mockEmail,
      accessToken: "mock_access_token_123456",
      isMock: true,
      updatedAt: new Date().toISOString()
    };
    
    await saveToDatabase(state, creds);

    dashboardUrl.searchParams.set("gmail_status", "success");
    dashboardUrl.searchParams.set("gmail_email", mockEmail);
    dashboardUrl.searchParams.set("gmail_token", "mock_access_token_123456");
    return NextResponse.redirect(dashboardUrl.toString());
  }

  // 2. Real Google Authorization exchange
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const { access_token, refresh_token } = tokenData;

    // Fetch user profile email
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profileData = await profileResponse.json();
    const email = profileData.email || "google-user@gmail.com";

    const creds = {
      email: email,
      accessToken: access_token,
      refreshToken: refresh_token || null,
      isMock: false,
      updatedAt: new Date().toISOString()
    };

    await saveToDatabase(state, creds);

    dashboardUrl.searchParams.set("gmail_status", "success");
    dashboardUrl.searchParams.set("gmail_email", email);
    dashboardUrl.searchParams.set("gmail_token", access_token);
    if (refresh_token) {
      dashboardUrl.searchParams.set("gmail_refresh_token", refresh_token);
    }

    return NextResponse.redirect(dashboardUrl.toString());
  } catch (err: any) {
    console.error("[Gmail OAuth Callback] Error exchanging code:", err);
    dashboardUrl.searchParams.set("gmail_status", "error");
    dashboardUrl.searchParams.set("gmail_error", err.message || "Failed to exchange OAuth code");
    return NextResponse.redirect(dashboardUrl.toString());
  }
}
