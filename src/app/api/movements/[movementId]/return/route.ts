import {
  requireDoorOfficer,
  requireSession,
} from "@/lib/server/auth-helpers";
import { handleRouteError, ok } from "@/lib/server/http";
import { advanceMovementStatus } from "@/lib/server/services";

interface RouteContext {
  params: Promise<{
    movementId: string;
  }>;
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const { actor } = await requireSession();
    requireDoorOfficer(actor);

    const { movementId } = await context.params;
    const item = await advanceMovementStatus(actor, movementId, "Kembali");

    return ok({
      message: "WBP berhasil dikonfirmasi kembali ke blok.",
      item,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
