import { requireSession } from "@/lib/server/auth-helpers";
import { handleRouteError, ok } from "@/lib/server/http";
import { getMonitoringSnapshot } from "@/lib/server/services";

export async function GET() {
  try {
    await requireSession();
    const snapshot = await getMonitoringSnapshot();
    return ok(snapshot);
  } catch (error) {
    return handleRouteError(error);
  }
}
