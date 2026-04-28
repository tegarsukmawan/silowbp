import { requireSession } from "@/lib/server/auth-helpers";
import { handleRouteError, ok } from "@/lib/server/http";

export async function GET() {
  try {
    const { session, actor } = await requireSession();
    return ok({
      session,
      actor,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
