import { auth } from "@/lib/auth";
import { requireRole, requireSession } from "@/lib/server/auth-helpers";
import { created, handleRouteError, ok } from "@/lib/server/http";
import { listUsers } from "@/lib/server/services";
import { userProvisionSchema } from "@/lib/server/validators";

export async function GET() {
  try {
    const { actor } = await requireSession();
    requireRole(actor, ["Superadmin"]);

    const users = await listUsers();
    return ok({ users });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { actor } = await requireSession();
    requireRole(actor, ["Superadmin"]);

    const payload = userProvisionSchema.parse(await request.json());

    const result = await auth.api.signUpEmail({
      headers: request.headers,
      body: payload,
    });

    return created({
      message: "Akun petugas berhasil dibuat.",
      user: result.user,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
