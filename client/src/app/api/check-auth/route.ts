import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const secretKey = process.env.API_SECRET_KEY;

export async function POST(req: Request) {
  const { accessToken } = await req.json();
  // If no token provided, return 400
  if (typeof accessToken !== "string" || accessToken.trim().length === 0) {
    return NextResponse.json(
      { valid: false, error: "Missing or invalid accessToken" },
      { status: 400 },
    );
  }
  // If no secret key configured, return 503
  if (!secretKey) {
    return NextResponse.json(
      { valid: false, error: "Missing API secret key configuration" },
      { status: 503 },
    );
  }
  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(secretKey);
    await jwtVerify(accessToken, secret);
    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
