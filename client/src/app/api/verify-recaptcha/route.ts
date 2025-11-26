import axios from "axios";

// RECAPTCHA_SECRET_KEY in .env (not syncronized in git) obtained from https://www.google.com/recaptcha/admin/create
export async function POST(req: Request) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ message: "Only POST requests allowed" }),
      { status: 405 },
    );
  }

  const data = await req.json();
  const { token } = data;
  const secretKey: string | undefined = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "RECAPTCHA_SECRET_KEY is not set in environment variables",
      );
    } else {
      return Response.json(
        JSON.stringify({ message: "Internal server error" }),
        { status: 500 },
      );
    }
  }

  if (!token) {
    return new Response(JSON.stringify({ message: "Token not found" }), {
      status: 400,
    });
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
    );

    if (response.data.success) {
      return new Response(JSON.stringify({ message: "Success" }), {
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ message: "Failed to verify" }), {
        status: 400,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
    });
  }
}
