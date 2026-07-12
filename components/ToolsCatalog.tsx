"use client";

import { useState } from "react";
import ToolCard from "./ToolCard";

export default function ToolsCatalog() {
  const [activeTab, setActiveTab] = useState<"all" | "bg" | "edit" | "format">("all");

  const tools = [
    {
      title: "Remove Background",
      description: "Remove image backgrounds instantly in your browser using local AI. No server uploads, 100% private.",
      href: "/remove-background",
      icon: "sparkles" as const,
      badge: "AI Powered",
      badgeType: "ai" as const,
      colorTheme: "indigo" as const,
    },
    {
      title: "Add Text to Image",
      description: "Place, style, and drag custom text overlays onto your images. Edit font sizes, families, and colors.",
      href: "/add-text",
      icon: "type" as const,
      badge: "Draggable",
      badgeType: "new" as const,
      colorTheme: "cyan" as const,
    },
    {
      title: "Convert Format",
      description: "Convert image files between PNG, JPEG, WEBP, and BMP instantly. Control output quality and scale.",
      href: "/convert",
      icon: "refresh" as const,
      badge: "Offline",
      badgeType: "offline" as const,
      colorTheme: "emerald" as const,
    },
    {
      title: "Resize & Crop",
      description: "Crop to exact aspect ratios and resize dimensions without losing image clarity. Powered by Canvas.",
      href: "/resize",
      icon: "crop" as const,
      badge: "Offline",
      badgeType: "offline" as const,
      colorTheme: "amber" as const,
    },
    {
      title: "Compress Image",
      description: "Reduce image file sizes instantly without losing visible quality. 100% free, private, and offline.",
      href: "/compress",
      icon: "percent" as const,
      badge: "Size Reducer",
      badgeType: "new" as const,
      colorTheme: "emerald" as const,
    },
  ];

  const tabs = [
    { id: "all" as const, label: "All Tools" },
    { id: "bg" as const, label: "Background Removal" },
    { id: "edit" as const, label: "Edit & Annotate" },
    { id: "format" as const, label: "Format & Size" },
  ];

  const filteredTools = tools.filter((tool) => {
    if (activeTab === "all") return true;
    if (activeTab === "bg") return tool.colorTheme === "indigo";
    if (activeTab === "edit") return tool.colorTheme === "cyan";
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
    </div>
  );
}
