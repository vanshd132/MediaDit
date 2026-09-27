"use client";

import { useState } from "react";
import ToolCard from "./ToolCard";
import { useLanguage } from "@/components/LanguageContext";
import { FileText, ArrowRight } from "lucide-react";

export default function ToolsCatalog() {
  const [activeTab, setActiveTab] = useState<"all" | "bg" | "edit" | "format">("all");
  const { t } = useLanguage();

  const tools = [
    {
      title: t.cardRemoveBgTitle,
      description: t.cardRemoveBgDesc,
      href: "/remove-background",
      icon: "sparkles" as const,
      badge: "AI",
      badgeType: "ai" as const,
      colorTheme: "indigo" as const,
    },
    {
      title: t.cardAddTextTitle,
      description: t.cardAddTextDesc,
      href: "/add-text",
      icon: "type" as const,
      badge: t.addText,
      badgeType: "new" as const,
      colorTheme: "cyan" as const,
    },
    {
      title: "Edit Text in Image",
      description:
        "Change words that are already inside a photo or screenshot. The background is rebuilt and the font is matched, so it doesn't look edited.",
      href: "/edit-text",
      icon: "textCursor" as const,
      badge: "Beta",
      badgeType: "ai" as const,
      colorTheme: "rose" as const,
    },
    {
      title: t.cardConvertTitle,
      description: t.cardConvertDesc,
      href: "/convert",
      icon: "refresh" as const,
      badge: "Offline",
      badgeType: "offline" as const,
      colorTheme: "emerald" as const,
    },
    {
      title: t.cardResizeTitle,
      description: t.cardResizeDesc,
      href: "/resize",
      icon: "crop" as const,
      badge: "Offline",
      badgeType: "offline" as const,
      colorTheme: "amber" as const,
    },
    {
      title: t.cardCompressTitle,
      description: t.cardCompressDesc,
      href: "/compress",
      icon: "percent" as const,
      badge: "Size",
      badgeType: "new" as const,
      colorTheme: "emerald" as const,
    },
  ];

  const tabs = [
    { id: "all" as const, label: t.allTools },
    { id: "bg" as const, label: t.removeBg },
    { id: "edit" as const, label: t.addText },
    { id: "format" as const, label: t.resize },
  ];

  const filteredTools = tools.filter((tool) => {
    if (activeTab === "all") return true;
    if (activeTab === "bg") return tool.colorTheme === "indigo";
    if (activeTab === "edit") return tool.colorTheme === "cyan" || tool.colorTheme === "rose";
    if (activeTab === "format") return tool.colorTheme === "emerald" || tool.colorTheme === "amber";
    return true;
  });

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto">
      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-sm"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-slate-400 dark:hover:bg-zinc-850 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {filteredTools.map((tool) => (
          <ToolCard
            key={tool.href}
            title={tool.title}
            description={tool.description}
            href={tool.href}
            icon={tool.icon}
            badge={tool.badge}
            badgeType={tool.badgeType}
            colorTheme={tool.colorTheme}
          />
        ))}
      </div>

      {/* PDF MediaDit cross-promo */}
      <a
        href="https://pdf.mediadit.com?ref=mediadit"
        rel="noopener"
        className="group flex flex-col sm:flex-row items-center gap-5 w-full max-w-4xl mx-auto p-6 sm:p-8 rounded-2xl bg-card border border-slate-200 dark:border-zinc-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/30 hover:shadow-md transition-all duration-200"
      >
        <div className="shrink-0 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm group-hover:scale-105 transition-transform duration-200">
          <FileText className="h-7 w-7" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            Need to edit text in a PDF?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fix typos, update dates, and rewrite text inside any PDF — free, private, and right in your browser. Head over to{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">PDF MediaDit</span>.
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2.5 transition-all">
          Go to PDF MediaDit
          <ArrowRight className="h-4 w-4" />
        </span>
      </a>
    </div>
  );
}
