import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

const secretKey = process.env.API_SECRET_KEY;

export async function verifyToken(accessToken: string | unknown) {
  // If no token provided, return 400
  if (typeof accessToken !== "string" || accessToken.trim().length === 0) {
    return {
      valid: false,
      error: "Missing or invalid accessToken",
      status: 400,
    };
  }

  // If no secret key configured, return 503
  if (!secretKey) {
    return {
      valid: false,
      error: "Missing API secret key configuration",
      status: 503,
    };
  }

  try {
    // Verify the JWT token
    const secret = new TextEncoder().encode(secretKey);
    await jwtVerify(accessToken, secret);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Authentication fails", status: 401 };
  }
}

export async function POST(req: Request) {
  const { accessToken } = await req.json();
  const result = await verifyToken(accessToken);

  if (!result.valid) {
    return NextResponse.json(
      { valid: false, error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ valid: true });
}
