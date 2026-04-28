import { requireRole, requireSession } from "@/lib/server/auth-helpers";
import { handleRouteError, ok } from "@/lib/server/http";
import { resetUserPassword } from "@/lib/server/services";
import { userPasswordResetSchema } from "@/lib/server/validators";

interface RouteContext {
  params: Promise<{
    userId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireSession();
    requireRole(actor, ["Superadmin"]);

    const { userId } = await context.params;
    const payload = userPasswordResetSchema.parse(await request.json());
    const user = await resetUserPassword(actor, userId, payload.newPassword);

    return ok({
      message: "Password user berhasil diperbarui dan sesi aktifnya telah diputus.",
      user,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
