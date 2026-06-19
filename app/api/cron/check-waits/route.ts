import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { webpush } from "@/lib/webpush";
import type { PushSubscription } from "web-push";

export const dynamic = "force-dynamic";

const BASE = "https://api.themeparks.wiki/v1";
const COOLDOWN_MS = 30 * 60 * 1000;

type LiveEntry = {
  id: string;
  name: string;
  status: string;
  queue?: { STANDBY?: { waitTime?: number } };
};

async function fetchLive(parkId: string): Promise<LiveEntry[]> {
  try {
    const res = await fetch(`${BASE}/entity/${parkId}/live`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.liveData ?? [];
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parkIds: string[] = [];
  try {
    const res = await fetch(`${BASE}/destinations`, { cache: "no-store" });
    const data = await res.json();
    const tdr = data.destinations?.find(
      (d: { slug?: string }) => d.slug === "tokyodisneyresort"
    );
    parkIds = (tdr?.parks ?? []).map((p: { id: string }) => p.id);
  } catch {
    return NextResponse.json({ error: "Failed to fetch parks" }, { status: 500 });
  }

  const allEntries = (await Promise.all(parkIds.map(fetchLive))).flat();
  const liveMap = new Map<string, LiveEntry>();
  for (const e of allEntries) liveMap.set(e.id, e);

  const ids = (await redis.smembers("sub:all")) as string[];
  if (!ids.length) return NextResponse.json({ ok: true, sent: 0 });

  let sent = 0;
  const now = Date.now();

  for (const id of ids) {
    const raw = await redis.hgetall(`sub:${id}`);
    if (!raw) continue;

    let subscription: PushSubscription;
    let favorites: string[];
    let threshold: number;
    let attractionNames: Record<string, string>;
    let notifiedAt: Record<string, number>;

    try {
      subscription = JSON.parse(raw.subscription as string);
      favorites = JSON.parse(raw.favorites as string);
      threshold = Number(raw.threshold) || 10;
      attractionNames = JSON.parse((raw.attractionNames as string) || "{}");
      notifiedAt = JSON.parse((raw.notifiedAt as string) || "{}");
    } catch {
      continue;
    }

    if (!favorites.length) continue;

    const triggers: { id: string; name: string; wait: number }[] = [];

    for (const favId of favorites) {
      const entry = liveMap.get(favId);
      if (!entry || entry.status !== "OPERATING") continue;
      const wait = entry.queue?.STANDBY?.waitTime;
      if (wait == null || wait > threshold) continue;
      if (now - (notifiedAt[favId] ?? 0) < COOLDOWN_MS) continue;

      const name = attractionNames[favId] ?? entry.name ?? favId;
      triggers.push({ id: favId, name, wait });
      notifiedAt[favId] = now;
    }

    if (!triggers.length) continue;

    const title = "🎢 待ち時間アラート";
    const body =
      triggers.length === 1
        ? `${triggers[0].name} が ${triggers[0].wait}分 になりました！`
        : `${triggers.length}件のお気に入りが${threshold}分以下：${triggers.map((t) => `${t.name}(${t.wait}分)`).join("、")}`;

    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({ title, body, tag: "disney-wait-alert" })
      );
      sent++;
      await redis.hset(`sub:${id}`, { notifiedAt: JSON.stringify(notifiedAt) });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "statusCode" in err) {
        const code = (err as { statusCode: number }).statusCode;
        if (code === 410 || code === 404) {
          await redis.del(`sub:${id}`);
          await redis.srem("sub:all", id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent, total: ids.length });
}
