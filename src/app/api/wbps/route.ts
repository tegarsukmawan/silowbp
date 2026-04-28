import { requireAdmin, requireSession } from "@/lib/server/auth-helpers";
import { created, handleRouteError, ok } from "@/lib/server/http";
import { createWbp, listWbps } from "@/lib/server/services";
import { wbpPayloadSchema } from "@/lib/server/validators";

export async function GET(request: Request) {
  try {
    await requireSession();
    const search = new URL(request.url).searchParams.get("search") ?? undefined;
    const items = await listWbps(search);
    return ok({ items });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { actor } = await requireSession();
    requireAdmin(actor);

    const payload = wbpPayloadSchema.parse(await request.json());
    const item = await createWbp(actor, payload);

    return created({
      message: "Data WBP berhasil dibuat.",
      item,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
