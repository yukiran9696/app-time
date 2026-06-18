"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Park,
  LiveEntity,
  EntityType,
  StatusType,
  CategoryFilter,
  StatusFilter,
  SortType,
} from "@/types";

// ── 定数 ────────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  ATTRACTION: "アトラクション",
  RESTAURANT: "レストラン",
  SHOW: "ショー",
  MEET_AND_GREET: "グリーティング",
  PARADE: "パレード",
  FIREWORKS: "ナイトエンタメ",
  ENTERTAINMENT: "エンターテイメント",
  MERCHANDISE: "ショップ",
};

const TYPE_ICON: Record<string, string> = {
  ATTRACTION: "🎢",
  RESTAURANT: "🍽️",
  SHOW: "🎭",
  MEET_AND_GREET: "🤝",
  PARADE: "🎺",
  FIREWORKS: "🎆",
  ENTERTAINMENT: "✨",
  MERCHANDISE: "🛍️",
};

const STATUS: Record<StatusType, { label: string; dot: string; badge: string; border: string }> = {
  OPERATING:     { label: "営業中",         dot: "bg-green-500",  badge: "bg-green-100 text-green-700",   border: "border-green-400" },
  DOWN:          { label: "一時停止",       dot: "bg-yellow-400", badge: "bg-yellow-100 text-yellow-700", border: "border-yellow-400" },
  CLOSED:        { label: "休止中",         dot: "bg-red-400",    badge: "bg-red-100 text-red-700",       border: "border-red-200" },
  REFURBISHMENT: { label: "リニューアル中", dot: "bg-gray-400",   badge: "bg-gray-100 text-gray-500",     border: "border-gray-200" },
  NO_DATA:       { label: "情報なし",       dot: "bg-slate-300",  badge: "bg-slate-100 text-slate-400",   border: "border-slate-100" },
};

const FOOD_TYPES = new Set<EntityType>(["RESTAURANT"]);
const SHOW_TYPES = new Set<EntityType>(["SHOW", "PARADE", "FIREWORKS", "ENTERTAINMENT"]);

const REFRESH_SEC = 5 * 60;

// ── メインコンポーネント ────────────────────────────────────────────────────

export default function Home() {
  const [parks, setParks] = useState<Park[]>([]);
  const [parkIndex, setParkIndex] = useState(0);
  const [liveData, setLiveData] = useState<LiveEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [parksLoading, setParksLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_SEC);

  const [catFilter, setCatFilter] = useState<CategoryFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortType>("waitTime");

  // パーク一覧取得
  useEffect(() => {
    setParksLoading(true);
    fetch("/api/parks")
      .then((r) => r.json())
      .then((d) => setParks(d.parks ?? []))
      .catch(() => setError("パーク情報の取得に失敗しました"))
      .finally(() => setParksLoading(false));
  }, []);

  // ライブデータ取得
  const fetchLive = useCallback(async () => {
    const park = parks[parkIndex];
    if (!park) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/live/${park.id}`);
      if (!res.ok) throw new Error("api error");
      const data = await res.json();
      setLiveData(data.liveData ?? []);
      setLastUpdated(new Date());
      setCountdown(REFRESH_SEC);
    } catch {
      setError("データの取得に失敗しました。しばらく後に再試行してください。");
    } finally {
      setLoading(false);
    }
  }, [parks, parkIndex]);

  useEffect(() => {
    if (parks.length > 0) fetchLive();
  }, [fetchLive, parks]);

  // 自動更新 + カウントダウン
  useEffect(() => {
    const timer = setInterval(fetchLive, REFRESH_SEC * 1000);
    const tick = setInterval(
      () => setCountdown((c) => (c > 0 ? c - 1 : REFRESH_SEC)),
      1000
    );
    return () => {
      clearInterval(timer);
      clearInterval(tick);
    };
  }, [fetchLive]);

  // フィルタ & ソート
  const filtered = useMemo(() => {
    let data = liveData.filter((e) => e.entityType !== "MERCHANDISE");

    if (catFilter === "ATTRACTION") data = data.filter((e) => e.entityType === "ATTRACTION");
    else if (catFilter === "FOOD") data = data.filter((e) => FOOD_TYPES.has(e.entityType));
    else if (catFilter === "ENTERTAINMENT") data = data.filter((e) => SHOW_TYPES.has(e.entityType));
    else if (catFilter === "GREETING") data = data.filter((e) => e.entityType === "MEET_AND_GREET");

    if (statusFilter === "OPERATING") data = data.filter((e) => e.status === "OPERATING");
    else if (statusFilter === "INACTIVE")
      data = data.filter((e) => e.status !== "OPERATING" && e.status !== "NO_DATA");

    const ORDER: Record<StatusType, number> = { OPERATING: 0, DOWN: 1, CLOSED: 2, REFURBISHMENT: 3, NO_DATA: 4 };

    return [...data].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "ja");
      if (sort === "status") return ORDER[a.status] - ORDER[b.status];
      if (a.status === "OPERATING" && b.status !== "OPERATING") return -1;
      if (a.status !== "OPERATING" && b.status === "OPERATING") return 1;
      const aw = a.queue?.STANDBY?.waitTime ?? -1;
      const bw = b.queue?.STANDBY?.waitTime ?? -1;
      return bw - aw;
    });
  }, [liveData, catFilter, statusFilter, sort]);

  // 統計
  const stats = useMemo(() => {
    const op = liveData.filter((e) => e.status === "OPERATING");
    const waits = op
      .map((e) => e.queue?.STANDBY?.waitTime)
      .filter((w): w is number => w != null && w > 0);
    const avg = waits.length ? Math.round(waits.reduce((s, w) => s + w, 0) / waits.length) : 0;
    const max = waits.length ? Math.max(...waits) : 0;
    return {
      total: liveData.filter((e) => e.entityType !== "MERCHANDISE").length,
      operating: op.length,
      avg,
      max,
    };
  }, [liveData]);

  const parkLabel = (p: Park) =>
    p.name.toLowerCase().includes("sea") ? "🌊 ディズニーシー" : "🏰 ディズニーランド";

  const fmtCountdown = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  // ── レンダリング ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ヘッダー */}
      <header className="bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-0">
          <h1 className="text-2xl font-bold tracking-tight">🏰 東京ディズニー 待ち時間</h1>
          <p className="text-blue-200 text-sm mt-0.5">リアルタイム情報</p>

          {/* パークタブ */}
          <div className="flex gap-1 mt-5">
            {parksLoading ? (
              <div className="text-blue-300 text-sm pb-3 animate-pulse">読み込み中...</div>
            ) : (
              parks.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setParkIndex(i)}
                  className={`px-5 py-2.5 rounded-t-lg font-semibold text-sm transition-colors ${
                    parkIndex === i
                      ? "bg-white text-indigo-900"
                      : "text-blue-200 hover:bg-white/10"
                  }`}
                >
                  {parkLabel(p)}
                </button>
              ))
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* 統計バー */}
        {!loading && liveData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-wrap gap-6 items-center justify-between">
            <div className="flex gap-6">
              <Stat value={stats.operating} label="営業中" color="text-green-600" />
              <Stat value={stats.total} label="総施設数" color="text-gray-700" />
              <Stat value={`${stats.avg}分`} label="平均待ち" color="text-blue-600" />
              <Stat value={`${stats.max}分`} label="最長待ち" color="text-rose-600" />
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-gray-400 text-xs">
                  {lastUpdated.toLocaleTimeString("ja-JP")} 更新
                  <span className="ml-1 tabular-nums">（{fmtCountdown(countdown)} 後に自動更新）</span>
                </span>
              )}
              <button
                onClick={fetchLive}
                disabled={loading}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "更新中..." : "今すぐ更新"}
              </button>
            </div>
          </div>
        )}

        {/* フィルター */}
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <FilterRow
            label="カテゴリ"
            value={catFilter}
            onChange={(v) => setCatFilter(v as CategoryFilter)}
            options={[
              { key: "ALL", label: "すべて" },
              { key: "ATTRACTION", label: "🎢 アトラクション" },
              { key: "FOOD", label: "🍽️ レストラン・フード" },
              { key: "ENTERTAINMENT", label: "🎭 エンターテイメント" },
              { key: "GREETING", label: "🤝 グリーティング" },
            ]}
            activeClass="bg-indigo-600 text-white"
          />
          <div className="flex flex-wrap gap-6">
            <FilterRow
              label="状態"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as StatusFilter)}
              options={[
                { key: "ALL", label: "すべて" },
                { key: "OPERATING", label: "営業中のみ" },
                { key: "INACTIVE", label: "休止・停止のみ" },
              ]}
              activeClass="bg-green-600 text-white"
            />
            <FilterRow
              label="並び替え"
              value={sort}
              onChange={(v) => setSort(v as SortType)}
              options={[
                { key: "waitTime", label: "待ち時間順" },
                { key: "name", label: "名前順" },
                { key: "status", label: "状態順" },
              ]}
              activeClass="bg-purple-600 text-white"
            />
          </div>
        </div>

        {/* エラー */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ローディング */}
        {(loading || parksLoading) && liveData.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl animate-bounce">🏰</div>
            <p className="mt-4 text-gray-400">データを読み込んでいます...</p>
          </div>
        )}

        {/* APIデータ提供範囲の注意 */}
        {!loading && liveData.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-amber-700 text-xs flex items-start gap-2">
            <span className="mt-0.5 shrink-0">ℹ️</span>
            <span>
              現在このAPIでは<strong>アトラクション・ショー</strong>の待ち時間のみ提供されています。
              レストラン・フードの待ち時間情報は東京ディズニーリゾートの公式アプリをご確認ください。
            </span>
          </div>
        )}

        {/* 結果なし */}
        {!loading && !error && liveData.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🔍</div>
            <p>条件に一致する施設が見つかりません</p>
          </div>
        )}

        {/* カードグリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((entity) => (
            <EntityCard key={entity.id} entity={entity} />
          ))}
        </div>
      </div>

      <footer className="text-center text-xs text-gray-400 py-6 mt-4">
        データ提供:{" "}
        <a
          href="https://themeparks.wiki"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          themeparks.wiki
        </a>
        　 ©東京ディズニーリゾートの公式情報ではありません
      </footer>
    </div>
  );
}

// ── サブコンポーネント ────────────────────────────────────────────────────

function Stat({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function FilterRow({
  label,
  value,
  onChange,
  options,
  activeClass,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { key: string; label: string }[];
  activeClass: string;
}) {
  return (
    <div>
      <div className="text-xs text-gray-400 font-medium mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(({ key, label: l }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              value === key ? activeClass : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

function EntityCard({ entity }: { entity: LiveEntity }) {
  const s = STATUS[entity.status] ?? STATUS.CLOSED;
  const icon = TYPE_ICON[entity.entityType] ?? "🎪";
  const typeLabel = TYPE_LABEL[entity.entityType] ?? entity.entityType;
  const standby = entity.queue?.STANDBY?.waitTime;
  const single = entity.queue?.SINGLE_RIDER?.waitTime;

  const updatedAt = entity.lastUpdated
    ? new Date(entity.lastUpdated).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-l-4 p-4 hover:shadow-md transition-shadow ${s.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
            <span>{icon}</span>
            <span>{typeLabel}</span>
          </div>
          <h3 className="font-semibold text-gray-800 text-sm leading-snug">{entity.name}</h3>
        </div>
        <span
          className={`shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      <div className="mt-3 min-h-[2.5rem]">
        {entity.status === "OPERATING" && (
          <>
            {standby != null && standby > 0 ? (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tabular-nums text-indigo-600">{standby}</span>
                <span className="text-gray-500 text-sm">分待ち</span>
              </div>
            ) : (
              <div className="text-green-600 font-medium text-sm flex items-center gap-1">
                <span>⚡</span> 待ち時間なし
              </div>
            )}
            {single != null && (
              <div className="text-xs text-gray-400 mt-0.5">
                シングルライダー: {single}分
              </div>
            )}
          </>
        )}
        {entity.status === "DOWN" && (
          <p className="text-yellow-600 text-sm font-medium">⚠️ 一時停止中</p>
        )}
        {entity.status === "CLOSED" && (
          <p className="text-gray-400 text-sm">本日休止</p>
        )}
        {entity.status === "REFURBISHMENT" && (
          <p className="text-gray-400 text-sm">🔧 リニューアル中</p>
        )}
        {entity.status === "NO_DATA" && (
          <p className="text-slate-300 text-sm">リアルタイム情報なし</p>
        )}
      </div>

      {updatedAt && (
        <div className="text-right text-xs text-gray-300 mt-2">更新 {updatedAt}</div>
      )}
    </div>
  );
}
