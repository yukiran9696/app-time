import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json();
    const id = crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 16);

    await redis.del(`sub:${id}`);
    await redis.srem("sub:all", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
