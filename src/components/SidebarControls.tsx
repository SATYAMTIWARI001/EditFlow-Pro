import React, { useState } from "react";
import { CertificateTemplate, CertificateField, FieldStyle, FontWeight } from "../types";
import { removeSignatureBackground } from "../lib/canvasUtils";
import {
  Type,
  Sparkles,
  QrCode,
  PenTool,
  Layers,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check
} from "lucide-react";

interface SidebarControlsProps {
  template: CertificateTemplate;
  activeFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFieldStyle: (fieldId: string, style: Partial<FieldStyle>) => void;
  onUpdateFieldProps?: (fieldId: string, props: Partial<CertificateField>) => void;
  onAddField: (placeholderName: string) => void;
  onDeleteField: (id: string) => void;
  onUpdateQrCode: (config: Partial<CertificateTemplate["qrCode"]>) => void;
  onUpdateSignature: (config: Partial<CertificateTemplate["signature"]>) => void;
  onUpdateWatermark: (config: Partial<CertificateTemplate["watermark"]>) => void;
  onTriggerAiScan: () => void;
  aiScanning: boolean;
  aiFeedback: string;
  onUpdateTemplateLayout?: (layout: Partial<CertificateTemplate>) => void;
}

export default function SidebarControls({
  template,
  activeFieldId,
  onSelectField,
  onUpdateFieldStyle,
  onUpdateFieldProps,
  onAddField,
  onDeleteField,
  onUpdateQrCode,
  onUpdateSignature,
  onUpdateWatermark,
  onTriggerAiScan,
  aiScanning,
  aiFeedback,
  onUpdateTemplateLayout,
}: SidebarControlsProps) {
  const [activeTab, setActiveTab] = useState<"fields" | "styles" | "addons" | "ai">("ai");
  const [newFieldName, setNewFieldName] = useState<string>("");
  const [aiCommand, setAiCommand] = useState<string>("");
  const [aiWorking, setAiWorking] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [selectedCharIndex, setSelectedCharIndex] = useState<number | null>(null);

  const handleAiCommandSubmit = async (e?: React.FormEvent, customCmd?: string) => {
    if (e) e.preventDefault();
    const finalCmd = customCmd || aiCommand;
    if (!finalCmd.trim()) return;

    setAiWorking(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: finalCmd,
          template: template
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to process AI command");
      }

      if (json.success && onUpdateTemplateLayout) {
        onUpdateTemplateLayout(json.data);
        setAiCommand("");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Something went wrong during AI editing.");
    } finally {
      setAiWorking(false);
    }
  };

  const activeField = template.fields.find((f) => f.id === activeFieldId);

  const fonts = [
    "Poppins",
    "Space Grotesk",
    "Orbitron",
    "Inter",
    "Montserrat",
    "Roboto",
    "Playfair Display",
    "Times New Roman",
    "Georgia",
    "JetBrains Mono"
  ];

  const colors = [
    "#000000", "#1e293b", "#475569", "#7f1d1d", "#1e3a8a", "#14532d", 
    "#ca8a04", "#2563eb", "#dc2626", "#16a34a", "#9333ea", "#ffffff"
  ];

  const handleAddFieldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    const cleanName = newFieldName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    onAddField(cleanName);
    setNewFieldName("");
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        // Automatically run background removal for clean transparent signature
        const transparentBase64 = await removeSignatureBackground(base64);
        onUpdateSignature({
          imageSrc: transparentBase64,
          enabled: true,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 transition-colors w-full" id="sidebar-controls-root">
      {/* Sidebar Mode Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 p-2 gap-1 bg-slate-50/50 dark:bg-slate-950/20">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "ai"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          AI Co-Pilot
        </button>
        <button
          onClick={() => setActiveTab("fields")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "fields"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Layers
        </button>
        <button
          onClick={() => setActiveTab("styles")}
          disabled={!activeField}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === "styles"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Styles
        </button>
        <button
          onClick={() => setActiveTab("addons")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "addons"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          Extras
        </button>
      </div>

      {/* Tab Contents wrapper */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* TAB 0: AI CO-PILOT */}
        {activeTab === "ai" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-4 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] text-white/10">
                <Sparkles className="w-24 h-24 stroke-[1]" />
              </div>
              <div className="relative z-10 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">Co-Pilot</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <h4 className="text-sm font-black tracking-tight">EditFlow AI Command Engine</h4>
                <p className="text-[11px] text-white/80 leading-snug">
                  Type any formatting, placement, or design instruction. Gemini will update the layout on the canvas instantly.
                </p>
              </div>
            </div>

            {/* AI Command input box */}
            <form onSubmit={(e) => handleAiCommandSubmit(e)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Natural Language Command</label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={aiCommand}
                    onChange={(e) => setAiCommand(e.target.value)}
                    placeholder="e.g. 'Make student name bold, change size to 45, color to dark blue and move it down 5%'"
                    className="w-full p-3 pr-10 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                    disabled={aiWorking}
                  />
                  <div className="absolute right-2 bottom-3">
                    <button
                      type="submit"
                      disabled={aiWorking || !aiCommand.trim()}
                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-lg transition-all"
                    >
                      {aiWorking ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {aiError && (
                <p className="text-[11px] text-red-500 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-100 dark:border-red-950 font-medium">
                  {aiError}
                </p>
              )}
            </form>

            {/* Click to Try Prompt Options */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">💡 Popular AI Commands</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  "Bold student name and make its size 48px",
                  "Change student name color to navy blue and font to Space Grotesk",
                  "Add a golden medal emoji as custom sticker",
                  "Add a stylish red circle shape stamp",
                  "Position QR code in bottom-left and set url to https://verify.com",
                  "Remove the security watermark text"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAiCommandSubmit(undefined, prompt)}
                    disabled={aiWorking}
                    className="text-left w-full p-2 text-[11px] bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-950/10 dark:hover:bg-slate-950/30 border border-slate-100 dark:border-slate-800/80 rounded-lg text-slate-600 dark:text-slate-300 font-semibold transition-colors truncate"
                  >
                    🚀 "{prompt}"
                  </button>
                ))}
              </div>
            </div>

            {/* Instant Stamp, Shapes & Logo Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">🎨 Instant Stamps & Design Elements</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddField("SHAPE_CIRCLE")}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all text-left"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-500 flex-shrink-0" />
                  Circle Stamp
                </button>
                <button
                  onClick={() => onAddField("SHAPE_RECTANGLE")}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all text-left"
                >
                  <div className="w-4 h-2.5 rounded bg-indigo-500 flex-shrink-0" />
                  Rectangle Box
                </button>
                <button
                  onClick={() => onAddField("SHAPE_ARROW")}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all text-left"
                >
                  <div className="w-3.5 h-3.5 flex items-center justify-center text-red-500 font-black">➔</div>
                  Arrow Linker
                </button>
                <button
                  onClick={() => onAddField("EMOJI_STAR")}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all text-left"
                >
                  <span className="text-sm">⭐</span>
                  Star Sticker
                </button>
                <button
                  onClick={() => onAddField("EMOJI_BADGE")}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all text-left"
                >
                  <span className="text-sm">🏅</span>
                  Gold Medal
                </button>
                <button
                  onClick={() => onAddField("LOGO_IMAGE")}
                  className="flex items-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all text-left"
                >
                  <span className="text-sm">🖼️</span>
                  Logo Stamp
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 1: FIELDS & LAYOUT */}
        {activeTab === "fields" && (
          <div className="space-y-6">
            {/* AI Assistant Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-blue-950/20 p-4 rounded-xl border border-blue-100/50 dark:border-blue-900/40 relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-10px] text-blue-500/10 dark:text-blue-500/5">
                <Sparkles className="w-24 h-24 stroke-[1]" />
              </div>
              
              <div className="flex items-start gap-3 relative z-10">
                <div className="p-2 bg-blue-500 text-white rounded-lg shadow-sm">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-blue-900 dark:text-blue-400">Gemini Smart AI Placement</h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                    Instantly scan this template image with Google AI. Gemini will automatically find the blank participant line and align the name overlay for you.
                  </p>
                </div>
              </div>

              <div className="mt-3.5 flex flex-col gap-2 relative z-10">
                <button
                  onClick={onTriggerAiScan}
                  disabled={aiScanning}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {aiScanning ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{aiScanning ? "Gemini analyzing..." : "Auto-Detect Name Line"}</span>
                </button>
                {aiFeedback && (
                  <p className="text-[10px] text-slate-500 bg-slate-100/70 dark:bg-slate-850 p-2 rounded border border-slate-200/50 dark:border-slate-800 font-mono leading-tight">
                    {aiFeedback}
                  </p>
                )}
              </div>
            </div>

            {/* List of current placeholders */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Placeholders</h3>
              <div className="space-y-2">
                {template.fields.map((field) => {
                  const isActive = field.id === activeFieldId;
                  return (
                    <div
                      key={field.id}
                      onClick={() => {
                        onSelectField(field.id);
                        setActiveTab("styles"); // Jump to styles on select
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isActive
                          ? "bg-blue-50/50 border-blue-400 dark:bg-blue-950/20 dark:border-blue-700"
                          : "bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-950/10 dark:hover:bg-slate-950/30 border-slate-100 dark:border-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Type className={`w-4 h-4 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {field.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {field.placeholder} (X: {Math.round(field.x)}%, Y: {Math.round(field.y)}%)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {field.name !== "NAME" && field.name !== "EVENT" && (
                          <button
                            onClick={() => onDeleteField(field.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add new field form */}
            <form onSubmit={handleAddFieldSubmit} className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Add Custom Placeholder</h3>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{"{{"}</span>
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="COLLEGE"
                    className="w-full pl-6 pr-6 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">{"}}"}</span>
                </div>
                <button
                  type="submit"
                  className="px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Common options: COLLEGE, DATE, YEAR, POSITION, EVENT, ORGANIZER</p>
            </form>
          </div>
        )}

        {/* TAB 2: TEXT STYLES & CHARACTER CUSTOMIZER */}
        {activeTab === "styles" && activeField && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header info */}
            <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Styling Field</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{activeField.name}</p>
              </div>
              <button
                onClick={() => {
                  onSelectField(null);
                  setSelectedCharIndex(null);
                }}
                className="text-[10px] bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-2.5 py-1 rounded-md"
              >
                Clear Focus
              </button>
            </div>

            {/* SECTION 1: DIRECT CHARACTER / TEXT EDITING */}
            <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-950 dark:to-blue-950/20 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-blue-500" />
                  <span>Edit Exact Text Content</span>
                </label>
                {activeField.customText !== undefined && activeField.customText !== "" && (
                  <button
                    onClick={() => onUpdateFieldProps?.(activeField.id, { customText: "" })}
                    className="text-[10px] text-red-500 hover:underline font-semibold"
                  >
                    Reset to Dynamic
                  </button>
                )}
              </div>

              <textarea
                rows={2}
                value={activeField.customText !== undefined ? activeField.customText : (activeField.placeholder.startsWith("{{") ? activeField.name : activeField.placeholder)}
                onChange={(e) => onUpdateFieldProps?.(activeField.id, { customText: e.target.value })}
                placeholder="Type exact character string..."
                className="w-full p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-blue-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100 shadow-xs"
              />

              {/* Character Transformers & Case Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Character Case & Style Presets</span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      const cur = activeField.customText || activeField.name;
                      onUpdateFieldProps?.(activeField.id, { customText: cur.toUpperCase() });
                    }}
                    className="py-1 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300"
                  >
                    ALL CAPS
                  </button>
                  <button
                    onClick={() => {
                      const cur = activeField.customText || activeField.name;
                      onUpdateFieldProps?.(activeField.id, { customText: cur.toLowerCase() });
                    }}
                    className="py-1 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300"
                  >
                    lowercase
                  </button>
                  <button
                    onClick={() => {
                      const cur = activeField.customText || activeField.name;
                      const title = cur.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
                      onUpdateFieldProps?.(activeField.id, { customText: title });
                    }}
                    className="py-1 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300"
                  >
                    Title Case
                  </button>
                  <button
                    onClick={() => {
                      const cur = activeField.customText || activeField.name;
                      onUpdateFieldProps?.(activeField.id, { customText: cur.split("").join(" ") });
                    }}
                    className="py-1 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300"
                  >
                    S P A C E D
                  </button>
                  <button
                    onClick={() => {
                      const cur = activeField.customText || activeField.name;
                      const alt = cur.split("").map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join("");
                      onUpdateFieldProps?.(activeField.id, { customText: alt });
                    }}
                    className="py-1 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300"
                  >
                    SaTyAm
                  </button>
                  <button
                    onClick={() => {
                      const cur = activeField.customText || activeField.name;
                      onUpdateFieldProps?.(activeField.id, { customText: cur.split("").reverse().join("") });
                    }}
                    className="py-1 text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/30 text-slate-700 dark:text-slate-300"
                  >
                    Reverse
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 2: INDIVIDUAL LETTER-BY-LETTER INSPECTOR GRID */}
            <div className="space-y-3 bg-slate-50/80 dark:bg-slate-950/20 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Per-Letter Inspector</span>
                </label>
                {activeField.characterOverrides && Object.keys(activeField.characterOverrides).length > 0 && (
                  <button
                    onClick={() => onUpdateFieldProps?.(activeField.id, { characterOverrides: {} })}
                    className="text-[10px] text-red-500 hover:underline font-semibold"
                  >
                    Clear Letter Overrides
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-400">
                Click any letter badge below to customize its color, scale, vertical shift, or replace the character:
              </p>

              {/* Character badges row */}
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                {(() => {
                  const textVal = activeField.customText !== undefined && activeField.customText !== "" 
                    ? activeField.customText 
                    : (activeField.placeholder.startsWith("{{") ? activeField.name : activeField.placeholder);
                  
                  return textVal.split("").map((ch, idx) => {
                    const isSelected = selectedCharIndex === idx;
                    const charOverride = activeField.characterOverrides?.[idx];
                    const hasOverride = charOverride && Object.keys(charOverride).length > 0;
                    const displayChar = charOverride?.char !== undefined ? charOverride.char : ch;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedCharIndex(isSelected ? null : idx)}
                        className={`min-w-[28px] h-7 px-1.5 text-xs font-extrabold rounded-lg border transition-all flex items-center justify-center relative ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-md scale-105"
                            : hasOverride
                            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-black"
                            : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                        }`}
                        title={`Letter #${idx + 1}: ${displayChar}`}
                      >
                        {displayChar === " " ? "␣" : displayChar}
                        {hasOverride && !isSelected && (
                          <span className="absolute top-[-2px] right-[-2px] w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Tweak settings for selected letter */}
              {selectedCharIndex !== null && (
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/30 pb-2">
                    <span className="text-xs font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                      Letter #{selectedCharIndex + 1} Tweak
                    </span>
                    <button
                      onClick={() => setSelectedCharIndex(null)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Close ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Letter replacement */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Replace Letter</label>
                      <input
                        type="text"
                        maxLength={2}
                        value={activeField.characterOverrides?.[selectedCharIndex]?.char || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const currentOverrides = activeField.characterOverrides || {};
                          const prev = currentOverrides[selectedCharIndex] || {};
                          onUpdateFieldProps?.(activeField.id, {
                            characterOverrides: {
                              ...currentOverrides,
                              [selectedCharIndex]: { ...prev, char: val }
                            }
                          });
                        }}
                        placeholder="e.g. ★, A"
                        className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                      />
                    </div>

                    {/* Letter Color */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Letter Color</label>
                      <input
                        type="color"
                        value={activeField.characterOverrides?.[selectedCharIndex]?.color || activeField.style.fontColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          const currentOverrides = activeField.characterOverrides || {};
                          const prev = currentOverrides[selectedCharIndex] || {};
                          onUpdateFieldProps?.(activeField.id, {
                            characterOverrides: {
                              ...currentOverrides,
                              [selectedCharIndex]: { ...prev, color: val }
                            }
                          });
                        }}
                        className="w-full h-7 border border-slate-200 rounded-lg p-0 cursor-pointer"
                      />
                    </div>

                    {/* Letter Size Multiplier (Scale) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Size Scale</span>
                        <span>{activeField.characterOverrides?.[selectedCharIndex]?.fontSizeScale || 1}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.1"
                        value={activeField.characterOverrides?.[selectedCharIndex]?.fontSizeScale || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const currentOverrides = activeField.characterOverrides || {};
                          const prev = currentOverrides[selectedCharIndex] || {};
                          onUpdateFieldProps?.(activeField.id, {
                            characterOverrides: {
                              ...currentOverrides,
                              [selectedCharIndex]: { ...prev, fontSizeScale: val }
                            }
                          });
                        }}
                        className="w-full accent-indigo-600 h-1 cursor-pointer"
                      />
                    </div>

                    {/* Vertical Shift Offset */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Vertical Shift</span>
                        <span>{activeField.characterOverrides?.[selectedCharIndex]?.offsetY || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={activeField.characterOverrides?.[selectedCharIndex]?.offsetY || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const currentOverrides = activeField.characterOverrides || {};
                          const prev = currentOverrides[selectedCharIndex] || {};
                          onUpdateFieldProps?.(activeField.id, {
                            characterOverrides: {
                              ...currentOverrides,
                              [selectedCharIndex]: { ...prev, offsetY: val }
                            }
                          });
                        }}
                        className="w-full accent-indigo-600 h-1 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Letter background highlight */}
                  <div className="flex items-center justify-between pt-1 border-t border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-[10px] font-bold text-slate-500">Letter Highlight</span>
                    <input
                      type="color"
                      value={activeField.characterOverrides?.[selectedCharIndex]?.bgColor || "#fef08a"}
                      onChange={(e) => {
                        const val = e.target.value;
                        const currentOverrides = activeField.characterOverrides || {};
                        const prev = currentOverrides[selectedCharIndex] || {};
                        onUpdateFieldProps?.(activeField.id, {
                          characterOverrides: {
                            ...currentOverrides,
                            [selectedCharIndex]: { ...prev, bgColor: val }
                          }
                        });
                      }}
                      className="w-6 h-5 border border-slate-200 rounded p-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Typography family */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">Font Family</label>
              <select
                value={activeField.style.fontFamily}
                onChange={(e) => onUpdateFieldStyle(activeField.id, { fontFamily: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300 font-semibold"
              >
                {fonts.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Font Size & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Font Size ({activeField.style.fontSize}px)</label>
                <input
                  type="range"
                  min="8"
                  max="120"
                  value={activeField.style.fontSize}
                  onChange={(e) => onUpdateFieldStyle(activeField.id, { fontSize: Number(e.target.value) })}
                  className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Font Weight</label>
                <select
                  value={activeField.style.fontWeight}
                  onChange={(e) => onUpdateFieldStyle(activeField.id, { fontWeight: e.target.value as FontWeight })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <option value="light">Light</option>
                  <option value="normal">Regular</option>
                  <option value="medium">Medium</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>

            {/* Formatting (Bold, Italic, Underline) & Alignment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Decorations</label>
                <div className="flex bg-slate-100 dark:bg-slate-950/20 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 gap-1">
                  <button
                    onClick={() => onUpdateFieldStyle(activeField.id, { isBold: !activeField.style.isBold })}
                    className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-xs transition-colors ${
                      activeField.style.isBold ? "bg-slate-800 dark:bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateFieldStyle(activeField.id, { isItalic: !activeField.style.isItalic })}
                    className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-xs transition-colors ${
                      activeField.style.isItalic ? "bg-slate-800 dark:bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateFieldStyle(activeField.id, { isUnderline: !activeField.style.isUnderline })}
                    className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-xs transition-colors ${
                      activeField.style.isUnderline ? "bg-slate-800 dark:bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Alignment</label>
                <div className="flex bg-slate-100 dark:bg-slate-950/20 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 gap-1">
                  <button
                    onClick={() => onUpdateFieldStyle(activeField.id, { alignment: "left" })}
                    className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-xs transition-colors ${
                      activeField.style.alignment === "left" ? "bg-slate-800 dark:bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateFieldStyle(activeField.id, { alignment: "center" })}
                    className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-xs transition-colors ${
                      activeField.style.alignment === "center" ? "bg-slate-800 dark:bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateFieldStyle(activeField.id, { alignment: "right" })}
                    className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-xs transition-colors ${
                      activeField.style.alignment === "right" ? "bg-slate-800 dark:bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 3: GRADIENT FILL & BADGE BOX */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {/* Gradient Text Fill */}
              <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Gradient Text Fill</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!activeField.style.gradientEnabled}
                      onChange={(e) => onUpdateFieldStyle(activeField.id, { gradientEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-3.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {activeField.style.gradientEnabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1 animate-fadeIn">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500">Start Color</span>
                      <input
                        type="color"
                        value={activeField.style.gradientStart || "#2563eb"}
                        onChange={(e) => onUpdateFieldStyle(activeField.id, { gradientStart: e.target.value })}
                        className="w-full h-6 rounded border border-slate-200 p-0 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-500">End Color</span>
                      <input
                        type="color"
                        value={activeField.style.gradientEnd || "#9333ea"}
                        onChange={(e) => onUpdateFieldStyle(activeField.id, { gradientEnd: e.target.value })}
                        className="w-full h-6 rounded border border-slate-200 p-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Badge Highlight Box */}
              <div className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Badge Background Box</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!activeField.style.bgHighlightEnabled}
                      onChange={(e) => onUpdateFieldStyle(activeField.id, { bgHighlightEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-3.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {activeField.style.bgHighlightEnabled && (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500">Box Color</span>
                      <input
                        type="color"
                        value={activeField.style.bgHighlightColor || "#f1f5f9"}
                        onChange={(e) => onUpdateFieldStyle(activeField.id, { bgHighlightColor: e.target.value })}
                        className="w-6 h-5 border border-slate-200 rounded p-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Colors picker palette */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500">Solid Text Color</label>
                <input
                  type="color"
                  value={activeField.style.fontColor}
                  onChange={(e) => onUpdateFieldStyle(activeField.id, { fontColor: e.target.value })}
                  className="w-7 h-5 border border-slate-200 rounded cursor-pointer p-0 bg-transparent"
                />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => onUpdateFieldStyle(activeField.id, { fontColor: c })}
                    style={{ backgroundColor: c }}
                    className={`h-6 rounded-md border border-slate-200/50 shadow-xs hover:scale-105 transition-transform flex items-center justify-center ${
                      c.toLowerCase() === activeField.style.fontColor.toLowerCase() ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    {c.toLowerCase() === activeField.style.fontColor.toLowerCase() && (
                      <Check className={`w-3 h-3 ${c === "#ffffff" ? "text-slate-900" : "text-white"}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing, Height, Rotate Sliders */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Letter Spacing (Tracking)</span>
                  <span>{activeField.style.letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="-4"
                  max="20"
                  step="0.5"
                  value={activeField.style.letterSpacing}
                  onChange={(e) => onUpdateFieldStyle(activeField.id, { letterSpacing: Number(e.target.value) })}
                  className="w-full accent-blue-600 h-1 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Rotation</span>
                  <span>{activeField.style.rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={activeField.style.rotation}
                  onChange={(e) => onUpdateFieldStyle(activeField.id, { rotation: Number(e.target.value) })}
                  className="w-full accent-blue-600 h-1 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Opacity</span>
                  <span>{Math.round(activeField.style.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={activeField.style.opacity}
                  onChange={(e) => onUpdateFieldStyle(activeField.id, { opacity: Number(e.target.value) })}
                  className="w-full accent-blue-600 h-1 bg-slate-100 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Shadow & Stroke */}
            <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Text Shadow (Glow)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Blur ({activeField.style.shadowBlur}px)</span>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={activeField.style.shadowBlur}
                      onChange={(e) => onUpdateFieldStyle(activeField.id, { shadowBlur: Number(e.target.value) })}
                      className="w-full accent-blue-600 h-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Shadow Color</span>
                    <input
                      type="color"
                      value={activeField.style.shadowColor}
                      onChange={(e) => onUpdateFieldStyle(activeField.id, { shadowColor: e.target.value })}
                      className="w-full h-5 border border-slate-200 p-0 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Text Stroke / Border</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Width ({activeField.style.strokeWidth}px)</span>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      value={activeField.style.strokeWidth}
                      onChange={(e) => onUpdateFieldStyle(activeField.id, { strokeWidth: Number(e.target.value) })}
                      className="w-full accent-blue-600 h-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Stroke Color</span>
                    <input
                      type="color"
                      value={activeField.style.strokeColor}
                      onChange={(e) => onUpdateFieldStyle(activeField.id, { strokeColor: e.target.value })}
                      className="w-full h-5 border border-slate-200 p-0 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QR CODE, SIGNATURE & WATERMARK */}
        {activeTab === "addons" && (
          <div className="space-y-6">
            
            {/* QR Code configuration */}
            <div className="bg-slate-50/50 dark:bg-slate-950/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Verification QR Code</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.qrCode.enabled}
                    onChange={(e) => onUpdateQrCode({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {template.qrCode.enabled && (
                <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold">Verification URL / Target URL</span>
                    <input
                      type="text"
                      value={template.qrCode.url}
                      onChange={(e) => onUpdateQrCode({ url: e.target.value })}
                      placeholder="https://verify.certifyai.com"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Size ({Math.round(template.qrCode.size)}%)</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="15"
                      value={template.qrCode.size}
                      onChange={(e) => onUpdateQrCode({ size: Number(e.target.value) })}
                      className="w-full accent-blue-600 h-1 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Signature upload config */}
            <div className="bg-slate-50/50 dark:bg-slate-950/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Digital Signature</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.signature.enabled}
                    onChange={(e) => onUpdateSignature({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {template.signature.enabled && (
                <div className="space-y-4 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  {template.signature.imageSrc ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                        <img
                          src={template.signature.imageSrc}
                          alt="Signature Preview"
                          className="h-10 object-contain max-w-[120px] bg-slate-100 p-1 rounded"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() => onUpdateSignature({ imageSrc: "" })}
                          className="text-[10px] text-red-500 hover:bg-red-50 px-2 py-1 rounded"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Size ({Math.round(template.signature.width)}%)</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="25"
                          value={template.signature.width}
                          onChange={(e) => onUpdateSignature({ 
                            width: Number(e.target.value), 
                            height: Number(e.target.value) * 0.6 
                          })}
                          className="w-full accent-blue-600 h-1 cursor-pointer"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Rotate ({template.signature.rotation}°)</span>
                        </div>
                        <input
                          type="range"
                          min="-45"
                          max="45"
                          value={template.signature.rotation}
                          onChange={(e) => onUpdateSignature({ rotation: Number(e.target.value) })}
                          className="w-full accent-blue-600 h-1 cursor-pointer"
                        />
                      </div>

                      <div className="bg-blue-50/50 dark:bg-slate-900 p-2 rounded-lg text-[10px] text-blue-600 leading-tight flex items-start gap-1.5 border border-blue-100/50">
                        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>White signature background removed automatically to create transparent vector.</span>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-6 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                      <ImageIcon className="w-6 h-6 text-slate-400 mb-1.5" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Upload signature image</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">PNG / JPG with dark ink on paper</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            {/* Watermark configuration */}
            <div className="bg-slate-50/50 dark:bg-slate-950/10 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Security Watermark</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={template.watermark.enabled}
                    onChange={(e) => onUpdateWatermark({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {template.watermark.enabled && (
                <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold">Watermark Text</span>
                    <input
                      type="text"
                      value={template.watermark.text}
                      onChange={(e) => onUpdateWatermark({ text: e.target.value })}
                      placeholder="CONFIDENTIAL"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Opacity ({Math.round(template.watermark.opacity * 100)}%)</span>
                    </div>
                    <input
                      type="range"
                      min="0.01"
                      max="0.25"
                      step="0.01"
                      value={template.watermark.opacity}
                      onChange={(e) => onUpdateWatermark({ opacity: Number(e.target.value) })}
                      className="w-full accent-blue-600 h-1 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Rotation ({template.watermark.rotation}°)</span>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      value={template.watermark.rotation}
                      onChange={(e) => onUpdateWatermark({ rotation: Number(e.target.value) })}
                      className="w-full accent-blue-600 h-1 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
