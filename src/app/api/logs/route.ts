import { requireSession } from "@/lib/server/auth-helpers";
import { handleRouteError, ok } from "@/lib/server/http";
import { listMovementLogs } from "@/lib/server/services";
import { listLogFiltersSchema } from "@/lib/server/validators";

export async function GET(request: Request) {
  try {
    await requireSession();

    const searchParams = new URL(request.url).searchParams;
    const filters = listLogFiltersSchema.parse({
      destination: searchParams.get("destination") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const items = await listMovementLogs(filters);
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
