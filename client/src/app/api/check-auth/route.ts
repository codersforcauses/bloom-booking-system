import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { accessToken } = await req.json();

  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(process.env.API_SECRET_KEY);
    await jwtVerify(accessToken, secret);
    return NextResponse.json({ valid: true });
  } catch (error) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
