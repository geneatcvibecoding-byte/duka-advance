"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Headphones,
  Laptop,
  Layers,
  Layout,
  Loader2,
  Maximize2,
  Megaphone,
  Minimize2,
  Monitor,
  Package,
  Palette,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tablet,
  Tag,
  Truck,
  User,
  Wallet,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  saveSiteContentAction,
  resetSiteContentAction,
} from "@/app/actions/site-content";
import { DEFAULT_SITE_CONTENT, type SiteContentConfig } from "@/lib/site-content-types";

type CustomizerTab = "hero" | "announcement" | "deals" | "features" | "campus" | "presets";

export function InteractiveSiteCustomizer({
  initialConfig,
}: {
  initialConfig: SiteContentConfig;
  locale?: string;
}) {
  const [config, setConfig] = useState<SiteContentConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<CustomizerTab>("hero");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewLang, setPreviewLang] = useState<"en" | "sw">("en");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fullscreenPreview, setFullscreenPreview] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const handleSave = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await saveSiteContentAction(config);
      if (res.ok) {
        setFeedback({ type: "success", text: res.message || "Site content updated live!" });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to save changes." });
      }
    });
  };

  const handleReset = () => {
    if (!window.confirm("Are you sure you want to reset all site content to original defaults?")) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const res = await resetSiteContentAction();
      if (res.ok) {
        setConfig(DEFAULT_SITE_CONTENT);
        setFeedback({ type: "success", text: "Reset to default layout and text." });
      } else {
        setFeedback({ type: "error", text: res.error || "Reset failed." });
      }
    });
  };

  // Preset theme styles
  const applyPreset = (theme: "obsidian-glass" | "minimal-slate" | "warm-editorial") => {
    setConfig((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        bgStyle: theme,
      },
    }));
    setFeedback({ type: "success", text: `Applied theme preset: ${theme}` });
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Save Dock */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Layers size={18} aria-hidden />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Interactive Site Customizer
            </h1>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">
              Real-time Live Preview
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Edit headlines, announcement messages, deals, and campus sections with instantaneous side-by-side preview.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} aria-hidden />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <Save size={14} aria-hidden />
            )}
            <span>Publish Live Changes</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium ${
            feedback.type === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-red-200 bg-red-50 text-red-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-red-700 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Main 2-Column Split: Controls on Left + Live Preview on Right */}
      <div
        className={`grid gap-6 ${
          fullscreenPreview ? "grid-cols-1" : "xl:grid-cols-[26rem_1fr]"
        }`}
      >
        {/* Left Controls (Hidden if fullscreen preview is active) */}
        {!fullscreenPreview && (
          <div className="space-y-4">
            {/* Section Tabs */}
            <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xs">
              {[
                { id: "hero", label: "Hero", icon: Layout },
                { id: "announcement", label: "Banner", icon: Megaphone },
                { id: "deals", label: "Super Deals", icon: Tag },
                { id: "features", label: "Why Us", icon: Shield },
                { id: "campus", label: "Campus Hub", icon: GraduationCap },
                { id: "presets", label: "Themes", icon: Palette },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as CustomizerTab)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={13} aria-hidden />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB: HERO SECTION */}
            {activeTab === "hero" && (
              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Hero Section Messaging</h3>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Live Updating
                  </span>
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Badge Text (English)
                  </label>
                  <input
                    type="text"
                    value={config.hero.badgeEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, badgeEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Badge Text (Swahili)
                  </label>
                  <input
                    type="text"
                    value={config.hero.badgeSw}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, badgeSw: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Main Headline (English)
                  </label>
                  <input
                    type="text"
                    value={config.hero.headlineEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, headlineEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Main Headline (Swahili)
                  </label>
                  <input
                    type="text"
                    value={config.hero.headlineSw}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, headlineSw: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Subtitle Description (English)
                  </label>
                  <textarea
                    rows={2}
                    value={config.hero.subtitleEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, subtitleEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Subtitle Description (Swahili)
                  </label>
                  <textarea
                    rows={2}
                    value={config.hero.subtitleSw}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, subtitleSw: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label text-xs font-semibold text-slate-800">
                      Primary CTA (English)
                    </label>
                    <input
                      type="text"
                      value={config.hero.primaryCtaEn}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, primaryCtaEn: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="field-label text-xs font-semibold text-slate-800">
                      Secondary CTA (English)
                    </label>
                    <input
                      type="text"
                      value={config.hero.secondaryCtaEn}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, secondaryCtaEn: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ANNOUNCEMENT BANNER */}
            {activeTab === "announcement" && (
              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Top Announcement Banner</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.announcement.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          announcement: { ...prev.announcement, enabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900" />
                  </label>
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Badge Text (e.g. SUPER DEAL)
                  </label>
                  <input
                    type="text"
                    value={config.announcement.badgeEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, badgeEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Announcement Text (English)
                  </label>
                  <input
                    type="text"
                    value={config.announcement.textEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, textEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Announcement Text (Swahili)
                  </label>
                  <input
                    type="text"
                    value={config.announcement.textSw}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, textSw: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Destination URL Link
                  </label>
                  <input
                    type="text"
                    value={config.announcement.link}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        announcement: { ...prev.announcement, link: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {/* TAB: SUPER DEALS */}
            {activeTab === "deals" && (
              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Campus Super Deals Row</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.superDeals.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          superDeals: { ...prev.superDeals, enabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900" />
                  </label>
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Super Deals Title (English)
                  </label>
                  <input
                    type="text"
                    value={config.superDeals.titleEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        superDeals: { ...prev.superDeals, titleEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Subtitle (English)
                  </label>
                  <input
                    type="text"
                    value={config.superDeals.subtitleEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        superDeals: { ...prev.superDeals, subtitleEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label text-xs font-semibold text-slate-800">
                      Badge Label
                    </label>
                    <input
                      type="text"
                      value={config.superDeals.badgeEn}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          superDeals: { ...prev.superDeals, badgeEn: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="field-label text-xs font-semibold text-slate-800">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      value={config.superDeals.ctaEn}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          superDeals: { ...prev.superDeals, ctaEn: e.target.value },
                        }))
                      }
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CAMPUS HUB */}
            {activeTab === "campus" && (
              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Student Campus Hub</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.campusMarketplace.enabled}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          campusMarketplace: { ...prev.campusMarketplace, enabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900" />
                  </label>
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Headline (English)
                  </label>
                  <input
                    type="text"
                    value={config.campusMarketplace.headlineEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        campusMarketplace: { ...prev.campusMarketplace, headlineEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Body Description
                  </label>
                  <textarea
                    rows={2}
                    value={config.campusMarketplace.bodyEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        campusMarketplace: { ...prev.campusMarketplace, bodyEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="field-label text-xs font-semibold text-slate-800">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={config.campusMarketplace.badgeEn}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        campusMarketplace: { ...prev.campusMarketplace, badgeEn: e.target.value },
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {/* TAB: VALUE PROPOSITIONS (WHY US) */}
            {activeTab === "features" && (
              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Why Us / Trust Pillars (4 Cards)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifying titles or descriptions updates the live cards immediately.
                  </p>
                </div>

                <div className="space-y-3">
                  {config.features.map((feat, index) => (
                    <div key={feat.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Pillar #{index + 1} ({feat.icon})
                        </span>
                      </div>
                      <input
                        type="text"
                        value={feat.titleEn}
                        onChange={(e) => {
                          const updated = [...config.features];
                          updated[index] = { ...updated[index], titleEn: e.target.value };
                          setConfig((prev) => ({ ...prev, features: updated }));
                        }}
                        placeholder="Feature Title"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                      <textarea
                        rows={2}
                        value={feat.bodyEn}
                        onChange={(e) => {
                          const updated = [...config.features];
                          updated[index] = { ...updated[index], bodyEn: e.target.value };
                          setConfig((prev) => ({ ...prev, features: updated }));
                        }}
                        placeholder="Feature Description"
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: THEME PRESETS */}
            {activeTab === "presets" && (
              <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div className="border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-900">Theme Presets</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Switch overall hero palette with 1-click.</p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    type="button"
                    onClick={() => applyPreset("obsidian-glass")}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      config.hero.bgStyle === "obsidian-glass"
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-900"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Midnight Obsidian & Frosted Glass</p>
                      <p className={`text-[11px] mt-0.5 ${config.hero.bgStyle === "obsidian-glass" ? "text-slate-300" : "text-slate-500"}`}>
                        Deep obsidian backdrop, architectural photography, crisp amber typography.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("minimal-slate")}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      config.hero.bgStyle === "minimal-slate"
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-900"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Clean Minimalist Slate</p>
                      <p className={`text-[11px] mt-0.5 ${config.hero.bgStyle === "minimal-slate" ? "text-slate-300" : "text-slate-500"}`}>
                        Light high-contrast slate, black typography, quiet luxury e-commerce.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset("warm-editorial")}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                      config.hero.bgStyle === "warm-editorial"
                        ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-900"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold">Warm Campus Editorial</p>
                      <p className={`text-[11px] mt-0.5 ${config.hero.bgStyle === "warm-editorial" ? "text-slate-300" : "text-slate-500"}`}>
                        Warm stone parchment tones with high-contrast text and academic focus.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RIGHT LIVE PREVIEW PANE (REAL-TIME REFLECTION) */}
        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
          {/* Live Preview Toolbar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/90 px-4 py-2.5 gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye size={14} className="text-slate-700" />
                Live Preview Pane
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                Instant Reactivity Active
              </span>
            </div>

            {/* Viewport, Language, Zoom & Fullscreen Controls */}
            <div className="flex items-center gap-2">
              {/* Device Selector */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`rounded p-1 transition-colors ${
                    previewDevice === "desktop"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Desktop (1200px)"
                >
                  <Monitor size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("tablet")}
                  className={`rounded p-1 transition-colors ${
                    previewDevice === "tablet"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Tablet (768px)"
                >
                  <Tablet size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`rounded p-1 transition-colors ${
                    previewDevice === "mobile"
                      ? "bg-slate-900 text-white"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Mobile (375px)"
                >
                  <Smartphone size={14} />
                </button>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewLang("en")}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    previewLang === "en" ? "bg-slate-900 text-white" : "text-slate-600"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang("sw")}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    previewLang === "sw" ? "bg-slate-900 text-white" : "text-slate-600"
                  }`}
                >
                  SW
                </button>
              </div>

              {/* Zoom Controls */}
              <div className="hidden sm:flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs text-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(75, z - 10))}
                  className="p-1 hover:text-slate-950"
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span className="px-1 font-mono text-[11px]">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(100, z + 10))}
                  className="p-1 hover:text-slate-950"
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
              </div>

              {/* Toggle Fullscreen / Split */}
              <button
                type="button"
                onClick={() => setFullscreenPreview((f) => !f)}
                className="hidden md:grid h-7 w-7 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                title={fullscreenPreview ? "Exit Fullscreen" : "Maximize Preview"}
              >
                {fullscreenPreview ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="flex-1 bg-slate-100/70 p-4 sm:p-6 overflow-y-auto max-h-[880px]">
            <div
              style={{
                transform: zoomLevel < 100 ? `scale(${zoomLevel / 100})` : undefined,
                transformOrigin: "top center",
              }}
              className={`mx-auto transition-all duration-300 ${
                previewDevice === "mobile"
                  ? "max-w-sm rounded-[2.5rem] border-8 border-slate-900 shadow-2xl overflow-hidden bg-white"
                  : previewDevice === "tablet"
                    ? "max-w-2xl rounded-2xl border-4 border-slate-800 shadow-xl overflow-hidden bg-white"
                    : "w-full rounded-xl border border-slate-200 shadow-sm bg-white overflow-hidden"
              }`}
            >
              {/* 1. Simulated Top Announcement Bar */}
              {config.announcement.enabled && (
                <div className="bg-slate-900 px-3 py-2 text-center text-xs text-white border-b border-slate-800">
                  <div className="flex items-center justify-center gap-2">
                    <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-black text-slate-950">
                      {config.announcement.badgeEn}
                    </span>
                    <span className="truncate text-slate-200 text-xs">
                      {previewLang === "en" ? config.announcement.textEn : config.announcement.textSw}
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Simulated Header Navigation */}
              <div className="flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                    D
                  </span>
                  <span className="font-bold text-slate-900 text-sm">Duka Campus</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 w-48 rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-400">
                  <Search size={12} />
                  <span>Search essentials...</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-700">
                  <span className="font-semibold text-emerald-700">Escrow Safe</span>
                  <Package size={15} />
                </div>
              </div>

              {/* 3. Simulated Hero Section */}
              <section
                className={`relative overflow-hidden p-6 sm:p-10 ${
                  config.hero.bgStyle === "minimal-slate"
                    ? "bg-slate-100 text-slate-900"
                    : config.hero.bgStyle === "warm-editorial"
                      ? "bg-stone-100 text-stone-900"
                      : "bg-slate-950 text-white"
                }`}
              >
                <div className="grid gap-6 lg:grid-cols-[1fr_260px] lg:items-center relative z-10">
                  <div className="space-y-4 max-w-xl">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
                      <Sparkles size={12} aria-hidden />
                      {previewLang === "en" ? config.hero.badgeEn : config.hero.badgeSw}
                    </span>

                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                      {previewLang === "en" ? config.hero.headlineEn : config.hero.headlineSw}
                    </h2>

                    <p className={`text-xs sm:text-sm leading-relaxed ${config.hero.bgStyle === "minimal-slate" ? "text-slate-600" : "text-slate-300"}`}>
                      {previewLang === "en" ? config.hero.subtitleEn : config.hero.subtitleSw}
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <span className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm flex items-center gap-1.5">
                        {previewLang === "en" ? config.hero.primaryCtaEn : config.hero.primaryCtaSw}
                        <ArrowRight size={13} />
                      </span>
                      <span className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white">
                        {previewLang === "en" ? config.hero.secondaryCtaEn : config.hero.secondaryCtaSw}
                      </span>
                    </div>
                  </div>

                  {/* Right Side User & Protection Portal Simulation */}
                  <div className="space-y-2.5">
                    <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-md text-white">
                      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                        <User size={15} className="text-amber-400" />
                        <span className="text-xs font-bold">Welcome to Duka Campus</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                        <span className="rounded bg-amber-400 py-1 text-center font-bold text-slate-950">
                          Sign In
                        </span>
                        <span className="rounded border border-white/20 py-1 text-center font-semibold text-white">
                          Join Free
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-slate-900/80 p-3 text-white">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                        <ShieldCheck size={13} />
                        <span>Buyer Protection Guarantee</span>
                      </div>
                      <p className="mt-1 text-[10px] text-slate-300 leading-snug">
                        100% money-back escrow until you confirm delivery on campus.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. Simulated Campus Super Deals Row */}
              {config.superDeals.enabled && (
                <div className="m-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          {config.superDeals.badgeEn}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {previewLang === "en" ? config.superDeals.titleEn : config.superDeals.titleSw}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {previewLang === "en" ? config.superDeals.subtitleEn : config.superDeals.subtitleSw}
                      </p>
                    </div>
                    <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shrink-0">
                      {previewLang === "en" ? config.superDeals.ctaEn : config.superDeals.ctaSw}
                    </span>
                  </div>

                  {/* Sample Deal Cards */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { name: "Casio FX-991ES Plus", price: "TSh 40,000", discount: "-20%" },
                      { name: "Fast Charger 33W USB-C", price: "TSh 28,000", discount: "-15%" },
                      { name: "Hostel Study Lamp LED", price: "TSh 22,000", discount: "-30%" },
                      { name: "Power Bank 20,000mAh", price: "TSh 55,000", discount: "-25%" },
                    ].map((item, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-2.5 text-left">
                        <span className="rounded bg-amber-500 px-1 py-0.2 text-[9px] font-bold text-slate-950">
                          {item.discount}
                        </span>
                        <p className="mt-1 font-semibold text-xs text-slate-900 truncate">{item.name}</p>
                        <p className="font-bold text-xs text-slate-900 mt-1">{item.price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Simulated Featured Student Listings Section */}
              <div className="m-4 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <GraduationCap size={15} className="text-slate-900" />
                      <h4 className="text-sm font-bold text-slate-900">
                        {previewLang === "en" ? "Featured Student Listings" : "Bidhaa Maalum za Wanafunzi"}
                      </h4>
                      <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 text-[10px] font-bold">
                        Verified
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {previewLang === "en"
                        ? "Peer-to-peer campus items with institutional email verification."
                        : "Vifaa vya wanafunzi vilivyohakikiwa kwa barua pepe ya chuo."}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">View All →</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { title: "Casio Calculator", campus: "UDSM", price: "TSh 40,000" },
                    { title: "Economics 8th Ed", campus: "UDSM", price: "TSh 30,000" },
                    { title: "HP Core i5 Laptop", campus: "MUST", price: "TSh 490,000" },
                    { title: "Rotring Drawing Set", campus: "ATC", price: "TSh 55,000" },
                  ].map((l, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-left">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                        <span className="font-semibold text-slate-700">{l.campus}</span>
                        <span className="text-emerald-700 font-bold">Escrow</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 truncate">{l.title}</p>
                      <p className="text-xs font-bold text-slate-900 mt-1">{l.price}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Simulated Value Propositions */}
              <div className="m-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {config.features.map((feat) => (
                  <div
                    key={feat.id}
                    className="rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-2xs"
                  >
                    <div className="mb-2 grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-800">
                      {feat.icon === "shield" && <ShieldCheck size={14} />}
                      {feat.icon === "truck" && <Truck size={14} />}
                      {feat.icon === "wallet" && <Wallet size={14} />}
                      {feat.icon === "headphones" && <Headphones size={14} />}
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {previewLang === "en" ? feat.titleEn : feat.titleSw}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {previewLang === "en" ? feat.bodyEn : feat.bodySw}
                    </p>
                  </div>
                ))}
              </div>

              {/* 7. Simulated Campus Marketplace Section */}
              {config.campusMarketplace.enabled && (
                <div className="m-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-700">
                    <GraduationCap size={15} className="text-slate-900" />
                    <span>{config.campusMarketplace.badgeEn}</span>
                  </div>
                  <h4 className="mt-1 text-sm sm:text-base font-bold text-slate-900">
                    {previewLang === "en"
                      ? config.campusMarketplace.headlineEn
                      : config.campusMarketplace.headlineSw}
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    {previewLang === "en"
                      ? config.campusMarketplace.bodyEn
                      : config.campusMarketplace.bodySw}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
