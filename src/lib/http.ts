export async function readJsonBody(request: Request, maxBytes = 1024 * 1024) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    return { ok: false as const, response: Response.json({ error: "Request is too large." }, { status: 413 }) };
  }

  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      return {
        ok: false as const,
        response: Response.json({ error: "Request is too large." }, { status: 413 }),
      };
    }
    return { ok: true as const, data: JSON.parse(text) as unknown };
  } catch {
    return {
      ok: false as const,
      response: Response.json({ error: "Invalid JSON body." }, { status: 400 }),
    };
  }
}

export function validationError(issues: Array<{ path: PropertyKey[]; message: string }>) {
  return Response.json(
    {
      error: "Validation failed.",
      fields: issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 422 },
  );
}
