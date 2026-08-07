import React, { useState } from "react";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import Tesseract from "tesseract.js";
import { 
  FileText, 
  Merge, 
  Scissors, 
  RotateCw, 
  Eye, 
  Sparkles, 
  Upload, 
  Trash2, 
  Download, 
  Languages, 
  Loader2, 
  Bot, 
  MessageSquare, 
  Send,
  CheckCircle2,
  FileCheck,
  Search,
  BookOpen
} from "lucide-react";
import AcrobatStudio from "./AcrobatStudio";

export default function PdfSuite() {
  const [activeSubTab, setActiveSubTab] = useState<"edit" | "merge" | "split" | "rotate" | "ocr" | "summary">("edit");

  // --- MERGE STATE ---
  const [mergeFiles, setMergeFiles] = useState<{ name: string; arrayBuffer: ArrayBuffer }[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergeStatus, setMergeStatus] = useState("");

  // --- SPLIT STATE ---
  const [splitFile, setSplitFile] = useState<{ name: string; arrayBuffer: ArrayBuffer } | null>(null);
  const [splitRange, setSplitRange] = useState("1");
  const [splitting, setSplitting] = useState(false);
  const [splitStatus, setSplitStatus] = useState("");

  // --- ROTATE STATE ---
  const [rotateFile, setRotateFile] = useState<{ name: string; arrayBuffer: ArrayBuffer } | null>(null);
  const [rotateAngle, setRotateAngle] = useState(90);
  const [rotating, setRotating] = useState(false);
  const [rotateStatus, setRotateStatus] = useState("");

  // --- OCR STATE ---
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrLang, setOcrLang] = useState("eng");
  const [ocrRunning, setOcrRunning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState("");

  // --- SUMMARY / CHAT STATE ---
  const [docTextForAi, setDocTextForAi] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "ai"; message: string }[]>([]);
  const [chatting, setChatting] = useState(false);

  // --- UTILS FOR FILE LOAD ---
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "merge" | "split" | "rotate") => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file: any) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        if (target === "merge") {
          setMergeFiles((prev: any) => [...prev, { name: file.name, arrayBuffer }]);
        } else if (target === "split") {
          setSplitFile({ name: file.name, arrayBuffer });
        } else if (target === "rotate") {
          setRotateFile({ name: file.name, arrayBuffer });
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleOcrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setOcrImage(reader.result as string);
        setOcrResult("");
      };
      reader.readAsDataURL(file);
    }
  };

  // --- PDF MERGE IMPLEMENTATION (REAL ALGORITHM) ---
  const executeMerge = async () => {
    if (mergeFiles.length < 2) {
      setMergeStatus("Please upload at least 2 PDF files to merge.");
      return;
    }
    setMerging(true);
    setMergeStatus("Parsing document schemas...");
    try {
      const mergedPdf = await PDFDocument.create();
      for (const fileObj of mergeFiles) {
        setMergeStatus(`Merging pages from ${fileObj.name}...`);
        const srcPdf = await PDFDocument.load(fileObj.arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      setMergeStatus("Encoding PDF streams...");
      const pdfBytes = await mergedPdf.save();
      if (!pdfBytes || pdfBytes.byteLength < 100) {
        throw new Error("Merged PDF buffer is empty or corrupted.");
      }

      console.log("[PDF Engine] Successfully generated merged PDF, size:", pdfBytes.byteLength, "bytes");
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `merged_document_${Date.now()}.pdf`;
      document.body.appendChild(link);
      console.log("[PDF Engine] Initiating download for merged PDF...");
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setMergeStatus("Successfully merged & downloaded!");
    } catch (err: any) {
      console.error(err);
      setMergeStatus("Error merging PDFs: " + err.message);
    } finally {
      setMerging(false);
    }
  };

  // --- PDF SPLIT IMPLEMENTATION (REAL ALGORITHM) ---
  const executeSplit = async () => {
    if (!splitFile) return;
    setSplitting(true);
    setSplitStatus("Reading PDF pages...");
    try {
      const srcPdf = await PDFDocument.load(splitFile.arrayBuffer);
      const totalPages = srcPdf.getPageCount();

      // parse user range input like "1, 2-3"
      const indicesToExtract: number[] = [];
      const parts = splitRange.split(",");
      for (let part of parts) {
        part = part.trim();
        if (part.includes("-")) {
          const [startStr, endStr] = part.split("-");
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end)) {
            for (let i = start; i <= end; i++) {
              if (i >= 1 && i <= totalPages) indicesToExtract.push(i - 1);
            }
          }
        } else {
          const single = parseInt(part, 10);
          if (!isNaN(single) && single >= 1 && single <= totalPages) {
            indicesToExtract.push(single - 1);
          }
        }
      }

      if (indicesToExtract.length === 0) {
        setSplitStatus(`Invalid page range or page index out of range (Total pages: ${totalPages})`);
        setSplitting(false);
        return;
      }

      setSplitStatus(`Extracting ${indicesToExtract.length} pages...`);
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(srcPdf, indicesToExtract);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      if (!pdfBytes || pdfBytes.byteLength < 100) {
        throw new Error("Split PDF buffer is empty or corrupted.");
      }

      console.log("[PDF Engine] Split PDF generated successfully, size:", pdfBytes.byteLength, "bytes");
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `split_extracted_${Date.now()}.pdf`;
      document.body.appendChild(link);
      console.log("[PDF Engine] Initiating download for split PDF...");
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setSplitStatus("Split successfully! Check your downloads.");
    } catch (err: any) {
      console.error(err);
      setSplitStatus("Split failed: " + err.message);
    } finally {
      setSplitting(false);
    }
  };

  // --- PDF ROTATION (REAL ALGORITHM) ---
  const executeRotation = async () => {
    if (!rotateFile) return;
    setRotating(true);
    setRotateStatus("Modifying page coordinate system...");
    try {
      const srcPdf = await PDFDocument.load(rotateFile.arrayBuffer);
      const pages = srcPdf.getPages();
      
      // Rotate all pages by selected angle
      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotateAngle) % 360));
      });

      setRotateStatus("Compressing visual layers...");
      const pdfBytes = await srcPdf.save();
      if (!pdfBytes || pdfBytes.byteLength < 100) {
        throw new Error("Rotated PDF buffer is empty or corrupted.");
      }

      console.log("[PDF Engine] Rotated PDF compiled successfully, size:", pdfBytes.byteLength, "bytes");
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `rotated_document_${Date.now()}.pdf`;
      document.body.appendChild(link);
      console.log("[PDF Engine] Initiating download for rotated PDF...");
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setRotateStatus("Rotated and compiled successfully!");
    } catch (err: any) {
      console.error(err);
      setRotateStatus("Rotation failed: " + err.message);
    } finally {
      setRotating(false);
    }
  };

  // --- REAL CLIENT-SIDE OCR (TESSERACT.JS) ---
  const runOcr = async () => {
    if (!ocrImage) return;
    setOcrRunning(true);
    setOcrProgress(30);
    setOcrResult("Scanning character matrices...");

    try {
      const { data: { text } } = await Tesseract.recognize(
        ocrImage,
        ocrLang,
        {
          logger: (m: any) => {
            if (m.status === "recognizing text") {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      setOcrProgress(100);
      setOcrResult(text || "No text could be extracted from this image.");
      setDocTextForAi(text); // feed automatically to AI summarizer!
    } catch (err: any) {
      console.error(err);
      setOcrResult("Error running OCR: " + err.message);
    } finally {
      setOcrRunning(false);
    }
  };

  // --- REAL SERVER-SIDE GEMINI API SUMMARY & CHAT ---
  const handleAiSummarize = async () => {
    const textToSummarize = docTextForAi || ocrResult;
    if (!textToSummarize.trim()) {
      setAiSummary("Please provide some document text or run OCR first to extract text!");
      return;
    }

    setSummarizing(true);
    setAiSummary("");
    try {
      const res = await fetch("/api/ai-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: `Please provide a high-level summary, structural outline, and bulleted key takeaways for the following document text. Format with beautiful markdown headers:\n\n${textToSummarize}`,
          template: { fields: [], qrCode: { enabled: false }, signature: { enabled: false }, watermark: { enabled: false } }
        })
      });

      const json = await res.json();
      if (json.error) throw new Error(json.error);
      
      // Since it returns template fields in regular parse, let's create a specialized summarizer endpoint, or use the existing command parser text field
      // Wait! We can add a custom API route /api/summarize in server.ts to handle text summaries perfectly!
      // Let's create a dedicated summarize route, but for now we can call /api/ai-command or write a clean text processor. 
      // Let's check how we can read the raw Gemini result from /api/ai-command or fetch directly from our new server endpoint!
    } catch (err: any) {
      console.error(err);
    }

    // Let's create a proper server-side summarize and chat endpoint. It's much cleaner!
    // But we can also make a fetch to '/api/doc-summary'! Let's implement that backend route in server.ts as well.
    // For now, let's write the complete, clean frontend handler for `/api/doc-summary` and `/api/doc-chat`.
  };

  const triggerRealSummarize = async () => {
    const finalTxt = docTextForAi.trim() || ocrResult.trim();
    if (!finalTxt) {
      setAiSummary("Please write, paste or OCR-extract some document text first.");
      return;
    }
    setSummarizing(true);
    setAiSummary("");

    try {
      const res = await fetch("/api/doc-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalTxt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to summarize.");
      setAiSummary(data.summary);
      setChatHistory([
        { sender: "ai", message: "Hi! I have analyzed your document and created a summary. Ask me anything about it!" }
      ]);
    } catch (err: any) {
      setAiSummary(`Failed to summarize: ${err.message}`);
    } finally {
      setSummarizing(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatting) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { sender: "user", message: userMsg }]);
    setChatting(true);

    try {
      const contextTxt = docTextForAi || ocrResult || aiSummary;
      const res = await fetch("/api/doc-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: contextTxt,
          question: userMsg,
          history: chatHistory.map(h => `${h.sender === "user" ? "User" : "AI"}: ${h.message}`).join("\n")
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to respond.");
      setChatHistory(prev => [...prev, { sender: "ai", message: data.response }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { sender: "ai", message: `Sorry, I hit an error: ${err.message}` }]);
    } finally {
      setChatting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      
      {/* Sub tabs header */}
      <div className="flex border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/25 p-2 gap-1 overflow-x-auto scrollbar-none">
        {[
          { id: "edit", label: "Acrobat & Word Studio", icon: Sparkles, color: "text-red-500 animate-pulse" },
          { id: "merge", label: "Merge PDFs", icon: Merge, color: "text-blue-500" },
          { id: "split", label: "Split PDF Pages", icon: Scissors, color: "text-indigo-500" },
          { id: "rotate", label: "Rotate PDF", icon: RotateCw, color: "text-amber-500" },
          { id: "ocr", label: "AI Optical Character Recognition (OCR)", icon: Eye, color: "text-emerald-500" },
          { id: "summary", label: "AI Document Summary & Chat", icon: Bot, color: "text-purple-500" },
        ].map((sub) => {
          const Icon = sub.icon;
          const active = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                active 
                  ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700" 
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${sub.color}`} />
              <span>{sub.label}</span>
            </button>
          );
        })}
      </div>

      <div className="p-6">

        {/* ACROBAT & WORD DIRECT EDITOR SECTION */}
        {activeSubTab === "edit" && (
          <div className="space-y-6 animate-fadeIn">
            <AcrobatStudio />
          </div>
        )}
        
        {/* MERGE SECTION */}
        {activeSubTab === "merge" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Merge Multiple PDF Documents</h3>
              <p className="text-xs text-slate-400">Combine multiple PDF files into a single master document locally in your browser.</p>
            </div>

            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/40 dark:bg-slate-950/10 hover:bg-slate-50/80 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                Choose PDF files to merge
                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => handlePdfUpload(e, "merge")}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-slate-400 mt-1">Files are processed 100% locally and never leave your computer.</p>
            </div>

            {mergeFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Queue: {mergeFiles.length} documents</h4>
                  <button onClick={() => setMergeFiles([])} className="text-[10px] text-red-500 hover:underline font-bold">Clear All</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {mergeFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                      </div>
                      <button 
                        onClick={() => setMergeFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  {mergeStatus && (
                    <p className="text-xs text-indigo-600 font-semibold animate-pulse">{mergeStatus}</p>
                  )}
                  <button
                    onClick={executeMerge}
                    disabled={merging}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 dark:shadow-none flex items-center gap-2 cursor-pointer"
                  >
                    {merging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Merge className="w-3.5 h-3.5" />}
                    Compile & Merge PDFs
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SPLIT SECTION */}
        {activeSubTab === "split" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Extract & Split PDF Pages</h3>
              <p className="text-xs text-slate-400">Extract specified page intervals locally into a brand-new sub-document.</p>
            </div>

            {!splitFile ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/40 dark:bg-slate-950/10">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Upload PDF file to split
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handlePdfUpload(e, "split")}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate">{splitFile.name}</h4>
                      <p className="text-[10px] text-slate-400">Ready for page extraction parameters</p>
                    </div>
                  </div>
                  <button onClick={() => setSplitFile(null)} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Specify Page Range(s)</label>
                  <input
                    type="text"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    placeholder="e.g., '1' or '1, 3-5' or '2-4'"
                    className="w-full px-4 py-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300"
                  />
                  <p className="text-[10px] text-slate-400">Use comma to separate non-contiguous segments, and dash for page range blocks.</p>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <p className="text-xs text-indigo-600 font-semibold">{splitStatus}</p>
                  <button
                    onClick={executeSplit}
                    disabled={splitting}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 dark:shadow-none flex items-center gap-2 cursor-pointer"
                  >
                    {splitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scissors className="w-3.5 h-3.5" />}
                    Split & Download
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROTATE SECTION */}
        {activeSubTab === "rotate" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-white">Rotate PDF Pages</h3>
              <p className="text-xs text-slate-400">Change orientation of every single page inside your PDF document by 90, 180, or 270 degrees.</p>
            </div>

            {!rotateFile ? (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center bg-slate-50/40 dark:bg-slate-950/10">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Select PDF to rotate
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => handlePdfUpload(e, "rotate")}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate">{rotateFile.name}</h4>
                      <p className="text-[10px] text-slate-400">Document orientation wizard</p>
                    </div>
                  </div>
                  <button onClick={() => setRotateFile(null)} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { angle: 90, label: "90° Clockwise" },
                    { angle: 180, label: "180° Flip" },
                    { angle: 270, label: "270° Counter-Clockwise" }
                  ].map((opt) => (
                    <button
                      key={opt.angle}
                      onClick={() => setRotateAngle(opt.angle)}
                      className={`p-3 text-xs font-bold border rounded-xl transition-all ${
                        rotateAngle === opt.angle 
                          ? "bg-amber-50 border-amber-500 text-amber-600 dark:bg-amber-950/30 dark:border-amber-700" 
                          : "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <p className="text-xs text-amber-600 font-semibold">{rotateStatus}</p>
                  <button
                    onClick={executeRotation}
                    disabled={rotating}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-100 dark:shadow-none flex items-center gap-2 cursor-pointer"
                  >
                    {rotating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />}
                    Apply Rotation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI OCR TEXT EXTRACTOR SECTION */}
        {activeSubTab === "ocr" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-white">AI Optical Character Recognition (OCR)</h3>
              <p className="text-xs text-slate-400 font-medium">Extract copyable text from scans, images, or documents instantly in the browser.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Image select */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center bg-slate-50/40 dark:bg-slate-950/10 min-h-[220px] flex flex-col justify-center items-center">
                  {ocrImage ? (
                    <div className="relative w-full max-h-[180px] overflow-hidden rounded-lg">
                      <img src={ocrImage} className="max-w-full max-h-full object-contain mx-auto" alt="Scan model" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setOcrImage(null)} 
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                        Upload Scan Image (JPEG/PNG)
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleOcrImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">Accepts PNG, JPG, or PDF snippets.</p>
                    </>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recognition Language</label>
                    <select
                      value={ocrLang}
                      onChange={(e) => setOcrLang(e.target.value)}
                      className="w-full p-2.5 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    >
                      <option value="eng">English Dictionary (AI)</option>
                      <option value="spa">Spanish (Español)</option>
                      <option value="fra">French (Français)</option>
                      <option value="deu">German (Deutsch)</option>
                      <option value="hin">Hindi (हिन्दी)</option>
                    </select>
                  </div>
                  <button
                    onClick={runOcr}
                    disabled={ocrRunning || !ocrImage}
                    className="self-end px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-100 dark:shadow-none flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {ocrRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>Extract Text</span>
                  </button>
                </div>

                {ocrRunning && (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="flex justify-between text-[11px] font-bold text-emerald-600">
                      <span>Scanning text layers...</span>
                      <span>{ocrProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Copyable Results */}
              <div className="flex flex-col bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 p-4 rounded-2xl min-h-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-500" />
                    Copyable Extracted OCR Results
                  </h4>
                  {ocrResult && (
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(ocrResult);
                      }} 
                      className="text-[10px] text-emerald-600 hover:underline font-bold"
                    >
                      Copy All
                    </button>
                  )}
                </div>
                <textarea
                  readOnly
                  value={ocrResult}
                  placeholder="The extracted OCR characters will populate here with real-time text matrix alignment..."
                  className="flex-1 w-full bg-transparent p-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none resize-none font-mono leading-relaxed"
                />
              </div>

            </div>
          </div>
        )}

        {/* AI DOCUMENT SUMMARY & CHAT SECTION */}
        {activeSubTab === "summary" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center justify-center gap-2">
                <Bot className="w-5 h-5 text-purple-500 animate-pulse" />
                AI Documents Smart Assistant
              </h3>
              <p className="text-xs text-slate-400">Summarize documents, translate text, and ask interactive queries via server-side Gemini 2.5 API integration.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Side: Paste / Document Feed */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Document Text Context</label>
                    {ocrResult && (
                      <button 
                        onClick={() => setDocTextForAi(ocrResult)} 
                        className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                      >
                        Use OCR Extracted Text
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={8}
                    value={docTextForAi}
                    onChange={(e) => setDocTextForAi(e.target.value)}
                    placeholder="Paste your document transcript, essay, copy, or contract context here..."
                    className="w-full p-4 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-purple-500 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 leading-relaxed"
                  />
                </div>

                <button
                  onClick={triggerRealSummarize}
                  disabled={summarizing || !docTextForAi.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-100 dark:shadow-none flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {summarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate AI Summary</span>
                </button>

                {aiSummary && (
                  <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-950 p-4 rounded-2xl space-y-2">
                    <h4 className="text-xs font-extrabold text-purple-800 dark:text-purple-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      Document Summary Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed whitespace-pre-wrap">
                      {aiSummary}
                    </p>
                  </div>
                )}
              </div>

              {/* Right Side: Interactive AI Chatbot */}
              <div className="lg:col-span-7 flex flex-col bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 rounded-2xl overflow-hidden min-h-[420px]">
                <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 p-3.5 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Document Chatbot Co-Pilot</span>
                </div>

                {/* Messages feed */}
                <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[300px]">
                  {chatHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-1">
                      <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs font-bold">No active discussion yet.</p>
                      <p className="text-[10px]">Provide document context on the left and start asking questions!</p>
                    </div>
                  ) : (
                    chatHistory.map((chat, i) => (
                      <div 
                        key={i} 
                        className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs font-semibold leading-relaxed shadow-xs ${
                          chat.sender === "user" 
                            ? "bg-purple-600 text-white rounded-tr-none" 
                            : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
                        }`}>
                          <p>{chat.message}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {chatting && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none p-3 shadow-xs">
                        <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about this document..."
                    disabled={!docTextForAi && !ocrResult && !aiSummary}
                    className="flex-1 px-4 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatting}
                    className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white rounded-xl transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
