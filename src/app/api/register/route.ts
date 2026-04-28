import { auth } from "@/lib/auth";
import { created, handleRouteError } from "@/lib/server/http";
import { publicRegisterSchema } from "@/lib/server/validators";

export async function POST(request: Request) {
  try {
    const payload = publicRegisterSchema.parse(await request.json());

    const assignment =
      payload.role === "Admin"
        ? "Administrasi"
        : payload.role === "Petugas Pintu 3"
          ? "Pintu 3"
          : payload.assignment;

    const result = await auth.api.signUpEmail({
      headers: request.headers,
      body: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        assignment,
      },
    });

    return created({
      message: "Registrasi akun berhasil.",
      user: result.user,
    });
  } catch (error) {
    const errorCode =
      error &&
      typeof error === "object" &&
      "body" in error &&
      error.body &&
      typeof error.body === "object" &&
      "code" in error.body &&
      typeof error.body.code === "string"
        ? error.body.code
        : null;

    const errorMessage =
      error &&
      typeof error === "object" &&
      "body" in error &&
      error.body &&
      typeof error.body === "object" &&
      "message" in error.body &&
      typeof error.body.message === "string"
        ? error.body.message
        : error instanceof Error
          ? error.message
          : "";

    if (
      errorCode === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ||
      errorMessage.includes("User already exists")
    ) {
      return Response.json(
        {
          error: "Email sudah terdaftar. Gunakan email lain.",
        },
        { status: 409 },
      );
    }

    return handleRouteError(error);
  }
}
