"use client";

import { useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, RotateCcw, SlidersHorizontal } from "lucide-react";
import { formatTZS } from "@/lib/tz";
import type { Locale } from "@/lib/i18n";

export type PriceRangeFilterProps = {
  action: string;
  locale: Locale;
  currentMin?: string;
  currentMax?: string;
  minLimit?: number;
  maxLimit?: number;
  step?: number;
  compact?: boolean;
  showHistogram?: boolean;
  embeddedInForm?: boolean;
};

// Preset quick price bands tailored for Tanzanian market & student essentials
export const PRICE_PRESETS = [
  { label: "Under 25k", min: "", max: "25000" },
  { label: "25k – 50k", min: "25000", max: "50000" },
  { label: "50k – 100k", min: "50000", max: "100000" },
  { label: "100k – 250k", min: "100000", max: "250000" },
  { label: "250k+", min: "250000", max: "" },
];

// Normalized price distribution buckets for visual density histogram
const HISTOGRAM_BUCKETS = [
  { ratio: 0.03, count: 4 },   // 0 - 30k
  { ratio: 0.08, count: 9 },   // 30k - 60k
  { ratio: 0.15, count: 18 },  // 60k - 100k
  { ratio: 0.25, count: 24 },  // 100k - 180k
  { ratio: 0.40, count: 16 },  // 180k - 300k
  { ratio: 0.60, count: 11 },  // 300k - 500k
  { ratio: 0.80, count: 7 },   // 500k - 750k
  { ratio: 1.00, count: 5 },   // 750k - 1M
];

export function PriceRangeFilter({
  action,
  locale,
  currentMin = "",
  currentMax = "",
  minLimit = 0,
  maxLimit = 1000000,
  step = 5000,
  compact = false,
  showHistogram = true,
  embeddedInForm = false,
}: PriceRangeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const minSliderId = useId();
  const maxSliderId = useId();

  const parsedMin = currentMin ? Math.max(minLimit, Number(currentMin) || minLimit) : minLimit;
  const parsedMax = currentMax ? Math.min(maxLimit, Number(currentMax) || maxLimit) : maxLimit;

  // Local state for user edits before applying
  const [userMin, setUserMin] = useState<number | null>(null);
  const [userMax, setUserMax] = useState<number | null>(null);
  const [prevPropMin, setPrevPropMin] = useState(currentMin);
  const [prevPropMax, setPrevPropMax] = useState(currentMax);

  // Sync state if URL prop changes without cascading effect renders
  if (prevPropMin !== currentMin) {
    setPrevPropMin(currentMin);
    setUserMin(null);
  }
  if (prevPropMax !== currentMax) {
    setPrevPropMax(currentMax);
    setUserMax(null);
  }

  const minVal = userMin !== null ? userMin : parsedMin;
  const maxVal = userMax !== null ? userMax : parsedMax;

  const minPercent = Math.min(100, Math.max(0, ((minVal - minLimit) / (maxLimit - minLimit)) * 100));
  const maxPercent = Math.min(100, Math.max(0, ((maxVal - minLimit) / (maxLimit - minLimit)) * 100));

  const hasActiveFilter = Boolean(currentMin || currentMax);
  const isDirty =
    (currentMin || "") !== (minVal > minLimit ? String(minVal) : "") ||
    (currentMax || "") !== (maxVal < maxLimit ? String(maxVal) : "");

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), maxVal - step);
    setUserMin(val);
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), minVal + step);
    setUserMax(val);
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setUserMin(minLimit);
      return;
    }
    const val = Number(raw);
    if (!Number.isNaN(val)) {
      setUserMin(Math.max(minLimit, Math.min(val, maxVal - step)));
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "") {
      setUserMax(maxLimit);
      return;
    }
    const val = Number(raw);
    if (!Number.isNaN(val)) {
      setUserMax(Math.min(maxLimit, Math.max(val, minVal + step)));
    }
  };

  const applyRange = (newMin?: number, newMax?: number) => {
    const m = newMin !== undefined ? newMin : minVal;
    const M = newMax !== undefined ? newMax : maxVal;

    const params = new URLSearchParams(searchParams?.toString() || "");

    if (m > minLimit) {
      params.set("min", String(m));
    } else {
      params.delete("min");
    }

    if (M < maxLimit) {
      params.set("max", String(M));
    } else {
      params.delete("max");
    }

    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action);
  };

  const applyPreset = (presetMin: string, presetMax: string) => {
    const pMin = presetMin ? Number(presetMin) : minLimit;
    const pMax = presetMax ? Number(presetMax) : maxLimit;

    setUserMin(pMin);
    setUserMax(pMax);
    applyRange(pMin, pMax);
  };

  const resetPrice = () => {
    setUserMin(null);
    setUserMax(null);

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("min");
    params.delete("max");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${action}?${qs}` : action);
  };

  const maxHistCount = Math.max(...HISTOGRAM_BUCKETS.map((b) => b.count));

  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xs backdrop-blur-md ${
        compact ? "p-3" : "p-4 sm:p-5"
      }`}
    >
      {/* Header and status */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={14} className="text-slate-700" aria-hidden />
          <h3 className="text-xs font-bold text-slate-900">
            {locale === "sw" ? "Kiwango cha Bei" : "Price Range"}
          </h3>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetPrice}
            className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 transition-colors"
          >
            <RotateCcw size={11} aria-hidden />
            <span>{locale === "sw" ? "Weka upya" : "Reset"}</span>
          </button>
        )}
      </div>

      {/* Visual Density Histogram */}
      {showHistogram && (
        <div className="mt-4 mb-2">
          <div className="flex h-10 items-end justify-between gap-1 px-1">
            {HISTOGRAM_BUCKETS.map((bucket, idx) => {
              const bucketMinRatio = idx === 0 ? 0 : HISTOGRAM_BUCKETS[idx - 1].ratio;
              const bucketMaxRatio = bucket.ratio;
              const bucketMinVal = minLimit + bucketMinRatio * (maxLimit - minLimit);
              const bucketMaxVal = minLimit + bucketMaxRatio * (maxLimit - minLimit);

              // Check if bucket overlaps the active selection
              const inRange = bucketMaxVal >= minVal && bucketMinVal <= maxVal;
              const heightPercent = Math.max(15, (bucket.count / maxHistCount) * 100);

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full"
                  title={`${bucket.count} products (${formatTZS(bucketMinVal)} - ${formatTZS(bucketMaxVal)})`}
                >
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      inRange
                        ? "bg-slate-900 opacity-90 group-hover:opacity-100"
                        : "bg-slate-200/90 opacity-40"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dual Slider Track */}
      <div className="relative mt-2 mb-5 px-1">
        {/* Background track */}
        <div className="relative h-2 w-full rounded-full bg-slate-100">
          {/* Active highlighted range bar */}
          <div
            className="absolute h-2 rounded-full bg-slate-900 transition-all duration-75"
            style={{
              left: `${minPercent}%`,
              width: `${Math.max(0, maxPercent - minPercent)}%`,
            }}
          />
        </div>

        {/* Min Thumb Input */}
        <input
          id={minSliderId}
          type="range"
          min={minLimit}
          max={maxLimit}
          step={step}
          value={minVal}
          onChange={handleMinSliderChange}
          aria-label={locale === "sw" ? "Bei ya Chini" : "Minimum Price"}
          className="pointer-events-none absolute -top-1 left-0 z-20 h-4 w-full appearance-none bg-transparent focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
        />

        {/* Max Thumb Input */}
        <input
          id={maxSliderId}
          type="range"
          min={minLimit}
          max={maxLimit}
          step={step}
          value={maxVal}
          onChange={handleMaxSliderChange}
          aria-label={locale === "sw" ? "Bei ya Juu" : "Maximum Price"}
          className="pointer-events-none absolute -top-1 left-0 z-20 h-4 w-full appearance-none bg-transparent focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-slate-900 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-slate-900 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md"
        />
      </div>

      {/* Numeric Min & Max Input Controls */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div>
          <label
            htmlFor={`min-input-${minSliderId}`}
            className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
          >
            {locale === "sw" ? "Kiwango cha Chini" : "Min Price"}
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              TSh
            </span>
            <input
              id={`min-input-${minSliderId}`}
              type="number"
              min={minLimit}
              max={maxLimit}
              step={step}
              value={minVal > minLimit ? minVal : ""}
              placeholder="0"
              onChange={handleMinInputChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-2 text-xs font-semibold tabular-nums text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
            />
          </div>
        </div>

        <span className="self-end pb-2 text-slate-400 font-bold text-xs" aria-hidden>
          –
        </span>

        <div>
          <label
            htmlFor={`max-input-${maxSliderId}`}
            className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1"
          >
            {locale === "sw" ? "Kiwango cha Juu" : "Max Price"}
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              TSh
            </span>
            <input
              id={`max-input-${maxSliderId}`}
              type="number"
              min={minLimit}
              max={maxLimit}
              step={step}
              value={maxVal < maxLimit ? maxVal : ""}
              placeholder="1,000,000"
              onChange={handleMaxInputChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-1.5 pl-9 pr-2 text-xs font-semibold tabular-nums text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Hidden inputs if embedded inside a <form> */}
      {embeddedInForm && (
        <>
          <input
            type="hidden"
            name="min"
            value={minVal > minLimit ? String(minVal) : ""}
          />
          <input
            type="hidden"
            name="max"
            value={maxVal < maxLimit ? String(maxVal) : ""}
          />
        </>
      )}

      {/* Preset Quick Range Chips */}
      <div className="mt-3">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          {locale === "sw" ? "Viwango vya Haraka" : "Quick Presets"}
        </span>
        <div className="flex flex-wrap gap-1">
          {PRICE_PRESETS.map((preset) => {
            const isMatch =
              (preset.min ? Number(preset.min) : minLimit) === minVal &&
              (preset.max ? Number(preset.max) : maxLimit) === maxVal;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.min, preset.max)}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                  isMatch
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apply Button */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-500 truncate">
          <span className="font-semibold text-slate-800">
            {minVal > minLimit ? formatTZS(minVal) : "TSh 0"}
          </span>
          {" – "}
          <span className="font-semibold text-slate-800">
            {maxVal < maxLimit ? formatTZS(maxVal) : "1M+ TSh"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => applyRange()}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
            isDirty
              ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          <span>{locale === "sw" ? "Tumia" : "Apply"}</span>
          <ArrowRight size={12} aria-hidden />
        </button>
      </div>
    </div>
  );
}
