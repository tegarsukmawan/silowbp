import {
  requireDoorOfficer,
  requireSession,
} from "@/lib/server/auth-helpers";
import { created, handleRouteError } from "@/lib/server/http";
import { dispatchMovement } from "@/lib/server/services";
import { dispatchMovementSchema } from "@/lib/server/validators";

export async function POST(request: Request) {
  try {
    const { actor } = await requireSession();
    requireDoorOfficer(actor);

    const payload = dispatchMovementSchema.parse(await request.json());
    const item = await dispatchMovement(actor, payload);

    return created({
      message: "Pergerakan berhasil dikirim dari Pintu 3.",
      item,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
