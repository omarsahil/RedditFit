import { NextRequest, NextResponse } from "next/server";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SMTP_KEY = process.env.BREVO_SMTP_KEY; // Alternative SMTP key
const BREVO_LIST_ID = process.env.BREVO_LIST_ID || "2"; // Default list ID
const BREVO_API_URL = "https://api.brevo.com/v3/contacts";

export async function POST(request: NextRequest) {
  try {
    console.log("Environment check:", {
      hasApiKey: !!BREVO_API_KEY,
      hasSmtpKey: !!BREVO_SMTP_KEY,
      apiKeyLength: BREVO_API_KEY?.length,
      smtpKeyLength: BREVO_SMTP_KEY?.length,
      listId: BREVO_LIST_ID,
    });

    // Use API key if available, otherwise use SMTP key
    const apiKey = BREVO_API_KEY || BREVO_SMTP_KEY;

    if (!apiKey) {
      console.error("No Brevo API key or SMTP key configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    // Add contact to Brevo
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        email: email,
        listIds: [parseInt(BREVO_LIST_ID)],
        updateEnabled: true,
        attributes: {
          SIGNUP_SOURCE: "RedditFit Website",
          SIGNUP_DATE: new Date().toISOString(),
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("Email subscribed successfully:", email);
      return NextResponse.json({
        success: true,
        message: "Successfully subscribed to newsletter",
      });
    } else {
      // Handle specific Brevo errors
      if (data.code === "duplicate_parameter") {
        return NextResponse.json(
          { error: "This email is already subscribed" },
          { status: 400 }
        );
      }

      console.error("Brevo API error:", data);
      console.error("Response status:", response.status);
      console.error("Response headers:", response.headers);

      // Return more specific error message
      const errorMessage =
        data.message || data.error || "Unknown Brevo API error";
      return NextResponse.json(
        { error: `Brevo API Error: ${errorMessage}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
