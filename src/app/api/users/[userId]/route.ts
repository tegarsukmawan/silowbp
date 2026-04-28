import { requireRole, requireSession } from "@/lib/server/auth-helpers";
import { handleRouteError, noContent, ok } from "@/lib/server/http";
import { deleteUserAccount, updateUserAccount } from "@/lib/server/services";
import { userAccountUpdateSchema } from "@/lib/server/validators";

interface RouteContext {
  params: Promise<{
    userId: string;
  }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireSession();
    requireRole(actor, ["Superadmin"]);

    const { userId } = await context.params;
    const payload = userAccountUpdateSchema.parse(await request.json());
    const user = await updateUserAccount(actor, userId, payload);

    return ok({
      message: "Akun berhasil diperbarui.",
      user,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { actor } = await requireSession();
    requireRole(actor, ["Superadmin"]);

    const { userId } = await context.params;
    await deleteUserAccount(actor, userId);

    return noContent();
  } catch (error) {
    return handleRouteError(error);
  }
}
