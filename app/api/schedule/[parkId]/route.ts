import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ parkId: string }> }
) {
  const { parkId } = await params;
  try {
    const res = await fetch(`https://api.themeparks.wiki/v1/entity/${parkId}/schedule`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('upstream error');
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'スケジュールの取得に失敗しました' }, { status: 500 });
  }
}
