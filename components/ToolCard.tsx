"use client";

import Link from "next/link";
import { Sparkles, Type, RefreshCw, Crop, Percent, TextCursorInput } from "lucide-react";

const iconMap = {
  sparkles: Sparkles,
  type: Type,
  refresh: RefreshCw,
  crop: Crop,
  percent: Percent,
  textCursor: TextCursorInput,
};

interface ToolCardProps {
  title: string;
  description: string;
  href: string;
  icon: keyof typeof iconMap;
  badge?: string;
  badgeType?: "ai" | "new" | "offline";
  colorTheme?: "indigo" | "cyan" | "emerald" | "amber" | "rose";
}

export default function ToolCard({
  title,
  description,
  href,
  icon,
  badge,
  badgeType = "offline",
  colorTheme = "indigo",
}: ToolCardProps) {
  const Icon = iconMap[icon] || Sparkles;

  const badgeClasses = {
    ai: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    new: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    offline: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700",
  };

  // Color mapping based on tool types (solid app tile background style)
  const themeClasses = {
    indigo: {
      tileBg: "bg-indigo-600 text-white",
      hoverBorder: "group-hover:border-indigo-500/50 dark:group-hover:border-indigo-500/30",
    },
    cyan: {
      tileBg: "bg-cyan-500 text-white",
      hoverBorder: "group-hover:border-cyan-500/50 dark:group-hover:border-cyan-500/30",
    },
    emerald: {
      tileBg: "bg-emerald-500 text-white",
      hoverBorder: "group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/30",
    },
    amber: {
      tileBg: "bg-amber-500 text-white",
      hoverBorder: "group-hover:border-amber-500/50 dark:group-hover:border-amber-500/30",
    },
    rose: {
      tileBg: "bg-rose-500 text-white",
      hoverBorder: "group-hover:border-rose-500/50 dark:group-hover:border-rose-500/30",
    },
  };

  const currentTheme = themeClasses[colorTheme] || themeClasses.indigo;

  return (
    <Link 
      href={href} 
      className={`group relative flex flex-col justify-start p-7 rounded-2xl bg-card border border-slate-200 dark:border-zinc-800/80 ${currentTheme.hoverBorder} hover:shadow-md transition-all duration-200 cursor-pointer`}
    >
      {/* Icon Tile */}
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-sm mb-4 transition-transform group-hover:scale-105 duration-200 ${currentTheme.tileBg}`}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Content */}
      <div className="space-y-1.5 text-left">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>
          {badge && (
            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${badgeClasses[badgeType]} shrink-0`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
