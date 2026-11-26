export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const started = Date.now();
  let receivedBytes = 0;

  const body = request.body;
  if (body) {
    const reader = body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value?.byteLength ?? 0;
    }
  }

  return Response.json(
    { receivedBytes, serverTimeMs: Date.now() - started },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
