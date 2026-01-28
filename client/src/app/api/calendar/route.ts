import { TZDate } from "@date-fns/tz";
import { endOfDay, startOfDay } from "date-fns";
import { calendar_v3, google } from "googleapis";
import { NextResponse } from "next/server";

import { verifyToken } from "@/app/api/check-auth/route";

const PERTH_TZ = "Australia/Perth";

export async function GET(request: Request) {
  try {
    // Check authorization header
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.split(" ")[1] || null;

    const verificationResult = await verifyToken(accessToken);
    if (!verificationResult.valid) {
      console.log(
        "Unauthorized access to /api/calendar:",
        verificationResult.error,
      );
      return NextResponse.json(
        { error: verificationResult.error },
        { status: verificationResult.status },
      );
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const startParam = searchParams.get("timeMin");
    const endParam = searchParams.get("timeMax");

    if (
      !process.env.GOOGLE_PROJECT_ID ||
      !process.env.GOOGLE_CALENDAR_ID ||
      !process.env.GOOGLE_CLIENT_EMAIL ||
      !process.env.GOOGLE_PRIVATE_KEY
    ) {
      console.error(
        "Google Calendar environment variables are not set properly.",
      );
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId is not set in params" },
        { status: 400 },
      );
    }

    // Resolve the path to the JSON file and authenticate
    const auth = new google.auth.GoogleAuth({
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth: auth });

    const queryParams: calendar_v3.Params$Resource$Events$List = {
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      singleEvents: true,
      privateExtendedProperty: [`roomId=${roomId}`], // use sharedExtendedProperty if using different service accounts
    };

    if (startParam) {
      const perthStart = startOfDay(new TZDate(startParam, PERTH_TZ));
      queryParams.timeMin = perthStart.toISOString();
      queryParams.orderBy = "startTime";
    }

    if (endParam) {
      const perthEnd = endOfDay(new TZDate(endParam, PERTH_TZ));
      queryParams.timeMax = perthEnd.toISOString();
    }

    console.log("Querying Google Calendar with params:", queryParams);

    const response = await calendar.events.list(queryParams);
    return NextResponse.json(response.data.items || []);
  } catch (error: unknown) {
    console.error("Next.js Calendar Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
