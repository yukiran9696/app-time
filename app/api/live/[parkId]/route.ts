import { NextResponse } from 'next/server';

export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ parkId: string }> }
) {
  const { parkId } = await params;
  const base = 'https://api.themeparks.wiki/v1';

  try {
    const [liveRes, childrenRes] = await Promise.all([
      fetch(`${base}/entity/${parkId}/live`, { next: { revalidate: 60 } }),
      fetch(`${base}/entity/${parkId}/children`, { next: { revalidate: 300 } }),
    ]);

    if (!liveRes.ok) throw new Error('upstream error');

    const liveData = await liveRes.json();
    const liveIds = new Set((liveData.liveData ?? []).map((e: { id: string }) => e.id));

    // Merge shows/entertainments that appear in children but not in live data
    if (childrenRes.ok) {
      const childrenData = await childrenRes.json();
      const extras = (childrenData.children ?? []).filter(
        (e: { id: string; entityType: string }) =>
          !liveIds.has(e.id) &&
          ['SHOW', 'ENTERTAINMENT', 'PARADE', 'FIREWORKS', 'MEET_AND_GREET', 'RESTAURANT'].includes(
            e.entityType
          )
      );
      // Mark them NO_DATA since we have no live status for these
      const withStatus = extras.map((e: { id: string; entityType: string; name: string }) => ({
        ...e,
        status: 'NO_DATA',
        lastUpdated: new Date().toISOString(),
      }));
      liveData.liveData = [...(liveData.liveData ?? []), ...withStatus];
    }

    return NextResponse.json(liveData);
  } catch {
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 });
  }
}
