import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import crypto from "crypto";

function subId(endpoint: string) {
  return crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 16);
}

export async function POST(req: Request) {
  try {
    const { subscription, favorites, threshold, attractionNames } = await req.json();
    const id = subId(subscription.endpoint);

    await redis.hset(`sub:${id}`, {
      subscription: JSON.stringify(subscription),
      favorites: JSON.stringify(favorites ?? []),
      threshold: String(threshold ?? 10),
      attractionNames: JSON.stringify(attractionNames ?? {}),
      notifiedAt: JSON.stringify({}),
    });
    await redis.sadd("sub:all", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
