import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { accessToken } = await req.json();
  const secretKey = process.env.API_SECRET_KEY;
  if (!secretKey) {
    throw new Error("API_SECRET_KEY is not set in environment variables");
  }
  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(secretKey);
    await jwtVerify(accessToken, secret);
    return NextResponse.json({ valid: true });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "API_SECRET_KEY is not set in environment variables"
    ) {
      throw error;
    }
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
