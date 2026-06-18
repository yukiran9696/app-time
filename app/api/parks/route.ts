import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const res = await fetch('https://api.themeparks.wiki/v1/destinations', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error('upstream error');

    const data = await res.json();

    const tdr = data.destinations?.find(
      (d: { slug?: string; name?: string }) =>
        d.slug === 'tokyodisneyresort' ||
        d.name?.toLowerCase().includes('tokyo disney')
    );

    if (!tdr) return NextResponse.json({ parks: [] });

    // Disneyland first, then DisneySea
    const parks = (tdr.parks ?? []).sort((a: { name: string }, b: { name: string }) => {
      const aLand = a.name.toLowerCase().includes('land');
      const bLand = b.name.toLowerCase().includes('land');
      if (aLand && !bLand) return -1;
      if (!aLand && bLand) return 1;
      return 0;
    });

    return NextResponse.json({ parks });
  } catch {
    return NextResponse.json({ error: 'パーク情報の取得に失敗しました' }, { status: 500 });
  }
}
