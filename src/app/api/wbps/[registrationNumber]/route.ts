import { requireAdmin, requireSession } from "@/lib/server/auth-helpers";
import { handleRouteError, noContent, ok } from "@/lib/server/http";
import {
  deleteWbp,
  getWbpByRegistrationNumber,
  updateWbp,
} from "@/lib/server/services";
import { wbpPayloadSchema } from "@/lib/server/validators";

interface RouteContext {
  params: Promise<{
    registrationNumber: string;
  }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    await requireSession();
    const { registrationNumber } = await context.params;
    const item = await getWbpByRegistrationNumber(registrationNumber);
    return ok({ item });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireSession();
    requireAdmin(actor);

    const { registrationNumber } = await context.params;
    const payload = wbpPayloadSchema.parse(await request.json());
    const item = await updateWbp(actor, registrationNumber, payload);

    return ok({
      message: "Data WBP berhasil diperbarui.",
      item,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { actor } = await requireSession();
    requireAdmin(actor);

    const { registrationNumber } = await context.params;
    await deleteWbp(actor, registrationNumber);

    return noContent();
  } catch (error) {
    return handleRouteError(error);
  }
}
