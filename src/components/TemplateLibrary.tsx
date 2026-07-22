import React, { useState, useEffect } from "react";
import { CertificateTemplate, ParticipantRecord } from "../types";
import { Plus, Trash2, Copy, FileDown, FileUp, Sparkles, Award, Zap, Download, RefreshCw, CheckCircle } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { generateQRCodeDataUrl, formatFieldValue, getSmartTextScale } from "../lib/canvasUtils";

interface TemplateLibraryProps {
  templates: CertificateTemplate[];
  activeTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onUploadTemplate: (file: File) => void;
  onDeleteTemplate: (id: string) => void;
  onDuplicateTemplate: (id: string) => void;
  onExportTemplate: (template: CertificateTemplate) => void;
  onImportTemplate: (file: File) => void;
  onAddHistory: (record: ParticipantRecord) => void;
}

export default function TemplateLibrary({
  templates,
  activeTemplateId,
  onSelectTemplate,
  onUploadTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  onExportTemplate,
  onImportTemplate,
  onAddHistory,
}: TemplateLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const categories = ["All", "Hackathon", "Workshop", "Internship", "Google Student Ambassador", "Winner", "Participation", "Volunteer", "Completion"];

  // Quick Direct Download console states
  const [quickName, setQuickName] = useState("");
  const [quickTemplateId, setQuickTemplateId] = useState<string>("");
  const [quickGenerating, setQuickGenerating] = useState(false);
  const [quickStatus, setQuickStatus] = useState("");

  useEffect(() => {
    if (templates.length > 0 && !quickTemplateId) {
      setQuickTemplateId(templates[0].id);
    }
  }, [templates, quickTemplateId]);

  const handleQuickDownload = async (format: "png" | "pdf") => {
    if (!quickName.trim()) {
      setQuickStatus("Please enter a participant name to generate your certificate.");
      return;
    }
    const selectedTpl = templates.find((t) => t.id === quickTemplateId);
    if (!selectedTpl) {
      setQuickStatus("Please select a certificate template model first.");
      return;
    }

    setQuickGenerating(true);
    setQuickStatus("Crafting high-resolution canvas with vector text...");

    try {
      // 1. Render QR Code if enabled
      let qrCodeDataUrl = "";
      if (selectedTpl.qrCode.enabled && selectedTpl.qrCode.url) {
        setQuickStatus("Generating unique QR verification secure link...");
        qrCodeDataUrl = await generateQRCodeDataUrl(selectedTpl.qrCode.url);
      }

      // 2. Generate a unique Certificate ID
      const randomId = `GSA-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Create offscreen container
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
          <img src="${selectedTpl.imageSrc}" style="width: 1920px; height: 1357px; object-fit: contain;" />
          ${selectedTpl.watermark.enabled && selectedTpl.watermark.text ? `
            <div style="position: absolute; inset: 0; display: flex; items-center: center; justify-content: center; pointer-events: none; opacity: ${selectedTpl.watermark.opacity}; transform: rotate(${selectedTpl.watermark.rotation}deg); font-size: 110px; font-weight: 900; color: #000; font-family: Impact, sans-serif; letter-spacing: 0.5em; text-transform: uppercase;">
              ${selectedTpl.watermark.text}
            </div>
          ` : ""}
        </div>
      `;

      const container = offscreen.firstElementChild as HTMLDivElement;

      // 4. Inject styled elements/placeholders
      selectedTpl.fields.forEach((field) => {
        let val = field.placeholder;
        if (field.name === "NAME") val = quickName;
        else if (field.name === "EVENT") val = selectedTpl.category === "Winner" ? "Global DevFest Hackathon" : "Google Student Ambassador Program";
        else if (field.name === "COLLEGE") val = "Stanford University";
        else if (field.name === "DATE") val = "July 19, 2026";
        else if (field.name === "ORGANIZER") val = "Google Dev Committee";
        else if (field.name === "CERTIFICATE_ID") val = randomId;

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
        fieldEl.style.fontSize = `${renderedFontSize * 1.5}px`;
        fieldEl.style.fontWeight = style.isBold ? "bold" : style.fontWeight;
        fieldEl.style.fontStyle = style.isItalic ? "italic" : "normal";
        fieldEl.style.textDecoration = style.isUnderline ? "underline" : "none";
        fieldEl.style.color = style.fontColor;
        fieldEl.style.textAlign = style.alignment;
        fieldEl.style.letterSpacing = `${style.letterSpacing}px`;
        fieldEl.style.lineHeight = `${style.lineHeight}`;
        fieldEl.style.opacity = `${style.opacity}`;
        fieldEl.style.whiteSpace = "nowrap";
        fieldEl.style.overflow = "hidden";
        fieldEl.style.textOverflow = "ellipsis";
        
        fieldEl.innerText = formatFieldValue(val, style.textTransform);
        if (shadow) fieldEl.style.cssText += shadow;
        if (stroke) fieldEl.style.cssText += stroke;

        container.appendChild(fieldEl);
      });

      // 5. Inject QR code
      if (selectedTpl.qrCode.enabled && qrCodeDataUrl) {
        const qrEl = document.createElement("img");
        qrEl.src = qrCodeDataUrl;
        qrEl.style.position = "absolute";
        qrEl.style.left = `${selectedTpl.qrCode.x}%`;
        qrEl.style.top = `${selectedTpl.qrCode.y}%`;
        qrEl.style.width = `${selectedTpl.qrCode.size}%`;
        qrEl.style.aspectRatio = "1/1";
        qrEl.style.transform = "translate(-50%, -50%)";
        container.appendChild(qrEl);
      }

      // 6. Inject Signature
      if (selectedTpl.signature.enabled && selectedTpl.signature.imageSrc) {
        const sigEl = document.createElement("img");
        sigEl.src = selectedTpl.signature.imageSrc;
        sigEl.style.position = "absolute";
        sigEl.style.left = `${selectedTpl.signature.x}%`;
        sigEl.style.top = `${selectedTpl.signature.y}%`;
        sigEl.style.width = `${selectedTpl.signature.width}%`;
        sigEl.style.transform = `translate(-50%, -50%) rotate(${selectedTpl.signature.rotation}deg)`;
        container.appendChild(sigEl);
      }

      setQuickStatus("Compressing high-definition images...");
      await new Promise((resolve) => setTimeout(resolve, 300));

      const canvas = await html2canvas(container, {
        scale: 1.5,
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(offscreen);

      // Trigger automatic direct browser file download
      if (format === "png") {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${quickName.trim().replace(/\s+/g, "_")}_Certificate.png`;
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
        pdf.save(`${quickName.trim().replace(/\s+/g, "_")}_Certificate.pdf`);
      }

      // Add record to registry logs for full active validation
      onAddHistory({
        id: Math.random().toString(),
        certificateId: randomId,
        name: quickName.trim().toUpperCase(),
        date: "July 19, 2026",
        college: "Stanford University",
        event: selectedTpl.category === "Winner" ? "Global DevFest Hackathon" : "Google Student Ambassador Program",
        organizer: "Google Dev Committee",
        position: "Participant",
        year: "2026",
        generatedAt: new Date().toISOString(),
      });

      setQuickStatus("Downloaded successfully! Registered in registry database.");
      setQuickName(""); // Clear name input for next issue
      setTimeout(() => setQuickStatus(""), 4000);
    } catch (e: any) {
      console.error(e);
      setQuickStatus("Failed to compile certificate. Please try again.");
    } finally {
      setQuickGenerating(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory === "All") return true;
    return t.category === selectedCategory;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        setQuickStatus("File is too large! Maximum size allowed is 20MB.");
        return;
      }
      onUploadTemplate(file);
    }
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportTemplate(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6" id="template-library-container">
      {/* ⚡ DIRECT NAME & DOWNLOAD CONSOLE */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-950/40 dark:to-slate-900/40 p-6 rounded-3xl border border-blue-100/60 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Instant Name & Certificate Download</h2>
            <p className="text-[11px] text-slate-400 font-medium">Type a participant's name to generate and download their credentials immediately.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          
          {/* Template select dropdown */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">1. Choose Template</label>
            <select
              value={quickTemplateId}
              onChange={(e) => setQuickTemplateId(e.target.value)}
              className="w-full px-4 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300 shadow-xs"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </select>
          </div>

          {/* Participant Name Input */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">2. Recipient Name</label>
            <input
              type="text"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="Enter full name (e.g. SATYAM TIWARI)"
              className="w-full px-4 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300 shadow-xs"
            />
          </div>

          {/* Direct Download Action Button */}
          <div className="md:col-span-4 flex gap-2">
            <button
              disabled={quickGenerating}
              onClick={() => handleQuickDownload("png")}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Direct PNG</span>
            </button>
            <button
              disabled={quickGenerating}
              onClick={() => handleQuickDownload("pdf")}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-100 dark:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Direct PDF</span>
            </button>
          </div>

        </div>

        {/* Loading status or success feedback */}
        {quickStatus && (
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
            quickStatus.includes("successfully")
              ? "bg-green-50/50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30"
              : "bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40 animate-pulse"
          }`}>
            {quickStatus.includes("successfully") ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
            )}
            <span>{quickStatus}</span>
          </div>
        )}
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              id={`cat-btn-${category.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${
                selectedCategory === category
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-none"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Buttons for imports/new template */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer transition-all border border-slate-200 dark:border-slate-700">
            <FileUp className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Template</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportChange}
              className="hidden"
            />
          </label>

          <label className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer shadow-md shadow-blue-100 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            <span>Upload Custom (PNG/JPG)</span>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Grid listing */}
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <Award className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No templates found in this category.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Upload a custom image or select another filter!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const isActive = activeTemplateId === template.id;
            return (
              <div
                key={template.id}
                id={`tpl-card-${template.id}`}
                className={`group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isActive
                    ? "border-blue-500 shadow-lg shadow-blue-50/50 dark:shadow-none ring-2 ring-blue-500/10"
                    : "border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700"
                }`}
              >
                {/* Thumbnail Preview container */}
                <div 
                  onClick={() => onSelectTemplate(template.id)}
                  className="relative aspect-[1.414/1] bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-pointer"
                >
                  <img
                    src={template.imageSrc}
                    alt={template.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Overlay badge */}
                  <span className="absolute top-3 left-3 bg-slate-900/85 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-xs">
                    {template.category}
                  </span>

                  {template.isUserUploaded && (
                    <span className="absolute top-3 right-3 bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      My Design
                    </span>
                  )}

                  {/* Quick Select overlay */}
                  <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold px-4 py-2 rounded-xl shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
                      Edit Layout
                    </button>
                  </div>
                </div>

                {/* Info and Actions */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
                        {template.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {template.fields.length} Placeholders configured
                      </p>
                    </div>
                  </div>

                  {/* Actions list */}
                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/80 mt-4 pt-3 gap-2">
                    <button
                      onClick={() => onSelectTemplate(template.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                          : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                      }`}
                    >
                      Configure Layout
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        title="Duplicate template layout"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateTemplate(template.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Export Template layout configuration"
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportTemplate(template);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      {template.isUserUploaded && (
                        <button
                          title="Delete template"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTemplate(template.id);
                          }}
                          className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
