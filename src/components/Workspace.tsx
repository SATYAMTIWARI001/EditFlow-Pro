import React, { useRef, useState, useEffect } from "react";
import { CertificateTemplate, CertificateField, ParticipantRecord } from "../types";
import { getSmartTextScale, formatFieldValue } from "../lib/canvasUtils";
import { Maximize2, QrCode, PenTool, Plus, Download, RefreshCw, FileDown, Award, Zap, Sparkles } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface WorkspaceProps {
  template: CertificateTemplate;
  activeFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onUpdateFieldPosition: (id: string, x: number, y: number) => void;
  onUpdateQrPosition: (x: number, y: number) => void;
  onUpdateSigPosition: (x: number, y: number) => void;
  // Live preview test name
  previewName: string;
  previewEvent: string;
  previewCollege: string;
  previewDate: string;
  previewOrganizer: string;
  previewCertId: string;
  qrCodeUrlDataUrl: string;
  onAddField?: (name: string, x?: number, y?: number) => void;
  onAddHistory?: (record: ParticipantRecord) => void;
}

export default function Workspace({
  template,
  activeFieldId,
  onSelectField,
  onUpdateFieldPosition,
  onUpdateQrPosition,
  onUpdateSigPosition,
  previewName,
  previewEvent,
  previewCollege,
  previewDate,
  previewOrganizer,
  previewCertId,
  qrCodeUrlDataUrl,
  onAddField,
  onAddHistory,
}: WorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Custom states for Place Anywhere & Dominant Download
  const [isAddTextMode, setIsAddTextMode] = useState(false);
  const [customFieldName, setCustomFieldName] = useState("INFO");
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState("");

  // Map placeholders to dynamic live text
  const getFieldText = (field: CertificateField) => {
    switch (field.name) {
      case "NAME":
        return previewName || "PARTICIPANT NAME";
      case "EVENT":
        return previewEvent || "Advanced AI Workshop";
      case "COLLEGE":
        return previewCollege || "Stanford University";
      case "DATE":
        return previewDate || "July 19, 2026";
      case "ORGANIZER":
        return previewOrganizer || "CertifyAI Committee";
      case "CERTIFICATE_ID":
        return previewCertId || "GSA-2026-0081";
      default:
        return field.placeholder; // fallback to {{FIELD}}
    }
  };

  // Drag logic for general fields
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    onSelectField(id);
    setDraggingId(id);

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const item = id === "qr-code" 
        ? template.qrCode 
        : id === "signature" 
        ? template.signature 
        : template.fields.find((f) => f.id === id);

      if (item) {
        // Convert percentage coordinate to absolute pixel coordinate
        const absX = rect.left + (item.x / 100) * rect.width;
        const absY = rect.top + (item.y / 100) * rect.height;
        setDragOffset({
          x: clientX - absX,
          y: clientY - absY,
        });
      }
    }
  };

  // Move effect
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingId || !containerRef.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rect = containerRef.current.getBoundingClientRect();

      // Calculate new position inside container bounds in pixels
      const newXPixels = clientX - rect.left - dragOffset.x;
      const newYPixels = clientY - rect.top - dragOffset.y;

      // Convert back to percentages (capped between 0 and 100)
      const pctX = Math.max(0, Math.min(100, (newXPixels / rect.width) * 100));
      const pctY = Math.max(0, Math.min(100, (newYPixels / rect.height) * 100));

      if (draggingId === "qr-code") {
        onUpdateQrPosition(pctX, pctY);
      } else if (draggingId === "signature") {
        onUpdateSigPosition(pctX, pctY);
      } else {
        onUpdateFieldPosition(draggingId, pctX, pctY);
      }
    };

    const handleEnd = () => {
      setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleMove, { passive: false });
      window.addEventListener("touchend", handleEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [draggingId, dragOffset, onUpdateFieldPosition, onUpdateQrPosition, onUpdateSigPosition]);

  // Handle click on canvas to reposition active field or drop custom text
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isAddTextMode) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const pctX = ((e.clientX - rect.left) / rect.width) * 100;
        const pctY = ((e.clientY - rect.top) / rect.height) * 100;
        const nameToUse = customFieldName.trim().toUpperCase() || "TEXT";
        if (onAddField) {
          onAddField(nameToUse, pctX, pctY);
        }
        setIsAddTextMode(false);
      }
      return;
    }

    if (activeFieldId && containerRef.current && !draggingId) {
      const rect = containerRef.current.getBoundingClientRect();
      const pctX = ((e.clientX - rect.left) / rect.width) * 100;
      const pctY = ((e.clientY - rect.top) / rect.height) * 100;
      onUpdateFieldPosition(activeFieldId, pctX, pctY);
    }
  };

  // Compile and generate high-resolution certificate for direct download
  const handleDominantDownload = async (format: "png" | "pdf") => {
    setDownloading(true);
    setDownloadStatus(format === "png" 
      ? "Generating master-grade high-resolution PNG file..." 
      : "Assembling professional print vector PDF file..."
    );

    try {
      // 1. Setup offscreen container at full landscape print scale
      const offscreen = document.createElement("div");
      offscreen.style.position = "absolute";
      offscreen.style.top = "-9999px";
      offscreen.style.left = "-9999px";
      offscreen.style.width = "1920px";
      offscreen.style.height = "1357px";
      offscreen.style.backgroundColor = "#fff";
      document.body.appendChild(offscreen);

      offscreen.innerHTML = `
        <div style="position: relative; width: 1920px; height: 1357px; overflow: hidden;">
          <img src="${template.imageSrc}" style="width: 1920px; height: 1357px; object-fit: contain;" />
          ${template.watermark.enabled && template.watermark.text ? `
            <div style="position: absolute; inset: 0; display: flex; items-center: center; justify-content: center; pointer-events: none; opacity: ${template.watermark.opacity}; transform: rotate(${template.watermark.rotation}deg); font-size: 110px; font-weight: 900; color: #000; font-family: Impact, sans-serif; letter-spacing: 0.5em; text-transform: uppercase;">
              ${template.watermark.text}
            </div>
          ` : ""}
        </div>
      `;

      const container = offscreen.firstElementChild as HTMLDivElement;

      // 2. Loop through all fields (including any dynamically added ones) and append them
      template.fields.forEach((field) => {
        const val = getFieldText(field);
        const style = field.style;
        let renderedFontSize = style.fontSize;
        if (field.name === "NAME") {
          renderedFontSize = style.fontSize * getSmartTextScale(val, 15);
        }

        const shadow = style.shadowBlur > 0
          ? `text-shadow: ${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor};`
          : "";

        const stroke = style.strokeWidth > 0
          ? `-webkit-text-stroke: ${style.strokeWidth}px ${style.strokeColor};`
          : "";

        const fieldEl = document.createElement("div");
        fieldEl.style.position = "absolute";
        fieldEl.style.left = `${field.x}%`;
        fieldEl.style.top = `${field.y}%`;
        fieldEl.style.width = `${field.width}%`;
        fieldEl.style.transform = `translate(-50%, -50%) rotate(${style.rotation}deg)`;
        fieldEl.style.fontFamily = style.fontFamily;
        fieldEl.style.fontSize = `${renderedFontSize * 1.5}px`; // offscreen viewport scaling offset
        fieldEl.style.fontWeight = style.isBold ? "bold" : style.fontWeight;
        fieldEl.style.fontStyle = style.isItalic ? "italic" : "normal";
        fieldEl.style.textDecoration = style.isUnderline ? "underline" : "none";
        fieldEl.style.color = style.fontColor;
        fieldEl.style.textAlign = style.alignment;
        fieldEl.style.letterSpacing = `${style.letterSpacing}px`;
        fieldEl.style.lineHeight = `${style.lineHeight}`;
        fieldEl.style.opacity = `${style.opacity}`;
        
        if (field.name === "SHAPE_CIRCLE") {
          fieldEl.innerHTML = `<div style="width: 100%; aspect-ratio: 1/1; border-radius: 50%; background-color: ${style.fontColor}; box-shadow: ${style.shadowBlur > 0 ? `0 0 ${style.shadowBlur}px ${style.shadowColor}` : "none"};"></div>`;
        } else if (field.name === "SHAPE_RECTANGLE") {
          fieldEl.innerHTML = `<div style="width: 100%; height: 60px; border-radius: 12px; background-color: ${style.fontColor}; box-shadow: ${style.shadowBlur > 0 ? `0 0 ${style.shadowBlur}px ${style.shadowColor}` : "none"};"></div>`;
        } else if (field.name === "SHAPE_ARROW") {
          fieldEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="${style.fontColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="width: 100%;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
        } else if (field.name.startsWith("EMOJI_") || field.name === "STICKER") {
          const emoji = val || "⭐";
          fieldEl.innerHTML = `<span style="font-size: 2.2em; line-height: 1;">${emoji}</span>`;
        } else if (field.name.startsWith("LOGO_") || field.name === "LOGO_IMAGE") {
          const src = field.placeholder.startsWith("{{") ? "https://img.icons8.com/color/120/google-logo.png" : field.placeholder;
          fieldEl.innerHTML = `<img src="${src}" style="width: 100%; height: auto; object-fit: contain;" />`;
        } else {
          fieldEl.innerText = formatFieldValue(val, style.textTransform);
          fieldEl.style.whiteSpace = "nowrap";
          fieldEl.style.overflow = "hidden";
          fieldEl.style.textOverflow = "ellipsis";
          if (shadow) fieldEl.style.cssText += shadow;
          if (stroke) fieldEl.style.cssText += stroke;
        }

        container.appendChild(fieldEl);
      });

      // 3. QR verification code image overlay
      if (template.qrCode.enabled && qrCodeUrlDataUrl) {
        const qrEl = document.createElement("img");
        qrEl.src = qrCodeUrlDataUrl;
        qrEl.style.position = "absolute";
        qrEl.style.left = `${template.qrCode.x}%`;
        qrEl.style.top = `${template.qrCode.y}%`;
        qrEl.style.width = `${template.qrCode.size}%`;
        qrEl.style.aspectRatio = "1/1";
        qrEl.style.transform = "translate(-50%, -50%)";
        container.appendChild(qrEl);
      }

      // 4. Digital signature image overlay
      if (template.signature.enabled && template.signature.imageSrc) {
        const sigEl = document.createElement("img");
        sigEl.src = template.signature.imageSrc;
        sigEl.style.position = "absolute";
        sigEl.style.left = `${template.signature.x}%`;
        sigEl.style.top = `${template.signature.y}%`;
        sigEl.style.width = `${template.signature.width}%`;
        sigEl.style.transform = `translate(-50%, -50%) rotate(${template.signature.rotation}deg)`;
        container.appendChild(sigEl);
      }

      // 5. Let offscreen content resolve fully, then snap via html2canvas
      setDownloadStatus("Polishing pixel matrices...");
      await new Promise((resolve) => setTimeout(resolve, 350));

      const canvas = await html2canvas(container, {
        scale: 1.5,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(offscreen);

      const nameSlug = (previewName || "Participant").trim().replace(/\s+/g, "_");

      if (format === "png") {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${nameSlug}_Certificate.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4"
        });
        const width = pdf.internal.pageSize.getWidth();
        const height = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, "PNG", 0, 0, width, height);
        pdf.save(`${nameSlug}_Certificate.pdf`);
      }

      // 6. Push verified logs record
      if (onAddHistory) {
        onAddHistory({
          id: Math.random().toString(),
          certificateId: previewCertId || `GSA-${Date.now().toString().slice(-4)}`,
          name: previewName || "PARTICIPANT",
          date: previewDate || "July 19, 2026",
          college: previewCollege || "Stanford University",
          event: previewEvent || "AI Program",
          organizer: previewOrganizer || "CertifyAI Committee",
          position: "Participant",
          year: "2026",
          generatedAt: new Date().toISOString(),
        });
      }

      setDownloadStatus("Successfully downloaded certificate! Registered in database registry.");
      setTimeout(() => setDownloadStatus(""), 4000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to render high-res image canvas. Please check external asset URLs.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 min-h-[500px] shadow-inner select-none transition-colors" id="editor-workspace">
      
      {/* Top bar instructions and "Click-to-Add-Text" button */}
      <div className="w-full max-w-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 px-2">
        <span className="flex items-center gap-1.5 font-medium">
          <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Click any placeholder to edit. Drag elements to place.</span>
        </span>
        
        <div className="flex items-center gap-2">
          {isAddTextMode && (
            <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-[11px] font-bold animate-pulse">
              <span>Text Placeholder Name:</span>
              <input 
                type="text" 
                value={customFieldName} 
                onChange={(e) => setCustomFieldName(e.target.value.toUpperCase())}
                placeholder="INFO"
                className="w-16 bg-white dark:bg-slate-900 border border-yellow-200 dark:border-yellow-900 px-1 py-0.5 rounded uppercase text-[10px] focus:outline-none focus:border-yellow-500 font-extrabold text-slate-800 dark:text-slate-100"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
          <button
            onClick={() => setIsAddTextMode(!isAddTextMode)}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isAddTextMode 
                ? "bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse" 
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddTextMode ? "Placing Mode (Click Canvas)" : "Place Text Anywhere ➕"}</span>
          </button>
        </div>
      </div>

      {/* Main Certificate Wrapper */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        className="relative w-full max-w-3xl aspect-[1.414/1] bg-white dark:bg-slate-900 shadow-2xl rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden cursor-crosshair"
        style={{ contentVisibility: "auto" }}
      >
        {/* Certificate Background */}
        <img
          src={template.imageSrc}
          alt="Certificate Template"
          className="w-full h-full object-contain pointer-events-none"
          referrerPolicy="no-referrer"
        />

        {/* Security Watermark layer */}
        {template.watermark.enabled && template.watermark.text && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              opacity: template.watermark.opacity,
              transform: `rotate(${template.watermark.rotation}deg)`,
              fontSize: "6vw",
              fontWeight: 900,
              color: "#000",
              fontFamily: "Impact, Charcoal, sans-serif",
              letterSpacing: "0.5em",
              textTransform: "uppercase"
            }}
          >
            {template.watermark.text}
          </div>
        )}

        {/* Dynamic Placeholders / Fields Overlay */}
        {template.fields.map((field) => {
          const isActive = field.id === activeFieldId;
          const style = field.style;
          const liveValue = getFieldText(field);

          // Apply Smart Text Scaling ONLY to NAME field
          let renderedFontSize = style.fontSize;
          if (field.name === "NAME") {
            const scale = getSmartTextScale(liveValue, 15);
            renderedFontSize = style.fontSize * scale;
          }

          // Convert absolute properties to inline CSS styles
          const textShadowStyle = style.shadowBlur > 0
            ? `${style.shadowOffsetX}px ${style.shadowOffsetY}px ${style.shadowBlur}px ${style.shadowColor}`
            : "none";

          const textStrokeStyle = style.strokeWidth > 0
            ? `${style.strokeWidth}px ${style.strokeColor}`
            : "none";

          return (
            <div
              key={field.id}
              id={`editor-field-${field.id}`}
              onMouseDown={(e) => handleDragStart(e, field.id)}
              onTouchStart={(e) => handleDragStart(e, field.id)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move select-none p-1 transition-shadow ${
                isActive
                  ? "ring-2 ring-blue-500 ring-dashed bg-blue-50/10 dark:bg-blue-500/5 shadow-md border border-blue-500/30"
                  : "hover:ring-1 hover:ring-slate-400 hover:ring-dashed"
              }`}
              style={{
                left: `${field.x}%`,
                top: `${field.y}%`,
                width: `${field.width}%`,
                zIndex: isActive ? 40 : 20,
              }}
            >
              <div
                className={`w-full overflow-hidden truncate`}
                style={{
                  fontFamily: style.fontFamily,
                  // We can use container-relative vw sizing for visual simulation
                  fontSize: `calc(${renderedFontSize} * 0.052vw)`, 
                  fontWeight: style.isBold ? "bold" : style.fontWeight,
                  fontStyle: style.isItalic ? "italic" : "normal",
                  textDecoration: style.isUnderline ? "underline" : "none",
                  color: style.fontColor,
                  textAlign: style.alignment,
                  letterSpacing: `${style.letterSpacing}px`,
                  lineHeight: style.lineHeight,
                  transform: `rotate(${style.rotation}deg)`,
                  opacity: style.opacity,
                  textShadow: textShadowStyle,
                  WebkitTextStroke: textStrokeStyle,
                  whiteSpace: "nowrap"
                }}
              >
                {(() => {
                  if (field.name === "SHAPE_CIRCLE") {
                    return (
                      <div 
                        style={{
                          width: "100%",
                          paddingTop: "100%", // aspect ratio 1:1
                          borderRadius: "50%",
                          backgroundColor: style.fontColor,
                          boxShadow: style.shadowBlur > 0 ? `0 0 ${style.shadowBlur}px ${style.shadowColor}` : "none"
                        }}
                      />
                    );
                  }
                  if (field.name === "SHAPE_RECTANGLE") {
                    return (
                      <div 
                        style={{
                          width: "100%",
                          height: "1.5vw", 
                          borderRadius: "4px",
                          backgroundColor: style.fontColor,
                          boxShadow: style.shadowBlur > 0 ? `0 0 ${style.shadowBlur}px ${style.shadowColor}` : "none"
                        }}
                      />
                    );
                  }
                  if (field.name === "SHAPE_ARROW") {
                    return (
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke={style.fontColor} 
                        strokeWidth="3.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        className="w-full"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    );
                  }
                  if (field.name.startsWith("EMOJI_") || field.name === "STICKER") {
                    return <span style={{ fontSize: "1.8vw" }}>{liveValue || "⭐"}</span>;
                  }
                  if (field.name.startsWith("LOGO_") || field.name === "LOGO_IMAGE") {
                    const src = field.placeholder.startsWith("{{") ? "https://img.icons8.com/color/120/google-logo.png" : field.placeholder;
                    return <img src={src} className="w-full h-auto object-contain" alt="Logo" referrerPolicy="no-referrer" />;
                  }
                  return formatFieldValue(liveValue, style.textTransform);
                })()}
              </div>

              {/* Active highlights */}
              {isActive && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none">
                  {field.name} {Math.round(field.x)}%, {Math.round(field.y)}%
                </span>
              )}
            </div>
          );
        })}

        {/* Draggable Verification QR Code Overlay */}
        {template.qrCode.enabled && qrCodeUrlDataUrl && (
          <div
            onMouseDown={(e) => handleDragStart(e, "qr-code")}
            onTouchStart={(e) => handleDragStart(e, "qr-code")}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move p-0.5 bg-white border ${
              activeFieldId === "qr-code" ? "ring-2 ring-blue-500 shadow-lg" : "border-slate-300 hover:ring-1 hover:ring-slate-400"
            }`}
            style={{
              left: `${template.qrCode.x}%`,
              top: `${template.qrCode.y}%`,
              width: `${template.qrCode.size}%`,
              aspectRatio: "1/1",
              zIndex: activeFieldId === "qr-code" ? 40 : 20,
            }}
          >
            <img
              src={qrCodeUrlDataUrl}
              alt="Verification QR Code"
              className="w-full h-full object-contain pointer-events-none"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500 bg-white/90 px-1 rounded pointer-events-none border whitespace-nowrap">
              QR CODE
            </span>
          </div>
        )}

        {/* Draggable Digital Signature Overlay */}
        {template.signature.enabled && template.signature.imageSrc && (
          <div
            onMouseDown={(e) => handleDragStart(e, "signature")}
            onTouchStart={(e) => handleDragStart(e, "signature")}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move p-0.5 ${
              activeFieldId === "signature" ? "ring-2 ring-blue-500 shadow-lg bg-blue-500/5" : "hover:ring-1 hover:ring-slate-400"
            }`}
            style={{
              left: `${template.signature.x}%`,
              top: `${template.signature.y}%`,
              width: `${template.signature.width}%`,
              zIndex: activeFieldId === "signature" ? 40 : 20,
              transform: `translate(-50%, -50%) rotate(${template.signature.rotation}deg)`
            }}
          >
            <img
              src={template.signature.imageSrc}
              alt="Signature"
              className="w-full h-auto pointer-events-none"
              referrerPolicy="no-referrer"
            />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-500 bg-white/90 px-1 rounded pointer-events-none border whitespace-nowrap">
              SIGNATURE
            </span>
          </div>
        )}

        {/* Click to Place Overlay */}
        {isAddTextMode && (
          <div className="absolute inset-0 bg-blue-600/15 backdrop-blur-[1.5px] flex flex-col items-center justify-center pointer-events-none z-50">
            <div className="bg-slate-900/90 text-white px-5 py-3 rounded-2xl flex items-center gap-2 shadow-xl border border-blue-500/30 text-xs font-bold animate-bounce">
              <Plus className="w-4 h-4 text-blue-400 fill-blue-400" />
              <span>Click anywhere on the certificate to drop your text "{customFieldName}"!</span>
            </div>
          </div>
        )}

      </div>

      {/* Bottom control hints */}
      <div className="w-full max-w-2xl flex items-center justify-center gap-6 mt-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border border-blue-500" />
          <span>Active Field</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 border border-dashed border-slate-400" />
          <span>Draggable Overlays</span>
        </span>
      </div>

      {/* 👑 DOMINANT PRO EXPORT & DOWNLOAD CONSOLE */}
      <div className="w-full max-w-3xl bg-gradient-to-r from-slate-900 to-slate-950 text-white p-6 mt-8 rounded-3xl border border-slate-800 shadow-2xl space-y-4 relative overflow-hidden" id="dominant-download-console">
        
        {/* Sparkle ambient background decorative element */}
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
          <Award className="w-48 h-48 stroke-[1]" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <h3 className="text-sm font-black tracking-tight uppercase text-slate-200">Dominant Export Console</h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Export this exact customized certificate in full high-resolution print format.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              disabled={downloading}
              onClick={() => handleDominantDownload("png")}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-emerald-950/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              id="dominant-download-png-btn"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download Ultra-Sharp PNG</span>
            </button>

            <button
              disabled={downloading}
              onClick={() => handleDominantDownload("pdf")}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:shadow-blue-950/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              id="dominant-download-pdf-btn"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>Download Print-Ready PDF</span>
            </button>
          </div>
        </div>

        {downloadStatus && (
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs font-medium flex items-center gap-2 animate-fadeIn">
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
            <span className="text-slate-300">{downloadStatus}</span>
          </div>
        )}
      </div>

    </div>
  );
}
