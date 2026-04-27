"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icons";
import type { Metric } from "@/lib/mock-data";

type MetricSelectorProps = {
  metrics: Metric[];
  selectedMetricId: Metric["id"];
  onMetricChange: (metricId: Metric["id"]) => void;
};

const ICON_BY_METRIC: Record<Metric["id"], "users" | "compass" | "sparkles" | "film"> = {
  pearson: "users",
  cosine: "compass",
  euclidean: "sparkles",
  manhattan: "film",
};

export function MetricSelector({
  metrics,
  selectedMetricId,
  onMetricChange,
}: MetricSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const current = metrics.find((metric) => metric.id === selectedMetricId) ?? metrics[0];

  return (
    <div ref={ref} className="relative min-w-[320px] max-w-[420px] flex-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-[var(--surface)] px-4 py-3 text-left transition hover:border-white/20 hover:bg-[var(--surface-2)] data-[open=true]:shadow-[0_0_0_3px_color-mix(in_oklch,var(--accent)_15%,transparent)]"
        data-open={open}
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:color-mix(in_oklch,var(--accent)_12%,transparent)] text-[var(--accent)]">
          <Icon name={ICON_BY_METRIC[current.id]} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block font-[family:var(--font-mono)] text-[10px] tracking-[0.16em] text-[var(--muted)]">
            MÉTRICA ACTIVA
          </span>
          <span className="block truncate text-sm font-medium text-[var(--fg)]">{current.name}</span>
        </span>

        <span className={`text-[var(--muted)] transition ${open ? "rotate-180" : ""}`}>
          <Icon name="chevron" />
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-full rounded-2xl border border-white/10 bg-[var(--surface)] p-2 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.6)]">
          <div className="px-3 pb-2 pt-3 font-[family:var(--font-mono)] text-[10px] tracking-[0.16em] text-[var(--muted-2)]">
            CAMBIAR MÉTRICA
          </div>

          {metrics.map((metric) => {
            const active = metric.id === selectedMetricId;

            return (
              <button
                key={metric.id}
                type="button"
                onClick={() => {
                  onMetricChange(metric.id);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${
                  active
                    ? "bg-[color:color-mix(in_oklch,var(--accent)_10%,var(--surface))]"
                    : "hover:bg-[var(--surface-2)]"
                }`}
              >
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    active
                      ? "bg-[color:color-mix(in_oklch,var(--accent)_25%,transparent)] text-[var(--accent)]"
                      : "bg-[var(--surface-2)] text-[var(--fg-dim)]"
                  }`}
                >
                  <Icon name={ICON_BY_METRIC[metric.id]} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-[var(--fg)]">{metric.name}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--muted)]">
                    {metric.description}
                  </span>
                </span>
                {active ? (
                  <span className="mt-1 text-[var(--accent)]">
                    <Icon name="check" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
