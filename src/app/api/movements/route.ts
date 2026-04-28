import { requireSession } from "@/lib/server/auth-helpers";
import { handleRouteError, ok } from "@/lib/server/http";
import { listMovements } from "@/lib/server/services";
import { listMovementFiltersSchema } from "@/lib/server/validators";

export async function GET(request: Request) {
  try {
    await requireSession();

    const searchParams = new URL(request.url).searchParams;
    const filters = listMovementFiltersSchema.parse({
      destination: searchParams.get("destination") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      activeOnly: searchParams.get("activeOnly") ?? undefined,
    });

    const items = await listMovements(filters);
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}
