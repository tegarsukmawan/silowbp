import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ApiError, created, handleRouteError } from "@/lib/server/http";
import { bootstrapSchema } from "@/lib/server/validators";

export async function POST(request: Request) {
  try {
    const existingUsers = await db
      .select({ id: user.id })
      .from(user)
      .limit(1);

    if (existingUsers[0]) {
      throw new ApiError(409, "Bootstrap hanya bisa dilakukan saat sistem masih kosong.");
    }

    const payload = bootstrapSchema.parse(await request.json());

    const result = await auth.api.signUpEmail({
      headers: request.headers,
      body: {
        ...payload,
        role: "Superadmin",
        assignment: "Administrasi",
      },
    });

    return created({
      message: "Superadmin awal berhasil dibuat.",
      user: result.user,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
