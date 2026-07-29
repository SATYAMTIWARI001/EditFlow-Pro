import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { CertificateTemplate, CertificateField, FieldStyle, ParticipantRecord } from "./types";
import { generateDefaultTemplates } from "./lib/templateGenerator";
import { generateQRCodeDataUrl } from "./lib/canvasUtils";
import TemplateLibrary from "./components/TemplateLibrary";
import SidebarControls from "./components/SidebarControls";
import Workspace from "./components/Workspace";
import BatchGenerator from "./components/BatchGenerator";
import VerificationPage from "./components/VerificationPage";
import PdfSuite from "./components/PdfSuite";
import ImageSuite from "./components/ImageSuite";

import {
  Award,
  BookOpen,
  Sliders,
  CheckCircle,
  Moon,
  Sun,
  Layout,
  FileDown,
  Sparkles,
  RefreshCw,
  Search,
  Activity,
  Download,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  DownloadCloud,
  Check,
  Undo2,
  Redo2,
  RotateCcw,
  RotateCw,
  History
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"library" | "editor" | "pdf" | "image" | "verification">("library");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [showGlobalDownloadModal, setShowGlobalDownloadModal] = useState<boolean>(false);

  // Loaded templates
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Undo / Redo state management history stack
  const [historyStack, setHistoryStack] = useState<CertificateTemplate[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const historyIndexRef = useRef<number>(historyIndex);
  historyIndexRef.current = historyIndex;

  const historyStackRef = useRef<CertificateTemplate[][]>(historyStack);
  historyStackRef.current = historyStack;

  const debouncedTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Deep clone templates for immutable history snapshots
  const cloneTemplates = (tpls: CertificateTemplate[]): CertificateTemplate[] => {
    return tpls.map((t) => ({
      ...t,
      fields: t.fields.map((f) => ({
        ...f,
        style: { ...f.style },
        characterOverrides: f.characterOverrides
          ? JSON.parse(JSON.stringify(f.characterOverrides))
          : undefined,
      })),
      qrCode: { ...t.qrCode },
      signature: { ...t.signature },
      watermark: { ...t.watermark },
    }));
  };

  // Push layout or style change onto history stack
  const recordHistory = useCallback((newTemplates: CertificateTemplate[], debounceMs: number = 0) => {
    const snapshot = cloneTemplates(newTemplates);
    setTemplates(snapshot);

    if (debounceMs > 0) {
      if (debouncedTimerRef.current) clearTimeout(debouncedTimerRef.current);
      debouncedTimerRef.current = setTimeout(() => {
        setHistoryStack((prevStack) => {
          const sliced = prevStack.slice(0, historyIndexRef.current + 1);
          const updated = [...sliced, snapshot].slice(-50);
          setHistoryIndex(updated.length - 1);
          return updated;
        });
      }, debounceMs);
    } else {
      if (debouncedTimerRef.current) clearTimeout(debouncedTimerRef.current);
      setHistoryStack((prevStack) => {
        const sliced = prevStack.slice(0, historyIndexRef.current + 1);
        const updated = [...sliced, snapshot].slice(-50);
        setHistoryIndex(updated.length - 1);
        return updated;
      });
    }
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const handleUndo = useCallback(() => {
    const idx = historyIndexRef.current;
    const stack = historyStackRef.current;
    if (idx > 0) {
      const prevIdx = idx - 1;
      const prevTemplates = cloneTemplates(stack[prevIdx]);
      setTemplates(prevTemplates);
      setHistoryIndex(prevIdx);
    }
  }, []);

  const handleRedo = useCallback(() => {
    const idx = historyIndexRef.current;
    const stack = historyStackRef.current;
    if (idx < stack.length - 1) {
      const nextIdx = idx + 1;
      const nextTemplates = cloneTemplates(stack[nextIdx]);
      setTemplates(nextTemplates);
      setHistoryIndex(nextIdx);
    }
  }, []);

  // Keyboard shortcut listener for Ctrl+Z / Cmd+Z (Undo) and Ctrl+Y / Cmd+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const isMac = typeof window !== "undefined" && window.navigator?.platform ? window.navigator.platform.toUpperCase().indexOf("MAC") >= 0 : false;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (modifier && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Live preview data (dynamic field test values)
  const [previewName, setPreviewName] = useState<string>("SATYAM TIWARI");
  const [previewEvent, setPreviewEvent] = useState<string>("Google Student Ambassador Hackathon");
  const [previewCollege, setPreviewCollege] = useState<string>("Stanford University");
  const [previewDate, setPreviewDate] = useState<string>("July 19, 2026");
  const [previewOrganizer, setPreviewOrganizer] = useState<string>("Google Dev Committee");
  const [previewCertId, setPreviewCertId] = useState<string>("GSA-2026-0001");

  // QR Code base64 cached output
  const [qrCodeUrlDataUrl, setQrCodeUrlDataUrl] = useState<string>("");

  // AI states
  const [aiScanning, setAiScanning] = useState<boolean>(false);
  const [aiFeedback, setAiFeedback] = useState<string>("");

  // Credential History (Active Registry)
  const [history, setHistory] = useState<ParticipantRecord[]>([
    {
      id: "hist-1",
      certificateId: "GSA-2026-0001",
      name: "SATYAM TIWARI",
      date: "July 19, 2026",
      college: "Stanford University",
      event: "Google Student Ambassador Program",
      organizer: "GDSC Committee",
      position: "Student Leader",
      year: "2026",
      generatedAt: "2026-07-19T02:28:11"
    },
    {
      id: "hist-2",
      certificateId: "GSA-2026-0081",
      name: "Rahul Sharma",
      date: "May 24, 2026",
      college: "Stanford University",
      event: "Global DevFest Hackathon",
      organizer: "Tech Council",
      position: "Winner",
      year: "2026",
      generatedAt: "2026-05-24T18:14:55"
    }
  ]);

  // Load default templates on boot
  useEffect(() => {
    const defaultTemplates = generateDefaultTemplates();
    const cloned = cloneTemplates(defaultTemplates);
    setTemplates(cloned);
    setHistoryStack([cloned]);
    setHistoryIndex(0);
    if (defaultTemplates.length > 0) {
      setActiveTemplateId(defaultTemplates[0].id);
    }
  }, []);

  // Sync QR Code generation whenever active template URL or QR status changes
  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.id === activeTemplateId) || null;
  }, [templates, activeTemplateId]);

  useEffect(() => {
    if (activeTemplate?.qrCode.enabled && activeTemplate?.qrCode.url) {
      generateQRCodeDataUrl(activeTemplate.qrCode.url).then((url) => {
        setQrCodeUrlDataUrl(url);
      });
    } else {
      setQrCodeUrlDataUrl("");
    }
  }, [activeTemplate?.qrCode.url, activeTemplate?.qrCode.enabled]);

  // --- Handlers for Templates ---
  
  const handleSelectTemplate = (id: string) => {
    setActiveTemplateId(id);
    setActiveFieldId(null);
    setActiveTab("editor"); // Jump directly to template customizer
  };

  const handleUploadTemplate = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const newId = `tpl-uploaded-${Date.now()}`;
      
      const newTemplate: CertificateTemplate = {
        id: newId,
        name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
        category: "Participation",
        imageSrc: dataUrl,
        isUserUploaded: true,
        fields: [
          {
            id: "field-name",
            name: "NAME",
            placeholder: "{{NAME}}",
            x: 50,
            y: 50,
            width: 60,
            style: {
              fontFamily: "Poppins",
              fontSize: 36,
              fontWeight: "bold",
              fontColor: "#0f172a",
              alignment: "center",
              letterSpacing: 0,
              lineHeight: 1.2,
              rotation: 0,
              opacity: 1,
              shadowColor: "#000",
              shadowBlur: 0,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              strokeColor: "#000",
              strokeWidth: 0,
              isBold: true,
              isItalic: false,
              isUnderline: false,
              textTransform: "none",
            },
          },
          {
            id: "field-event",
            name: "EVENT",
            placeholder: "{{EVENT}}",
            x: 50,
            y: 62,
            width: 50,
            style: {
              fontFamily: "Poppins",
              fontSize: 18,
              fontWeight: "normal",
              fontColor: "#475569",
              alignment: "center",
              letterSpacing: 0,
              lineHeight: 1.2,
              rotation: 0,
              opacity: 1,
              shadowColor: "#000",
              shadowBlur: 0,
              shadowOffsetX: 0,
              shadowOffsetY: 0,
              strokeColor: "#000",
              strokeWidth: 0,
              isBold: false,
              isItalic: false,
              isUnderline: false,
              textTransform: "none",
            },
          }
        ],
        qrCode: {
          id: "qr-uploaded",
          url: "https://ai.studio/build",
          x: 88,
          y: 78,
          size: 7,
          enabled: false,
        },
        signature: {
          id: "sig-uploaded",
          imageSrc: "",
          x: 65,
          y: 70,
          width: 10,
          height: 6,
          rotation: -5,
          enabled: false,
        },
        watermark: {
          id: "wm-uploaded",
          text: "CertifyAI Verified",
          x: 50,
          y: 50,
          size: 10,
          rotation: -30,
          opacity: 0.05,
          enabled: false,
        },
      };

      recordHistory([newTemplate, ...templates]);
      setActiveTemplateId(newId);
      setActiveFieldId(null);
      setActiveTab("editor");
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    recordHistory(updated);
    if (activeTemplateId === id) {
      setActiveTemplateId(updated[0]?.id || null);
    }
  };

  const handleDuplicateTemplate = (id: string) => {
    const target = templates.find((t) => t.id === id);
    if (!target) return;
    const duplicated: CertificateTemplate = {
      ...target,
      id: `tpl-dup-${Date.now()}`,
      name: `${target.name} (Copy)`,
      isUserUploaded: true, // Let them delete duplicated copies
      fields: target.fields.map((f) => ({
        ...f,
        id: `field-${Date.now()}-${Math.random()}`,
        style: { ...f.style },
      })),
      qrCode: { ...target.qrCode },
      signature: { ...target.signature },
      watermark: { ...target.watermark },
    };
    recordHistory([duplicated, ...templates]);
    setActiveTemplateId(duplicated.id);
  };

  // Export / Import Layout configurations (JSON file metadata exchange)
  const handleExportTemplate = (template: CertificateTemplate) => {
    const config = {
      name: template.name,
      category: template.category,
      fields: template.fields,
      qrCode: template.qrCode,
      signature: template.signature,
      watermark: template.watermark,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.name.trim().replace(/\s+/g, "_")}_LayoutConfig.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const handleImportTemplate = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (!activeTemplateId) return;
        
        const updated = templates.map((t) => {
          if (t.id === activeTemplateId) {
            return {
              ...t,
              fields: config.fields || t.fields,
              qrCode: config.qrCode || t.qrCode,
              signature: config.signature || t.signature,
              watermark: config.watermark || t.watermark,
            };
          }
          return t;
        });
        recordHistory(updated);
        console.log("Template layout configuration imported successfully into the active certificate workspace!");
      } catch (err) {
        console.error("Invalid template layout configuration JSON file.");
      }
    };
    reader.readAsText(file);
  };

  // --- Handlers for Field Customization ---

  const handleSelectField = (id: string | null) => {
    setActiveFieldId(id);
  };

  const handleUpdateFieldStyle = (fieldId: string, styleOverrides: Partial<FieldStyle>) => {
    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return {
          ...t,
          fields: t.fields.map((f) => {
            if (f.id === fieldId) {
              return { ...f, style: { ...f.style, ...styleOverrides } };
            }
            return f;
          }),
        };
      }
      return t;
    });
    recordHistory(updated, 150);
  };

  const handleUpdateFieldProps = (fieldId: string, props: Partial<CertificateField>) => {
    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return {
          ...t,
          fields: t.fields.map((f) => {
            if (f.id === fieldId) {
              return { ...f, ...props };
            }
            return f;
          }),
        };
      }
      return t;
    });
    recordHistory(updated, 150);
  };

  const handleUpdateFieldPosition = (fieldId: string, x: number, y: number) => {
    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return {
          ...t,
          fields: t.fields.map((f) => {
            if (f.id === fieldId) {
              return { ...f, x, y };
            }
            return f;
          }),
        };
      }
      return t;
    });
    recordHistory(updated, 250);
  };

  const handleAddField = (placeholderName: string, x: number = 50, y: number = 50) => {
    if (!activeTemplateId) return;
    const newField: CertificateField = {
      id: `field-custom-${Date.now()}`,
      name: placeholderName,
      placeholder: `{{${placeholderName}}}`,
      x,
      y,
      width: 40,
      style: {
        fontFamily: "Poppins",
        fontSize: 16,
        fontWeight: "normal",
        fontColor: "#475569",
        alignment: "center",
        letterSpacing: 0,
        lineHeight: 1.2,
        rotation: 0,
        opacity: 1,
        shadowColor: "#000",
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        strokeColor: "#000",
        strokeWidth: 0,
        isBold: false,
        isItalic: false,
        isUnderline: false,
        textTransform: "none",
      },
    };

    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return { ...t, fields: [...t.fields, newField] };
      }
      return t;
    });
    recordHistory(updated);
    setActiveFieldId(newField.id);
  };

  const handleDeleteField = (id: string) => {
    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return { ...t, fields: t.fields.filter((f) => f.id !== id) };
      }
      return t;
    });
    recordHistory(updated);
    if (activeFieldId === id) setActiveFieldId(null);
  };

  // --- Extras / QR, Signature, Watermark handlers ---

  const handleUpdateQrCode = (config: Partial<CertificateTemplate["qrCode"]>) => {
    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return { ...t, qrCode: { ...t.qrCode, ...config } };
      }
      return t;
    });
    recordHistory(updated, 150);
  };

  const handleUpdateQrPosition = (x: number, y: number) => {
    handleUpdateQrCode({ x, y });
  };

  const handleUpdateSignature = (config: Partial<CertificateTemplate["signature"]>) => {
    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return { ...t, signature: { ...t.signature, ...config } };
      }
      return t;
    });
    recordHistory(updated, 150);
  };

  const handleUpdateSigPosition = (x: number, y: number) => {
    handleUpdateSignature({ x, y });
  };

  const handleUpdateWatermark = (config: Partial<CertificateTemplate["watermark"]>) => {
    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return { ...t, watermark: { ...t.watermark, ...config } };
      }
      return t;
    });
    recordHistory(updated, 150);
  };

  const handleUpdateTemplateLayout = (layout: Partial<CertificateTemplate>) => {
    const updated = templates.map((t) => {
      if (t.id === activeTemplateId) {
        return {
          ...t,
          fields: layout.fields || t.fields,
          qrCode: layout.qrCode ? { ...t.qrCode, ...layout.qrCode } : t.qrCode,
          signature: layout.signature ? { ...t.signature, ...layout.signature } : t.signature,
          watermark: layout.watermark ? { ...t.watermark, ...layout.watermark } : t.watermark,
        };
      }
      return t;
    });
    recordHistory(updated);
  };

  // --- AI Smart Scan trigger ---
  const handleTriggerAiScan = async () => {
    if (!activeTemplate) return;
    setAiScanning(true);
    setAiFeedback("Analyzing background vector coordinates with Gemini 2.5 Flash Vision...");

    try {
      const response = await fetch("/api/analyze-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: activeTemplate.imageSrc,
          mimeType: "image/png"
        }),
      });

      const data = await response.json();
      if (data && typeof data.x === "number") {
        // AI found correct spot! Update position of NAME field
        const updated = templates.map((t) => {
          if (t.id === activeTemplateId) {
            return {
              ...t,
              fields: t.fields.map((f) => {
                if (f.name === "NAME") {
                  return {
                    ...f,
                    x: data.x,
                    y: data.y,
                    style: {
                      ...f.style,
                      fontSize: data.fontSize * 12, // match to scaling factor
                      alignment: data.alignment || "center",
                    }
                  };
                }
                return f;
              })
            };
          }
          return t;
        });
        recordHistory(updated);
        setAiFeedback(`Gemini AI suggestion applied! Reason: ${data.reason}.`);
        setActiveFieldId("field-name");
      } else {
        setAiFeedback("AI was unable to locate name field. Align manually.");
      }
    } catch (e: any) {
      setAiFeedback(`AI error: ${e.message || e}. Using standard template settings.`);
    } finally {
      setAiScanning(false);
    }
  };

  // Add generated credential record to registry history
  const handleAddHistory = (record: ParticipantRecord) => {
    setHistory((prev) => {
      // Avoid duplicate cert IDs
      if (prev.some((r) => r.certificateId === record.certificateId)) return prev;
      return [record, ...prev];
    });
  };

  // Handler for verification reverse mapping
  const handleSelectRecordName = (name: string, record: ParticipantRecord) => {
    setPreviewName(record.name);
    setPreviewEvent(record.event);
    setPreviewCollege(record.college);
    setPreviewDate(record.date);
    setPreviewOrganizer(record.organizer);
    setPreviewCertId(record.certificateId);
    setActiveTab("editor");
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${darkMode ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800"}`} id="app-root-container">
      
      {/* 🚀 Visual Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">EditFlow Pro</span>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-1.5 py-0.5 rounded">PRO</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">AI Document & Graphics Studio</p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-950/40 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("library")}
              id="nav-btn-library"
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === "library"
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab("editor")}
              disabled={!activeTemplateId}
              id="nav-btn-editor"
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${
                activeTab === "editor"
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              Designer Workspace
            </button>
            <button
              onClick={() => setActiveTab("pdf")}
              id="nav-btn-pdf"
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === "pdf"
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              Smart PDF Suite
            </button>
            <button
              onClick={() => setActiveTab("image")}
              id="nav-btn-image"
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === "image"
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              AI Image Studio
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              id="nav-btn-verification"
              className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                activeTab === "verification"
                  ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              Registry & Verification
            </button>
          </nav>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-2.5">
            {/* Top Header Undo / Redo controls */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-0.5 border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                id="top-hdr-undo-btn"
                className="px-2 py-1 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Undo layout/style change (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-xs">Undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                id="top-hdr-redo-btn"
                className="px-2 py-1 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
                title="Redo layout/style change (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline text-xs">Redo</span>
              </button>
            </div>

            <button
              onClick={() => setShowGlobalDownloadModal(true)}
              id="top-global-download-btn"
              className="px-4 py-2 bg-gradient-to-r from-red-600 via-indigo-600 to-violet-600 hover:from-red-700 hover:via-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="Download Current Document / Certificate / Export"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>Download</span>
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
              title="Toggle Light/Dark Theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </header>

      {/* 💼 Main Core Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8" id="app-main-view">
        
        {/* VIEW 1: TEMPLATE LIBRARY / HOMEPAGE */}
        {activeTab === "library" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Elegant Hero card */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="absolute right-[-40px] bottom-[-45px] text-slate-800/10">
                <Award className="w-80 h-80 stroke-[0.5]" />
              </div>

              <div className="space-y-2 max-w-xl relative z-10">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-black uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" />
                  <span>Google AI Empowered Platform</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  Instantly design & generate personalized high-resolution certificates.
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                  Upload an existing certificate image, let Gemini AI auto-detect placement lines, configure placeholders, and batch-issue hundreds of certificates inside a ZIP in seconds.
                </p>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <button
                  onClick={() => {
                    const el = document.getElementById("template-library-container");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/10"
                >
                  Browse Designs
                </button>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-mono text-slate-400">Registry Health</p>
                  <p className="text-sm font-bold text-green-400 flex items-center gap-1 justify-end">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Active Verified</span>
                  </p>
                </div>
              </div>
            </div>

            {/* List and category search library */}
            <TemplateLibrary
              templates={templates}
              activeTemplateId={activeTemplateId}
              onSelectTemplate={handleSelectTemplate}
              onUploadTemplate={handleUploadTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onDuplicateTemplate={handleDuplicateTemplate}
              onExportTemplate={handleExportTemplate}
              onImportTemplate={handleImportTemplate}
              onAddHistory={handleAddHistory}
            />
          </div>
        )}

        {/* VIEW 2: TEMPLATE DESIGNER & WORKSPACE */}
        {activeTab === "editor" && activeTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn items-start">
            
            {/* Left Main View (Canvas workspace & Generator control form) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Dynamic canvas editor */}
              <Workspace
                template={activeTemplate}
                activeFieldId={activeFieldId}
                onSelectField={handleSelectField}
                onUpdateFieldPosition={handleUpdateFieldPosition}
                onUpdateFieldProps={handleUpdateFieldProps}
                onUpdateFieldStyle={handleUpdateFieldStyle}
                onUpdateQrPosition={handleUpdateQrPosition}
                onUpdateSigPosition={handleUpdateSigPosition}
                previewName={previewName}
                previewEvent={previewEvent}
                previewCollege={previewCollege}
                previewDate={previewDate}
                previewOrganizer={previewOrganizer}
                previewCertId={previewCertId}
                qrCodeUrlDataUrl={qrCodeUrlDataUrl}
                onAddField={handleAddField}
                onAddHistory={handleAddHistory}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                historyStep={{ current: historyIndex + 1, total: historyStack.length }}
              />

              {/* Generator console form */}
              <BatchGenerator
                template={activeTemplate}
                previewName={previewName}
                setPreviewName={setPreviewName}
                previewEvent={previewEvent}
                setPreviewEvent={setPreviewEvent}
                previewCollege={previewCollege}
                setPreviewCollege={setPreviewCollege}
                previewDate={previewDate}
                setPreviewDate={setPreviewDate}
                previewOrganizer={previewOrganizer}
                setPreviewOrganizer={setPreviewOrganizer}
                previewCertId={previewCertId}
                setPreviewCertId={setPreviewCertId}
                qrCodeUrlDataUrl={qrCodeUrlDataUrl}
                onAddHistory={handleAddHistory}
              />

            </div>

            {/* Right Control Sidebar */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-[820px]">
              <SidebarControls
                template={activeTemplate}
                activeFieldId={activeFieldId}
                onSelectField={handleSelectField}
                onUpdateFieldStyle={handleUpdateFieldStyle}
                onUpdateFieldProps={handleUpdateFieldProps}
                onAddField={handleAddField}
                onDeleteField={handleDeleteField}
                onUpdateQrCode={handleUpdateQrCode}
                onUpdateSignature={handleUpdateSignature}
                onUpdateWatermark={handleUpdateWatermark}
                onTriggerAiScan={handleTriggerAiScan}
                aiScanning={aiScanning}
                aiFeedback={aiFeedback}
                onUpdateTemplateLayout={handleUpdateTemplateLayout}
              />
            </div>

          </div>
        )}

        {/* VIEW 3: SMART PDF SUITE */}
        {activeTab === "pdf" && (
          <div className="space-y-6 animate-fadeIn">
            <PdfSuite />
          </div>
        )}

        {/* VIEW 4: AI PHOTO STUDIO */}
        {activeTab === "image" && (
          <div className="space-y-6 animate-fadeIn">
            <ImageSuite />
          </div>
        )}

        {/* VIEW 5: VERIFICATION CENTER & LOGS */}
        {activeTab === "verification" && (
          <div className="space-y-6 animate-fadeIn">
            <VerificationPage
              history={history}
              onSelectRecordName={handleSelectRecordName}
            />
          </div>
        )}

      </main>

      {/* 🌟 Footer */}
      <footer className="mt-auto bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 py-6 transition-colors text-center text-xs text-slate-400">
        <p>© 2026 EditFlow Pro - Adobe Acrobat Pro & Word PDF Editor. Crafted using Vite + React.</p>
      </footer>

      {/* 📥 GLOBAL QUICK DOWNLOAD MODAL */}
      {showGlobalDownloadModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="global-download-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Download Studio Files</h3>
                  <p className="text-[11px] text-slate-400 font-bold">Select format to download active document or certificate</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGlobalDownloadModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-black rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: Acrobat & Word PDF Editor */}
              <button
                onClick={() => {
                  setShowGlobalDownloadModal(false);
                  setActiveTab("pdf");
                  // Trigger PDF download after tab switch
                  setTimeout(() => {
                    const acrobatBtn = document.getElementById("acrobat-export-download-btn");
                    if (acrobatBtn) acrobatBtn.click();
                  }, 150);
                }}
                className="p-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex flex-col items-start gap-2 text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between w-full">
                  <FileText className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full">Acrobat Pro</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Acrobat PDF / Word (.pdf)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Download full PDF with edited text, images & vector shapes</p>
                </div>
              </button>

              {/* Option 2: Microsoft Word Format */}
              <button
                onClick={() => {
                  setShowGlobalDownloadModal(false);
                  setActiveTab("pdf");
                  setTimeout(() => {
                    const acrobatBtn = document.getElementById("acrobat-export-download-btn");
                    if (acrobatBtn) acrobatBtn.click();
                  }, 150);
                }}
                className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex flex-col items-start gap-2 text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between w-full">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full">Word DOCX</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Word Document (.docx)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Export structured text and flow formatting</p>
                </div>
              </button>

              {/* Option 3: Designer Workspace Certificate PNG/PDF */}
              <button
                onClick={() => {
                  setShowGlobalDownloadModal(false);
                  if (activeTemplateId) {
                    setActiveTab("editor");
                  } else {
                    setActiveTab("library");
                  }
                }}
                className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex flex-col items-start gap-2 text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between w-full">
                  <ImageIcon className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full">Graphic Image</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Certificate / Graphic (.png)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">High-resolution print PNG image export</p>
                </div>
              </button>

              {/* Option 4: Plain Text / Markdown */}
              <button
                onClick={() => {
                  setShowGlobalDownloadModal(false);
                  const txt = "EditFlow Pro Document Export\n\nDate: " + new Date().toLocaleDateString() + "\nStatus: Generated successfully";
                  const blob = new Blob([txt], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "editflow_export.txt";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  setTimeout(() => URL.revokeObjectURL(url), 5000);
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all flex flex-col items-start gap-2 text-left cursor-pointer group"
              >
                <div className="flex items-center justify-between w-full">
                  <FileDown className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">Plain Text</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Text Summary (.txt)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Raw text & layout data structure</p>
                </div>
              </button>

            </div>

            <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Fast Client-Side Rendering</span>
              <span>EditFlow Pro 2026 Engine</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
