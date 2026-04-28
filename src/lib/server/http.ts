import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function created(data: unknown) {
  return Response.json(data, { status: 201 });
}

export function noContent() {
  return new Response(null, { status: 204 });
}

function mapErrorStatus(status: unknown, statusCode: unknown) {
  if (typeof statusCode === "number") {
    return statusCode;
  }

  if (typeof status === "number") {
    return status;
  }

  const mappedStatus = {
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
  } as const;

  if (typeof status === "string" && status in mappedStatus) {
    return mappedStatus[status as keyof typeof mappedStatus];
  }

  return 400;
}

function getExternalErrorMessage(error: {
  body?: unknown;
  message?: unknown;
}) {
  const bodyMessage =
    error.body &&
    typeof error.body === "object" &&
    "message" in error.body &&
    typeof error.body.message === "string"
      ? error.body.message
      : null;

  const bodyCode =
    error.body &&
    typeof error.body === "object" &&
    "code" in error.body &&
    typeof error.body.code === "string"
      ? error.body.code
      : null;

  if (bodyCode === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return "Email sudah terdaftar. Gunakan email lain.";
  }

  if (bodyMessage) {
    return bodyMessage;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return "Permintaan tidak dapat diproses.";
}

export function handleRouteError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    const firstIssue = error.issues[0]?.message ?? "Validasi request gagal.";

    return Response.json(
      {
        error: firstIssue,
        issues: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (
    error &&
    typeof error === "object" &&
    ("body" in error || "status" in error || "statusCode" in error)
  ) {
    const message = getExternalErrorMessage(error as {
      body?: unknown;
      message?: unknown;
    });
    const status = mapErrorStatus(
      "status" in error ? error.status : undefined,
      "statusCode" in error ? error.statusCode : undefined,
    );

    return Response.json({ error: message }, { status });
  }

  console.error(error);
  return Response.json(
    { error: "Terjadi kesalahan internal pada server." },
    { status: 500 },
  );
}
