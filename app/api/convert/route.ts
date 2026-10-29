import { ConversionError, convertUrl } from "@/features/converter/convert-url";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    url?: unknown;
  } | null;
  if (typeof body?.url !== "string" || !body.url.trim()) {
    return Response.json({ error: "URL을 입력해 주세요." }, { status: 400 });
  }

  try {
    const page = await convertUrl(body.url);
    return Response.json(page);
  } catch (error) {
    if (error instanceof ConversionError) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    console.error(error);
    return Response.json(
      { error: "변환 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
