import {
  requireRoomOfficer,
  requireSession,
} from "@/lib/server/auth-helpers";
import { handleRouteError, ok } from "@/lib/server/http";
import {
  advanceMovementStatus,
  getMovementStatusRecord,
} from "@/lib/server/services";

interface RouteContext {
  params: Promise<{
    movementId: string;
  }>;
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const { actor } = await requireSession();
    const { movementId } = await context.params;
    const current = await getMovementStatusRecord(movementId);

    requireRoomOfficer(actor, current.destination);

    const item = await advanceMovementStatus(actor, movementId, "Tiba");
    return ok({
      message: "Kedatangan WBP berhasil dikonfirmasi.",
      item,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
