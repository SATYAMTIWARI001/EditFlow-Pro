import React, { useState } from "react";
import { CertificateTemplate, ParticipantRecord } from "../types";
import { formatFieldValue, getSmartTextScale, fetchRemoteImageAsDataUrl, ensureFontsLoaded } from "../lib/canvasUtils";
import Papa from "papaparse";
import JSZip from "jszip";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  Download,
  FileDown,
  Upload,
  Users,
  User,
  Plus,
  Trash2,
  FileText,
  CheckCircle,
  AlertCircle,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface BatchGeneratorProps {
  template: CertificateTemplate;
  // State from App.tsx
  previewName: string;
  setPreviewName: (v: string) => void;
  previewEvent: string;
  setPreviewEvent: (v: string) => void;
  previewCollege: string;
  setPreviewCollege: (v: string) => void;
  previewDate: string;
  setPreviewDate: (v: string) => void;
  previewOrganizer: string;
  setPreviewOrganizer: (v: string) => void;
  previewCertId: string;
  setPreviewCertId: (v: string) => void;
  qrCodeUrlDataUrl: string;
  participantRegistry?: ParticipantRecord[];
  // Callbacks
  onAddHistory: (record: ParticipantRecord) => void;
}

/**
 * Replaces mustache and named placeholders in template text with actual record data.
 */
export const replaceTemplatePlaceholders = (
  rawText: string,
  data: {
    name: string;
    event: string;
    college: string;
    date: string;
    organizer: string;
    certId: string;
    position?: string;
    year?: string;
    [key: string]: string | undefined;
  }
): string => {
  if (!rawText) return "";
  let val = rawText;

  val = val.replace(/\{\{\s*NAME\s*\}\}/gi, data.name || "");
  val = val.replace(/\{\{\s*EVENT\s*\}\}/gi, data.event || "");
  val = val.replace(/\{\{\s*COLLEGE\s*\}\}/gi, data.college || "");
  val = val.replace(/\{\{\s*DATE\s*\}\}/gi, data.date || "");
  val = val.replace(/\{\{\s*ORGANIZER\s*\}\}/gi, data.organizer || "");
  val = val.replace(/\{\{\s*CERTIFICATE_ID\s*\}\}/gi, data.certId || "");
  val = val.replace(/\{\{\s*CERT_ID\s*\}\}/gi, data.certId || "");
  val = val.replace(/\{\{\s*POSITION\s*\}\}/gi, data.position || "Participant");
  val = val.replace(/\{\{\s*YEAR\s*\}\}/gi, data.year || new Date().getFullYear().toString());

  return val;
};

/**
 * Iterates through the participant registry and generates a ZIP archive
 * containing individual PDFs for each record, ensuring all text placeholders
 * are correctly replaced before PDF generation.
 */
export const generateParticipantRegistryZip = async (
  records: ParticipantRecord[],
  template: CertificateTemplate,
  qrCodeUrlDataUrl: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<Blob> => {
  if (!records || records.length === 0) {
    throw new Error("Participant registry is empty. No records to generate.");
  }

  // Ensure all custom web fonts are fully loaded before rendering
  await ensureFontsLoaded();

  const zip = new JSZip();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const recordName = record.name || `Participant_${i + 1}`;
    const certId = record.certificateId || `ID_${i + 1}`;

    if (onProgress) {
      onProgress(i + 1, records.length, `Generating PDF ${i + 1} of ${records.length} for ${recordName}...`);
    }

    const recordData = {
      name: recordName,
      event: record.event || "Event",
      college: record.college || "Institution",
      date: record.date || new Date().toLocaleDateString(),
      organizer: record.organizer || "Organizer",
      certId: certId,
      position: record.position || "Participant",
      year: record.year || new Date().getFullYear().toString(),
    };

    // Pre-fetch remote images as base64 Data URLs to resolve CORS loading issues
    const bgDataUrl = await fetchRemoteImageAsDataUrl(template.imageSrc);
    const sigDataUrl = template.signature.enabled && template.signature.imageSrc 
      ? await fetchRemoteImageAsDataUrl(template.signature.imageSrc)
      : "";

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
        <img src="${bgDataUrl || template.imageSrc}" style="width: 1920px; height: 1357px; object-fit: contain;" />
        ${template.watermark.enabled && template.watermark.text ? `
          <div style="position: absolute; inset: 0; display: flex; items-center: center; justify-content: center; pointer-events: none; opacity: ${template.watermark.opacity}; transform: rotate(${template.watermark.rotation}deg); font-size: 110px; font-weight: 900; color: #000; font-family: Impact, sans-serif; letter-spacing: 0.5em; text-transform: uppercase;">
            ${template.watermark.text}
          </div>
        ` : ""}
      </div>
    `;

    const container = offscreen.firstElementChild as HTMLDivElement;

    // Replace placeholders for all fields
    template.fields.forEach((field) => {
      let rawVal = field.customText || field.placeholder || "";
      let val = replaceTemplatePlaceholders(rawVal, recordData);

      if (!val || val === field.placeholder || val.startsWith("{{")) {
        const fieldName = (field.name || "").toUpperCase();
        if (fieldName === "NAME" || fieldName.includes("NAME")) val = recordData.name;
        else if (fieldName === "EVENT" || fieldName.includes("EVENT") || fieldName.includes("TITLE")) val = recordData.event;
        else if (fieldName === "COLLEGE" || fieldName.includes("COLLEGE") || fieldName.includes("INSTITUTION")) val = recordData.college;
        else if (fieldName === "DATE" || fieldName.includes("DATE")) val = recordData.date;
        else if (fieldName === "ORGANIZER" || fieldName.includes("ORGANIZER")) val = recordData.organizer;
        else if (fieldName === "CERTIFICATE_ID" || fieldName.includes("CERT") || fieldName.includes("ID")) val = recordData.certId;
        else if (fieldName.includes("POSITION") || fieldName.includes("ROLE")) val = recordData.position;
        else if (fieldName.includes("YEAR")) val = recordData.year;
      }

      const style = field.style;
      let renderedFontSize = style.fontSize;
      if ((field.name || "").toUpperCase().includes("NAME")) {
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

    if (template.signature.enabled && (sigDataUrl || template.signature.imageSrc)) {
      const sigEl = document.createElement("img");
      sigEl.src = sigDataUrl || template.signature.imageSrc;
      sigEl.style.position = "absolute";
      sigEl.style.left = `${template.signature.x}%`;
      sigEl.style.top = `${template.signature.y}%`;
      sigEl.style.width = `${template.signature.width}%`;
      sigEl.style.transform = `translate(-50%, -50%) rotate(${template.signature.rotation}deg)`;
      container.appendChild(sigEl);
    }

    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        console.warn("Font loading wait warning:", e);
      }
    }

    const containerImgs = Array.from(container.querySelectorAll("img"));
    if (containerImgs.length > 0) {
      await Promise.all(
        containerImgs.map((img) => {
          if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 200));

    const canvas = await html2canvas(container, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      imageTimeout: 15000,
    });

    document.body.removeChild(offscreen);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "NONE");

    const pdfArrayBuffer = pdf.output("arraybuffer");

    const sanitizeName = recordName.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
    const sanitizeId = certId.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${sanitizeName}_${sanitizeId}.pdf`;

    zip.file(fileName, pdfArrayBuffer);
  }

  if (onProgress) {
    onProgress(records.length, records.length, "Compressing individual PDFs into ZIP file...");
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  return zipBlob;
};

export default function BatchGenerator({
  template,
  previewName,
  setPreviewName,
  previewEvent,
  setPreviewEvent,
  previewCollege,
  setPreviewCollege,
  previewDate,
  setPreviewDate,
  previewOrganizer,
  setPreviewOrganizer,
  previewCertId,
  setPreviewCertId,
  qrCodeUrlDataUrl,
  participantRegistry = [],
  onAddHistory,
}: BatchGeneratorProps) {
  const [activeTab, setActiveTab] = useState<"single" | "batch" | "registry">("single");
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>("");

  // Batch states
  const [batchData, setBatchData] = useState<any[]>([]);
  const [csvError, setCsvError] = useState<string>("");
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [batchTotal, setBatchTotal] = useState<number>(0);

  // Helper to generate unique certificate ID
  const handleGenerateId = async () => {
    try {
      const response = await fetch("/api/generate-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: "GSA" }),
      });
      const data = await response.json();
      if (data.certId) {
        setPreviewCertId(data.certId);
      }
    } catch (e) {
      // fallback local ID
      const random = Math.floor(1000 + Math.random() * 9000);
      setPreviewCertId(`GSA-${new Date().getFullYear()}-${random}`);
    }
  };

  // Helper to export offscreen container
  const renderOffscreenCanvas = async (data: {
    name: string;
    event: string;
    college: string;
    date: string;
    organizer: string;
    certId: string;
  }): Promise<HTMLCanvasElement> => {
    // 1. Create a hidden element
    const offscreen = document.createElement("div");
    offscreen.style.position = "absolute";
    offscreen.style.top = "-9999px";
    offscreen.style.left = "-9999px";
    offscreen.style.width = "1920px";
    offscreen.style.height = "1357px";
    offscreen.style.backgroundColor = "#fff";
    document.body.appendChild(offscreen);

    // 2. Add structural components
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

    // 3. Add fields
    template.fields.forEach((field) => {
      let val = field.placeholder;
      if (field.name === "NAME") val = data.name;
      else if (field.name === "EVENT") val = data.event;
      else if (field.name === "COLLEGE") val = data.college;
      else if (field.name === "DATE") val = data.date;
      else if (field.name === "ORGANIZER") val = data.organizer;
      else if (field.name === "CERTIFICATE_ID") val = data.certId;

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
      fieldEl.style.fontSize = `${renderedFontSize * 1.5}px`; // Scaling offset
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

    // 4. Add QR Code
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

    // 5. Add Signature
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

    // 6. Wait for images to load
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 7. Render
    const canvas = await html2canvas(container, {
      scale: 1.5, // Ultra sharp scale
      useCORS: true,
      logging: false,
    });

    // Cleanup
    document.body.removeChild(offscreen);
    return canvas;
  };

  // Export Individual Certificate (PNG/JPG)
  const handleExportImage = async (format: "png" | "jpeg") => {
    setExporting(true);
    setExportProgress(`Generating crisp high-resolution ${format.toUpperCase()}...`);
    try {
      const canvas = await renderOffscreenCanvas({
        name: previewName,
        event: previewEvent,
        college: previewCollege,
        date: previewDate,
        organizer: previewOrganizer,
        certId: previewCertId,
      });

      const dataUrl = canvas.toDataURL(`image/${format}`);
      const link = document.createElement("a");
      link.download = `${previewName.trim().replace(/\s+/g, "_")}_Certificate.${format}`;
      link.href = dataUrl;
      link.click();

      // Add to History
      onAddHistory({
        id: Math.random().toString(),
        certificateId: previewCertId,
        name: previewName,
        date: previewDate,
        college: previewCollege,
        event: previewEvent,
        organizer: previewOrganizer,
        position: "Participant",
        year: new Date().getFullYear().toString(),
        generatedAt: new Date().toLocaleString(),
      });
    } catch (e) {
      console.error(e);
      setExportProgress("Failed to export. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // Export Individual Certificate (PDF)
  const handleExportPdf = async () => {
    setExporting(true);
    setExportProgress("Compiling high-resolution vector PDF...");
    try {
      const canvas = await renderOffscreenCanvas({
        name: previewName,
        event: previewEvent,
        college: previewCollege,
        date: previewDate,
        organizer: previewOrganizer,
        certId: previewCertId,
      });

      const imgData = canvas.toDataURL("image/png");
      
      // A4 Landscape aspect ratio
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, width, height);

      const pdfArrayBuffer = pdf.output("arraybuffer");
      if (!pdfArrayBuffer || pdfArrayBuffer.byteLength < 100) {
        throw new Error("Batch PDF output binary is empty or invalid.");
      }

      console.log("[PDF Engine] Batch single certificate PDF compiled successfully. Size:", pdfArrayBuffer.byteLength);

      const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const filename = `${previewName.trim().replace(/\s+/g, "_")}_Certificate.pdf`;
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      console.log("[PDF Engine] Initiating download for batch certificate:", filename);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 10000);

      // Add to History
      onAddHistory({
        id: Math.random().toString(),
        certificateId: previewCertId,
        name: previewName,
        date: previewDate,
        college: previewCollege,
        event: previewEvent,
        organizer: previewOrganizer,
        position: "Participant",
        year: new Date().getFullYear().toString(),
        generatedAt: new Date().toLocaleString(),
      });
    } catch (e) {
      console.error(e);
      setExportProgress("Failed to compile PDF.");
    } finally {
      setExporting(false);
    }
  };

  // Parse Bulk CSV
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError("");
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setCsvError("Error parsing CSV format. Please double check values.");
            return;
          }
          const rows = results.data as any[];
          if (rows.length === 0) {
            setCsvError("No data rows found in the uploaded file.");
            return;
          }
          // Validate required 'Name' column
          const firstRowKeys = Object.keys(rows[0]);
          const hasName = firstRowKeys.some(k => k.toLowerCase() === "name");
          if (!hasName) {
            setCsvError("CSV must contain a 'Name' or 'name' column.");
            return;
          }

          // Populate missing fields with current layout defaults
          const sanitizedRows = rows.map((row, index) => {
            const rowKeys = Object.keys(row);
            const findVal = (keyNames: string[], defaultVal: string) => {
              const matchedKey = rowKeys.find(rk => keyNames.some(kn => kn.toLowerCase() === rk.toLowerCase()));
              return matchedKey ? row[matchedKey] : defaultVal;
            };

            const randomId = `GSA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            return {
              name: findVal(["name", "recipient", "participant"], `Participant ${index + 1}`),
              event: findVal(["event", "course", "workshop"], previewEvent),
              college: findVal(["college", "university", "school"], previewCollege),
              date: findVal(["date", "issue_date"], previewDate),
              organizer: findVal(["organizer", "leader"], previewOrganizer),
              certId: findVal(["id", "certificate_id", "cert_id"], randomId),
            };
          });

          setBatchData(sanitizedRows);
          setBatchTotal(sanitizedRows.length);
        }
      });
    }
  };

  // Generate Sample CSV
  const downloadSampleCsv = () => {
    const csvContent = "Name,Event,College,Date,Organizer,Certificate_ID\nRahul Sharma,Web Development,Stanford University,July 19 2026,Ambassador Admin,GSA-2026-0091\nPriya Singh,Mobile Dev Course,Stanford University,July 19 2026,Ambassador Admin,GSA-2026-0092\nSatyam Tiwari,Cloud Infrastructure,Stanford University,July 19 2026,Ambassador Admin,GSA-2026-0093";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "certifyai_sample.csv";
    link.click();
  };

  // Batch Export to ZIP
  const handleBatchExportZip = async () => {
    if (batchData.length === 0) return;
    setExporting(true);
    setBatchProgress(0);
    const zip = new JSZip();

    try {
      for (let i = 0; i < batchData.length; i++) {
        const row = batchData[i];
        setExportProgress(`Generating certificate ${i + 1} of ${batchData.length} (Participant: ${row.name})...`);
        setBatchProgress(i + 1);

        const canvas = await renderOffscreenCanvas(row);
        const imgData = canvas.toDataURL("image/png").split(",")[1]; // Get pure base64 binary payload
        
        const fileName = `${row.name.trim().replace(/\s+/g, "_")}_${row.certId}.png`;
        zip.file(fileName, imgData, { base64: true });

        // Add each to log history
        onAddHistory({
          id: Math.random().toString(),
          certificateId: row.certId,
          name: row.name,
          date: row.date,
          college: row.college,
          event: row.event,
          organizer: row.organizer,
          position: "Participant",
          year: new Date().getFullYear().toString(),
          generatedAt: new Date().toLocaleString(),
        });
      }

      setExportProgress("Compressing and packing into single ZIP...");
      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `CertifyAI_Batch_${template.name.trim().replace(/\s+/g, "_")}.zip`;
      link.click();
    } catch (e) {
      console.error(e);
      setExportProgress("An error occurred during batch generation.");
    } finally {
      setExporting(false);
      setBatchProgress(0);
    }
  };

  // Handler to trigger ZIP download of individual PDFs for participant registry
  const handleTriggerRegistryPdfZip = async () => {
    if (!participantRegistry || participantRegistry.length === 0) {
      setCsvError("No participant registry records available to process.");
      return;
    }

    setExporting(true);
    setBatchProgress(0);
    setBatchTotal(participantRegistry.length);
    setCsvError("");

    try {
      const zipBlob = await generateParticipantRegistryZip(
        participantRegistry,
        template,
        qrCodeUrlDataUrl,
        (curr, tot, msg) => {
          setBatchProgress(curr);
          setExportProgress(msg);
        }
      );

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      const tName = (template.name || "Registry").trim().replace(/\s+/g, "_");
      link.download = `${tName}_Participant_PDFs.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setExportProgress("Registry PDF ZIP successfully downloaded!");
    } catch (err: any) {
      console.error("Registry PDF export error:", err);
      setCsvError(err.message || "Failed to generate registry PDF ZIP.");
    } finally {
      setExporting(false);
      setBatchProgress(0);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-colors" id="batch-generator-root">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 pb-3 gap-6">
        <button
          onClick={() => setActiveTab("single")}
          className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "single"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <User className="w-4 h-4" />
          Single Participant
        </button>
        <button
          onClick={() => setActiveTab("batch")}
          className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "batch"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Users className="w-4 h-4" />
          Batch CSV Mode
        </button>
        <button
          onClick={() => setActiveTab("registry")}
          className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "registry"
              ? "border-blue-600 text-blue-600 dark:text-blue-400"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <FileDown className="w-4 h-4" />
          Registry PDF Batch ({participantRegistry.length})
        </button>
      </div>

      {/* SINGLE FORM TAB */}
      {activeTab === "single" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Participant Name</label>
              <input
                type="text"
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
                placeholder="SATYAM TIWARI"
                className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Event / Title</label>
              <input
                type="text"
                value={previewEvent}
                onChange={(e) => setPreviewEvent(e.target.value)}
                placeholder="Google Student Ambassador DevFest"
                className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">College / Institution</label>
              <input
                type="text"
                value={previewCollege}
                onChange={(e) => setPreviewCollege(e.target.value)}
                placeholder="Stanford University"
                className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Issue Date</label>
              <input
                type="text"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
                placeholder="July 19, 2026"
                className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Organizer Name / Title</label>
              <input
                type="text"
                value={previewOrganizer}
                onChange={(e) => setPreviewOrganizer(e.target.value)}
                placeholder="Satyam Prakash Tiwari"
                className="w-full px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Verification Certificate ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={previewCertId}
                  onChange={(e) => setPreviewCertId(e.target.value)}
                  placeholder="GSA-2026-0001"
                  className="flex-1 px-4 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
                />
                <button
                  type="button"
                  onClick={handleGenerateId}
                  className="px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
                  title="Generate Unique Verification ID"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Export individual action buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-slate-400">Generate high-resolution files instantly with no loss of text quality.</p>
            
            <div className="flex flex-wrap gap-2">
              <button
                disabled={exporting}
                onClick={() => handleExportImage("png")}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>
              <button
                disabled={exporting}
                onClick={() => handleExportImage("jpeg")}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JPG</span>
              </button>
              <button
                disabled={exporting}
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm shadow-blue-100 dark:shadow-none transition-all flex-shrink-0"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF Print</span>
              </button>
            </div>
          </div>

          {exporting && (
            <div className="flex items-center gap-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs font-semibold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{exportProgress}</span>
            </div>
          )}
        </div>
      )}

      {/* BATCH CSV TAB */}
      {activeTab === "batch" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Bulk Generation via CSV</h3>
              <p className="text-xs text-slate-400 mt-0.5">Upload a spreadsheet table to generate hundreds of certificates in seconds.</p>
            </div>
            <button
              onClick={downloadSampleCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Upload panel */}
          {batchData.length === 0 ? (
            <label className="flex flex-col items-center justify-center p-10 bg-slate-50/50 dark:bg-slate-950/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-blue-500 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Click to upload spreadsheet</span>
              <span className="text-[10px] text-slate-400 mt-1">Accepts standard .csv files with reciepient Names</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-4">
              {/* Parse list status */}
              <div className="flex items-center justify-between bg-green-50/40 dark:bg-green-950/10 border border-green-100 dark:border-green-900/30 p-3 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Parsed {batchData.length} participant rows successfully! Ready for generation.</span>
                </div>
                <button
                  onClick={() => setBatchData([])}
                  className="text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear list
                </button>
              </div>

              {/* Data Table Grid */}
              <div className="overflow-x-auto max-h-[220px] rounded-xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                      <th className="p-3">#</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Event</th>
                      <th className="p-3">College</th>
                      <th className="p-3">Certificate ID</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchData.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{row.name}</td>
                        <td className="p-3 text-slate-500 line-clamp-1">{row.event}</td>
                        <td className="p-3 text-slate-500">{row.college}</td>
                        <td className="p-3 font-mono text-slate-400">{row.certId}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setBatchData(batchData.filter((_, i) => i !== idx))}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Generate button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                <p className="text-[11px] text-slate-400">
                  Click generate to package all certificates as compressed PNG files inside a high-resolution ZIP archive.
                </p>

                <button
                  disabled={exporting}
                  onClick={handleBatchExportZip}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-100 dark:shadow-none transition-all hover:-translate-y-0.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Batch ({batchData.length})</span>
                </button>
              </div>
            </div>
          )}

          {csvError && (
            <div className="flex items-center gap-2 p-3 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{csvError}</span>
            </div>
          )}

          {exporting && (
            <div className="space-y-2 p-4 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs font-semibold">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{exportProgress}</span>
              </div>
              {batchTotal > 0 && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-150" 
                    style={{ width: `${(batchProgress / batchTotal) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* REGISTRY PDF BATCH TAB */}
      {activeTab === "registry" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Participant Registry PDF Batch Export
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate individual PDF certificates for all records in the participant registry. All placeholders will be auto-replaced before compilation into a ZIP archive.
              </p>
            </div>
            <button
              disabled={exporting || participantRegistry.length === 0}
              onClick={handleTriggerRegistryPdfZip}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-blue-100 dark:shadow-none transition-all"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Registry PDFs (.zip)</span>
            </button>
          </div>

          {participantRegistry.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-800">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No participant records in registry yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Generate individual certificates or upload CSV data to populate the registry.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[260px] rounded-xl border border-slate-100 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/30 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                    <th className="p-3">#</th>
                    <th className="p-3">Certificate ID</th>
                    <th className="p-3">Participant Name</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">College</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {participantRegistry.map((rec, idx) => (
                    <tr key={rec.id || idx} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900">
                      <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-400 font-bold">{rec.certificateId}</td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{rec.name}</td>
                      <td className="p-3 text-slate-500">{rec.event}</td>
                      <td className="p-3 text-slate-500">{rec.college}</td>
                      <td className="p-3 text-slate-400">{rec.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {csvError && (
            <div className="flex items-center gap-2 p-3 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{csvError}</span>
            </div>
          )}

          {exporting && (
            <div className="space-y-2 p-4 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-xl text-xs font-semibold">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>{exportProgress}</span>
              </div>
              {batchTotal > 0 && (
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-150" 
                    style={{ width: `${(batchProgress / batchTotal) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
