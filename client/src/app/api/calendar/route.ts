import fs from "fs";
import { calendar_v3, google } from "googleapis";
import { NextResponse } from "next/server";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (
      !process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      !process.env.GOOGLE_CALENDAR_ID
    ) {
      console.error(
        "GOOGLE_APPLICATION_CREDENTIALS or GOOGLE_CALENDAR_ID is not set in environment variables.",
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
    const keyPath = path.join(
      process.cwd(),
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
    );
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth: auth });

    const queryParams: calendar_v3.Params$Resource$Events$List = {
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      singleEvents: true,
      orderBy: "startTime",
      privateExtendedProperty: [`roomId=${roomId}`], // use sharedExtendedProperty if using different service accounts
    };

    const response = await calendar.events.list(queryParams);
    return NextResponse.json(response.data.items || []);
  } catch (error: unknown) {
    console.error("Next.js Calendar Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
