export const dynamic = "force-dynamic";

const NO_STORE = "no-store, no-cache, must-revalidate, proxy-revalidate";

export async function GET() {
  return Response.json(
    { t: Date.now() },
    {
      headers: {
        "Cache-Control": NO_STORE,
        Pragma: "no-cache",
      },
    },
  );
}
