import { requireSession } from "@/lib/server/auth-helpers";
import { handleRouteError, ok } from "@/lib/server/http";
import { getReportSummary } from "@/lib/server/services";
import { reportSummaryFiltersSchema } from "@/lib/server/validators";

export async function GET(request: Request) {
  try {
    await requireSession();

    const searchParams = new URL(request.url).searchParams;
    const filters = reportSummaryFiltersSchema.parse({
      range: searchParams.get("range") ?? undefined,
      destination: searchParams.get("destination") ?? undefined,
    });

    const summary = await getReportSummary(filters);
    return ok(summary);
  } catch (error) {
    return handleRouteError(error);
  }
}
