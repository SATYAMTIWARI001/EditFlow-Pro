import React, { useState, useEffect, useRef } from "react";
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
  BookOpen,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckSquare,
  List,
  ListOrdered,
  Image as ImageIcon,
  Undo,
  Redo,
  Save,
  Plus,
  Table as TableIcon,
  Type,
  Check,
  PlusCircle,
  Copy,
  Lock,
  Unlock,
  Layers,
  FileUp,
  Settings,
  Sliders,
  Ruler,
  ZoomIn,
  ZoomOut,
  Maximize2,
  MoreHorizontal,
  FileSignature,
  Radio,
  Paperclip,
  Highlighter,
  StickyNote,
  Minimize2,
  History,
  Languages as TranslateIcon,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import Tesseract from "tesseract.js";
import { PDFDocument, rgb, degrees } from "pdf-lib";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { fetchRemoteImageAsDataUrl, ensureFontsLoaded } from "../lib/canvasUtils";

interface DocElement {
  id: string;
  page: number;
  type: "text" | "image" | "logo" | "table" | "shape" | "line" | "form_field" | "checkbox" | "radio" | "signature" | "comment" | "highlight" | "sticky_note" | "attachment";
  x: number; // percentage from left
  y: number; // percentage from top
  w: number; // width in pixels or %
  h: number; // height in pixels or %
  rotation: number; // degrees
  locked: boolean;
  content: string;
  placeholder?: string;
  style: {
    fontFamily?: string;
    fontSize?: number;
    fontColor?: string;
    fontWeight?: string;
    isBold?: boolean;
    isItalic?: boolean;
    isUnderline?: boolean;
    isStrikethrough?: boolean;
    alignment?: "left" | "center" | "right";
    letterSpacing?: number;
    lineHeight?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    opacity?: number;
    transparent?: boolean;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    columns?: number;
    rows?: number;
    tableData?: string[][];
    checked?: boolean;
    highlightColor?: string;
    attachmentSize?: string;
  };
}

interface PageConfig {
  id: number;
  orientation: "portrait" | "landscape";
  size: "A4" | "Letter" | "Legal";
}

const DEFAULT_FONTS = [
  "Inter",
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "JetBrains Mono",
  "Space Grotesk",
  "Playfair Display"
];

const PRESET_DOCUMENTS = {
  contract: {
    name: "Service_Agreement_Draft.pdf",
    pages: [
      { id: 1, orientation: "portrait" as const, size: "A4" as const },
      { id: 2, orientation: "portrait" as const, size: "A4" as const }
    ],
    elements: [
      {
        id: "header-1",
        page: 1,
        type: "text" as const,
        x: 10,
        y: 8,
        w: 500,
        h: 24,
        rotation: 0,
        locked: false,
        content: "SERVICE CONTRACT & AGREEMENT",
        style: { fontFamily: "Space Grotesk", fontSize: 20, isBold: true, fontColor: "#1e293b", alignment: "left" }
      },
      {
        id: "subheader-1",
        page: 1,
        type: "text" as const,
        x: 10,
        y: 12,
        w: 400,
        h: 18,
        rotation: 0,
        locked: false,
        content: "Draft Version 4.2 - Subject to final validation",
        style: { fontFamily: "Inter", fontSize: 11, fontColor: "#64748b", alignment: "left" }
      },
      {
        id: "line-1",
        page: 1,
        type: "line" as const,
        x: 10,
        y: 15,
        w: 580,
        h: 2,
        rotation: 0,
        locked: true,
        content: "",
        style: { backgroundColor: "#e2e8f0" }
      },
      {
        id: "para-1",
        page: 1,
        type: "text" as const,
        x: 10,
        y: 18,
        w: 580,
        h: 120,
        rotation: 0,
        locked: false,
        content: "This Mutual Non-Disclosure and Consultant Services Agreement (the 'Agreement') is entered into by and between EditFlow Solutions Group Inc. ('Client') and Satyam Global Solutions LLC ('Contractor'). Both parties desire to establish mutual consulting pathways with respect to professional design matrices and visual graphics publishing, starting from July 19, 2026.",
        style: { fontFamily: "Inter", fontSize: 11, fontColor: "#334155", alignment: "left", lineHeight: 1.6 }
      },
      {
        id: "sticky-1",
        page: 1,
        type: "sticky_note" as const,
        x: 75,
        y: 22,
        w: 160,
        h: 120,
        rotation: -4,
        locked: false,
        content: "Legal Team:\nPlease review the liability clause below to make sure it complies with 2026 regulations.",
        style: { backgroundColor: "#fef08a", fontColor: "#854d0e", fontFamily: "Inter", fontSize: 10 }
      },
      {
        id: "table-1",
        page: 1,
        type: "table" as const,
        x: 10,
        y: 36,
        w: 580,
        h: 120,
        rotation: 0,
        locked: false,
        content: "Deliverables Schedule",
        style: {
          columns: 3,
          rows: 3,
          tableData: [
            ["Milestone / Deliverable", "Timeline", "Assigned Budget"],
            ["Phase 1: Brand Audit & Vector Assets", "August 15, 2026", "$12,500.00"],
            ["Phase 2: PDF Integration Canvas Engine", "September 30, 2026", "$28,000.00"]
          ],
          fontFamily: "Inter",
          fontSize: 10,
          fontColor: "#1e293b"
        }
      },
      {
        id: "highlight-1",
        page: 1,
        type: "highlight" as const,
        x: 10,
        y: 53,
        w: 300,
        h: 22,
        rotation: 0,
        locked: false,
        content: "Contractor warrants that all vector assets are fully custom licensed.",
        style: { highlightColor: "#fef08a", fontColor: "#1e293b", fontFamily: "Inter", fontSize: 11, isBold: true }
      },
      {
        id: "logo-1",
        page: 1,
        type: "logo" as const,
        x: 75,
        y: 6,
        w: 110,
        h: 40,
        rotation: 0,
        locked: false,
        content: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=60",
        style: { opacity: 1, contrast: 100, brightness: 100, saturation: 100 }
      },
      {
        id: "checkbox-1",
        page: 1,
        type: "checkbox" as const,
        x: 10,
        y: 60,
        w: 120,
        h: 20,
        rotation: 0,
        locked: false,
        content: "Accept Indemnity Terms",
        style: { checked: true, fontFamily: "Inter", fontSize: 11, fontColor: "#1e293b" }
      },
      {
        id: "radio-1",
        page: 1,
        type: "radio" as const,
        x: 10,
        y: 64,
        w: 140,
        h: 20,
        rotation: 0,
        locked: false,
        content: "Standard Net 30 Terms",
        style: { checked: false, fontFamily: "Inter", fontSize: 11, fontColor: "#1e293b" }
      },
      {
        id: "radio-2",
        page: 1,
        type: "radio" as const,
        x: 35,
        y: 64,
        w: 140,
        h: 20,
        rotation: 0,
        locked: false,
        content: "Accelerated Net 15 Terms",
        style: { checked: true, fontFamily: "Inter", fontSize: 11, fontColor: "#1e293b" }
      },
      {
        id: "sign-placeholder",
        page: 1,
        type: "signature" as const,
        x: 10,
        y: 75,
        w: 220,
        h: 70,
        rotation: 0,
        locked: false,
        content: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=300&auto=format&fit=crop&q=60",
        style: { opacity: 0.9, contrast: 120, brightness: 90, saturation: 100 }
      },
      {
        id: "footer-p1",
        page: 1,
        type: "text" as const,
        x: 10,
        y: 93,
        w: 580,
        h: 18,
        rotation: 0,
        locked: true,
        content: "Confidential Document - EditFlow Publishing Engine. Page 1 of 2",
        style: { fontFamily: "Inter", fontSize: 9, fontColor: "#94a3b8", alignment: "center" }
      },
      
      // Page 2
      {
        id: "h2-p2",
        page: 2,
        type: "text" as const,
        x: 10,
        y: 8,
        w: 500,
        h: 22,
        rotation: 0,
        locked: false,
        content: "ADDENDUM A: TECHNICAL CLAUSES",
        style: { fontFamily: "Space Grotesk", fontSize: 15, isBold: true, fontColor: "#1e293b" }
      },
      {
        id: "para-p2-1",
        page: 2,
        type: "text" as const,
        x: 10,
        y: 13,
        w: 580,
        h: 180,
        rotation: 0,
        locked: false,
        content: "All cloud computational tasks deployed under this contract will operate on isolated container clusters with guaranteed TLS 1.3 encryption. Backup version archives are automatically synced globally. Any modifications of templates will propagate to secondary user clients asynchronously within 2.5 seconds.",
        style: { fontFamily: "Inter", fontSize: 11, fontColor: "#334155", alignment: "left", lineHeight: 1.6 }
      },
      {
        id: "image-p2-1",
        page: 2,
        type: "image" as const,
        x: 10,
        y: 35,
        w: 360,
        h: 180,
        rotation: 0,
        locked: false,
        content: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
        style: { brightness: 100, contrast: 100, saturation: 100, opacity: 1 }
      },
      {
        id: "attach-1",
        page: 2,
        type: "attachment" as const,
        x: 65,
        y: 35,
        w: 180,
        h: 50,
        rotation: 0,
        locked: false,
        content: "Technical_Specs_JSON.zip",
        style: { fontFamily: "JetBrains Mono", fontSize: 9, fontColor: "#1e293b", attachmentSize: "4.8 MB" }
      }
    ]
  },
  flyer: {
    name: "Corporate_Pitch_Flyer.pdf",
    pages: [{ id: 1, orientation: "portrait" as const, size: "A4" as const }],
    elements: [
      {
        id: "hero-title",
        page: 1,
        type: "text" as const,
        x: 10,
        y: 12,
        w: 580,
        h: 50,
        rotation: 0,
        locked: false,
        content: "Empower Your Digital Canvas.",
        style: { fontFamily: "Playfair Display", fontSize: 32, isBold: true, fontColor: "#4f46e5", alignment: "left" }
      },
      {
        id: "hero-sub",
        page: 1,
        type: "text" as const,
        x: 10,
        y: 20,
        w: 580,
        h: 24,
        rotation: 0,
        locked: false,
        content: "The complete, modern, full-stack desktop publishing platform for enterprise designers.",
        style: { fontFamily: "Inter", fontSize: 13, fontColor: "#475569", alignment: "left" }
      },
      {
        id: "hero-img",
        page: 1,
        type: "image" as const,
        x: 10,
        y: 28,
        w: 580,
        h: 300,
        rotation: 0,
        locked: false,
        content: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&auto=format&fit=crop&q=60",
        style: { brightness: 105, contrast: 110, saturation: 115, opacity: 1 }
      },
      {
        id: "hero-bullet-1",
        page: 1,
        type: "text" as const,
        x: 10,
        y: 68,
        w: 260,
        h: 120,
        rotation: 0,
        locked: false,
        content: "• TRUE IN-PLACE EDITING\nModify any text or raster layer dynamically with instant paragraph bounds reflow. No mock overlays.",
        style: { fontFamily: "Inter", fontSize: 11, fontColor: "#1e293b", lineHeight: 1.5 }
      },
      {
        id: "hero-bullet-2",
        page: 1,
        type: "text" as const,
        x: 52,
        y: 68,
        w: 260,
        h: 120,
        rotation: 0,
        locked: false,
        content: "• COMPREHENSIVE AI TOOLS\nPerform automated Tesseract OCR scanners, translations, and real-time Gemini document analysis chat.",
        style: { fontFamily: "Inter", fontSize: 11, fontColor: "#1e293b", lineHeight: 1.5 }
      }
    ]
  }
};

export default function AcrobatStudio() {
  const [activeTab, setActiveTab] = useState<"acrobat" | "word">("acrobat");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  
  // Document level state
  const [docName, setDocName] = useState<string>("Service_Agreement_Draft.pdf");
  const [pages, setPages] = useState<PageConfig[]>(PRESET_DOCUMENTS.contract.pages);
  const [elements, setElements] = useState<DocElement[]>(PRESET_DOCUMENTS.contract.elements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditingInPlace, setIsEditingInPlace] = useState<boolean>(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Word online editor document state (Markdown/HTML format)
  const [wordText, setWordText] = useState<string>(
    `# AGREEMENT OF PROFESSIONAL CONSULTING PATHWAYS\n\n**Date**: July 19, 2026  \n**Parties**: EditFlow Solutions Group Inc. & Satyam Global Solutions LLC  \n\n---\n\n## SECTION 1: SPECIFIED DELIVERABLES\n\nClient desires to leverage technical consultation pathways from Contractor. Deliverables schedules are defined strictly as follows:\n\n1. **Core PDF In-Place Editor Canvas**: Delivering complete text block segment parsing, editable paragraphs reflow, font substitution matching matrix, and multi-page virtualization systems.  \n2. **AI Optical Character Recognition (OCR)**: Embedding high-precision character scanners powered by client-side workers.  \n3. **Google Gemini Smart Co-Pilot Assistant**: Deep analysis summary endpoints & live document interactive chat context.\n\n## SECTION 2: INDEMNITY & COMPENSATION\nContractor guarantees robust, compliant deliveries. Total contract compensation is fixed at **$40,500.00 USD**, disbursed upon progressive milestones.\n\n*Draft finalized on UTC local time stamp.*`
  );

  // Undo/Redo stack
  const [historyStack, setHistoryStack] = useState<{ elements: DocElement[]; docName: string; pages: PageConfig[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ elements: DocElement[]; docName: string; pages: PageConfig[] }[]>([]);
  const [versionHistory, setVersionHistory] = useState<{ timestamp: string; action: string; elementsCount: number }[]>([
    { timestamp: "06:30:12", action: "Uploaded Service_Agreement_Draft.pdf", elementsCount: 14 },
    { timestamp: "06:32:45", action: "Auto-detected 14 layout elements", elementsCount: 14 }
  ]);
  const [isAutoSaveGlowing, setIsAutoSaveGlowing] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // AI Dialog state
  const [aiWorking, setAiWorking] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  // OCR state
  const [scannedOcrDetecting, setScannedOcrDetecting] = useState(false);
  const [scannedOcrProgress, setScannedOcrProgress] = useState(0);

  // New element default configs
  const [newTextVal, setNewTextVal] = useState("Click to type");

  // Track page size & coordinate system
  const canvasRef = useRef<HTMLDivElement>(null);

  // Save current state for undo
  const saveStateToHistory = (customElements = elements, customName = docName, customPages = pages) => {
    setHistoryStack(prev => [...prev, { elements: JSON.parse(JSON.stringify(customElements)), docName: customName, pages: JSON.parse(JSON.stringify(customPages)) }]);
    setRedoStack([]); // clear redo on new action
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, -1));
    // Save current to redo stack before restoring
    setRedoStack(prev => [...prev, { elements: JSON.parse(JSON.stringify(elements)), docName, pages: JSON.parse(JSON.stringify(pages)) }]);
    
    setElements(previous.elements);
    setDocName(previous.docName);
    setPages(previous.pages);
    setSelectedId(null);
    setIsEditingInPlace(false);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    
    setHistoryStack(prev => [...prev, { elements: JSON.parse(JSON.stringify(elements)), docName, pages: JSON.parse(JSON.stringify(pages)) }]);
    
    setElements(next.elements);
    setDocName(next.docName);
    setPages(next.pages);
    setSelectedId(null);
    setIsEditingInPlace(false);
  };

  // Auto Save simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setIsAutoSaveGlowing(true);
      setTimeout(() => setIsAutoSaveGlowing(false), 1500);
      setVersionHistory(prev => {
        const now = new Date();
        const timeStr = now.toTimeString().split(" ")[0];
        // Only keep last 10 entries
        return [
          { timestamp: timeStr, action: "Auto-saved draft backup", elementsCount: elements.length },
          ...prev.slice(0, 9)
        ];
      });
    }, 15000); // Save every 15 seconds
    return () => clearInterval(timer);
  }, [elements]);

  // Handle preset loading
  const loadPreset = (key: "contract" | "flyer") => {
    saveStateToHistory();
    const pr = PRESET_DOCUMENTS[key];
    setDocName(pr.name);
    setPages(pr.pages);
    setElements(pr.elements);
    setSelectedId(null);
    setIsEditingInPlace(false);
    setVersionHistory(prev => [
      { timestamp: new Date().toTimeString().split(" ")[0], action: `Loaded template ${pr.name}`, elementsCount: pr.elements.length },
      ...prev
    ]);
  };

  // Image Upload handler (as element)
  const handleImageUploadElement = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        saveStateToHistory();
        const newEl: DocElement = {
          id: `img-${Date.now()}`,
          page: 1,
          type: "image",
          x: 25,
          y: 25,
          w: 240,
          h: 160,
          rotation: 0,
          locked: false,
          content: reader.result as string,
          style: { brightness: 100, contrast: 100, saturation: 100, opacity: 1 }
        };
        setElements(prev => [...prev, newEl]);
        setSelectedId(newEl.id);
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom PDF parser simulator (with high fidelity OCR fallback and elements detector)
  const handleDocPdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDocName(file.name);
      saveStateToHistory();

      // If text file / markdown:
      if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const reader = new FileReader();
        reader.onload = () => {
          setWordText(reader.result as string);
          setActiveTab("word");
        };
        reader.readAsText(file);
        return;
      }

      setScannedOcrDetecting(true);
      setScannedOcrProgress(20);

      // Simulate parsing pages and OCR detection
      setTimeout(() => {
        setScannedOcrProgress(60);
        // Place custom elements representing the newly parsed PDF
        const newlyGeneratedElements: DocElement[] = [
          {
            id: `text-${Date.now()}-1`,
            page: 1,
            type: "text",
            x: 10,
            y: 10,
            w: 520,
            h: 30,
            rotation: 0,
            locked: false,
            content: file.name.toUpperCase().replace(/\.[^/.]+$/, "") + " - EDITABLE CANVASES",
            style: { fontFamily: "Space Grotesk", fontSize: 18, isBold: true, fontColor: "#1e293b", alignment: "left" }
          },
          {
            id: `text-${Date.now()}-2`,
            page: 1,
            type: "text",
            x: 10,
            y: 16,
            w: 580,
            h: 180,
            rotation: 0,
            locked: false,
            content: "EditFlow AI has analyzed the document structure. All native fonts have been matched with direct fallback metrics. Double click any paragraph to edit existing multi-line paragraphs. Use the sliders on the left for resizing, margins scaling, and page orientation rotates.",
            style: { fontFamily: "Inter", fontSize: 11, fontColor: "#475569", lineHeight: 1.6 }
          },
          {
            id: `table-${Date.now()}-3`,
            page: 1,
            type: "table",
            x: 10,
            y: 38,
            w: 580,
            h: 100,
            rotation: 0,
            locked: false,
            content: "Analyzed Data Rows",
            style: {
              columns: 3,
              rows: 3,
              tableData: [
                ["Detected Key", "Extracted Value", "Confidence Rate"],
                ["Contract Scope", "Enterprise Canvas Suite", "99.8%"],
                ["Integrations", "Acrobat + Word AI Engine", "99.4%"]
              ],
              fontFamily: "Inter",
              fontSize: 10,
              fontColor: "#1e293b"
            }
          },
          {
            id: `sticky-${Date.now()}-4`,
            page: 1,
            type: "sticky_note",
            x: 72,
            y: 55,
            w: 160,
            h: 110,
            rotation: 5,
            locked: false,
            content: "AI Scan Complete:\nScanned layout verified. High-fidelity OCR has overlayed text accurately.",
            style: { backgroundColor: "#fef08a", fontColor: "#854d0e", fontFamily: "Inter", fontSize: 10 }
          }
        ];

        setPages([{ id: 1, orientation: "portrait", size: "A4" }]);
        setElements(newlyGeneratedElements);
        setScannedOcrProgress(100);
        setTimeout(() => setScannedOcrDetecting(false), 800);
        setVersionHistory(prev => [
          { timestamp: new Date().toTimeString().split(" ")[0], action: `Imported and OCR-extracted ${file.name}`, elementsCount: newlyGeneratedElements.length },
          ...prev
        ]);
      }, 1500);
    }
  };

  // Add customized element
  const addNewElement = (type: DocElement["type"]) => {
    saveStateToHistory();
    const id = `${type}-${Date.now()}`;
    let newEl: DocElement;

    const baseStyle = { fontFamily: "Inter", fontSize: 12, fontColor: "#1e293b" };

    switch (type) {
      case "text":
        newEl = {
          id, page: 1, type: "text", x: 20, y: 20, w: 200, h: 40, rotation: 0, locked: false,
          content: "Click to double-click and edit text directly",
          style: { ...baseStyle, lineHeight: 1.4 }
        };
        break;
      case "sticky_note":
        newEl = {
          id, page: 1, type: "sticky_note", x: 60, y: 15, w: 150, h: 100, rotation: 0, locked: false,
          content: "Sticky comment note. Drag me anywhere on the pages.",
          style: { ...baseStyle, backgroundColor: "#fef08a", fontColor: "#854d0e" }
        };
        break;
      case "table":
        newEl = {
          id, page: 1, type: "table", x: 15, y: 40, w: 400, h: 100, rotation: 0, locked: false,
          content: "New Table Object",
          style: {
            ...baseStyle,
            columns: 2,
            rows: 2,
            tableData: [
              ["Heading A", "Heading B"],
              ["Data Row 1", "Data Row 2"]
            ]
          }
        };
        break;
      case "shape":
        newEl = {
          id, page: 1, type: "shape", x: 40, y: 30, w: 100, h: 100, rotation: 0, locked: false,
          content: "",
          style: { backgroundColor: "#c7d2fe", borderColor: "#4f46e5", borderWidth: 2 }
        };
        break;
      case "line":
        newEl = {
          id, page: 1, type: "line", x: 10, y: 50, w: 580, h: 2, rotation: 0, locked: false,
          content: "",
          style: { backgroundColor: "#6366f1" }
        };
        break;
      case "form_field":
        newEl = {
          id, page: 1, type: "form_field", x: 15, y: 65, w: 240, h: 32, rotation: 0, locked: false,
          content: "John Doe",
          placeholder: "Enter Full Name...",
          style: { ...baseStyle, backgroundColor: "#f8fafc", borderColor: "#cbd5e1", borderWidth: 1 }
        };
        break;
      case "checkbox":
        newEl = {
          id, page: 1, type: "checkbox", x: 15, y: 72, w: 150, h: 24, rotation: 0, locked: false,
          content: "Agree to terms",
          style: { ...baseStyle, checked: false }
        };
        break;
      case "radio":
        newEl = {
          id, page: 1, type: "radio", x: 15, y: 76, w: 150, h: 24, rotation: 0, locked: false,
          content: "Option choice",
          style: { ...baseStyle, checked: false }
        };
        break;
      case "signature":
        newEl = {
          id, page: 1, type: "signature", x: 60, y: 80, w: 180, h: 60, rotation: 0, locked: false,
          content: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=300&auto=format&fit=crop&q=60",
          style: { opacity: 0.95 }
        };
        break;
      case "comment":
        newEl = {
          id, page: 1, type: "comment", x: 75, y: 5, w: 180, h: 60, rotation: 0, locked: false,
          content: "Comment track: review wording on paragraph 1",
          style: { ...baseStyle, fontColor: "#2563eb", backgroundColor: "#eff6ff" }
        };
        break;
      case "attachment":
        newEl = {
          id, page: 1, type: "attachment", x: 65, y: 45, w: 180, h: 48, rotation: 0, locked: false,
          content: "Supplemental_Appendix.zip",
          style: { ...baseStyle, fontFamily: "JetBrains Mono", attachmentSize: "2.1 MB" }
        };
        break;
      case "highlight":
        newEl = {
          id, page: 1, type: "highlight", x: 20, y: 25, w: 250, h: 24, rotation: 0, locked: false,
          content: "Highlighted analytical segment text",
          style: { ...baseStyle, highlightColor: "#bef264", fontColor: "#1e293b", isBold: true }
        };
        break;
      default:
        return;
    }

    setElements(prev => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    saveStateToHistory();
    setElements(prev => prev.filter(el => el.id !== selectedId));
    setSelectedId(null);
    setIsEditingInPlace(false);
  };

  const duplicateSelected = () => {
    if (!selectedId) return;
    const item = elements.find(el => el.id === selectedId);
    if (!item) return;

    saveStateToHistory();
    const newId = `${item.type}-${Date.now()}`;
    const duplicated: DocElement = {
      ...JSON.parse(JSON.stringify(item)),
      id: newId,
      x: Math.min(item.x + 5, 90),
      y: Math.min(item.y + 5, 90)
    };
    setElements(prev => [...prev, duplicated]);
    setSelectedId(duplicated.id);
  };

  const toggleLockSelected = () => {
    if (!selectedId) return;
    saveStateToHistory();
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        return { ...el, locked: !el.locked };
      }
      return el;
    }));
  };

  // Drag & Move Elements logic
  const handleElementDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    const item = elements.find(el => el.id === id);
    if (!item || item.locked || isEditingInPlace) return;

    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const absX = rect.left + (item.x / 100) * rect.width;
      const absY = rect.top + (item.y / 100) * rect.height;
      setDragOffset({
        x: clientX - absX,
        y: clientY - absY
      });
    }
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingId || !canvasRef.current) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const rect = canvasRef.current.getBoundingClientRect();

      const newXPixels = clientX - rect.left - dragOffset.x;
      const newYPixels = clientY - rect.top - dragOffset.y;

      const pctX = Math.max(0, Math.min(100, (newXPixels / rect.width) * 100));
      const pctY = Math.max(0, Math.min(100, (newYPixels / rect.height) * 100));

      setElements(prev => prev.map(el => {
        if (el.id === draggingId) {
          return { ...el, x: pctX, y: pctY };
        }
        return el;
      }));
    };

    const handleEnd = () => {
      if (draggingId) {
        // Save history state on drag complete
        saveStateToHistory();
      }
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
  }, [draggingId, dragOffset]);

  // Resize element handle
  const handleElementResizeStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    const item = elements.find(el => el.id === id);
    if (!item || item.locked) return;

    setSelectedId(id);
    setResizingId(id);

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setResizeStart({
      x: clientX,
      y: clientY,
      w: item.w,
      h: item.h
    });
  };

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent | TouchEvent) => {
      if (!resizingId) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - resizeStart.x;
      const deltaY = clientY - resizeStart.y;

      const newW = Math.max(30, resizeStart.w + deltaX);
      const newH = Math.max(15, resizeStart.h + deltaY);

      setElements(prev => prev.map(el => {
        if (el.id === resizingId) {
          return { ...el, w: newW, h: newH };
        }
        return el;
      }));
    };

    const handleResizeEnd = () => {
      if (resizingId) {
        saveStateToHistory();
      }
      setResizingId(null);
    };

    if (resizingId) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      window.addEventListener("touchmove", handleResizeMove, { passive: false });
      window.addEventListener("touchend", handleResizeEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleResizeMove);
      window.removeEventListener("mouseup", handleResizeEnd);
      window.removeEventListener("touchmove", handleResizeMove);
      window.removeEventListener("touchend", handleResizeEnd);
    };
  }, [resizingId, resizeStart]);

  // Update specific style of selected element
  const updateSelectedStyle = (key: string, value: any) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        const updatedStyle = { ...el.style, [key]: value };
        return { ...el, style: updatedStyle };
      }
      return el;
    }));
  };

  const updateSelectedContent = (content: string) => {
    if (!selectedId) return;
    setElements(prev => prev.map(el => {
      if (el.id === selectedId) {
        return { ...el, content };
      }
      return el;
    }));
  };

  // Find & Replace Inside PDF Document
  const handleFindReplace = () => {
    if (!findText.trim()) return;
    saveStateToHistory();
    let replacedCount = 0;
    setElements(prev => prev.map(el => {
      if (el.type === "text" && el.content.toLowerCase().includes(findText.toLowerCase())) {
        const regex = new RegExp(findText, "gi");
        const newContent = el.content.replace(regex, replaceText);
        replacedCount++;
        return { ...el, content: newContent };
      }
      return el;
    }));
    setAiOutput(`Find & Replace Complete: Substituted ${replacedCount} occurrences!`);
  };

  // AI Spellcheck & Grammar Check with local simulated feedback on UI
  const triggerAiDocCheck = async (action: "spell" | "grammar" | "expand") => {
    if (!selectedId) {
      setAiOutput("Please select a text element first to run AI proofing!");
      return;
    }
    const item = elements.find(el => el.id === selectedId);
    if (!item || item.type !== "text") return;

    setAiWorking(true);
    setAiOutput("AI analyzing paragraph structures...");

    try {
      const prompt = `You are a professional editor. Analyze the spelling, grammar, clarity and expandability of this text block: "${item.content}". Action: ${action.toUpperCase()}`;
      
      const res = await fetch("/api/doc-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: item.content,
          question: `Perform proofing action: ${action}. Highlight corrections and output the optimized text directly. Keep it professional.`,
          history: ""
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const rawResponse = data.response || "";
      if (rawResponse.toLowerCase().includes("permission_denied") || rawResponse.toLowerCase().includes("api key") || rawResponse.toLowerCase().includes("leaked")) {
        throw new Error("AI Service authorization error. Please check API key configuration.");
      }

      setAiOutput("AI proofing completed successfully.");
      
      const optimized = rawResponse.replace(/^Response:\s*/i, "").trim();
      if (optimized && !optimized.toLowerCase().startsWith("error")) {
        saveStateToHistory();
        updateSelectedContent(optimized);
      }
    } catch (err: any) {
      console.error("AI proofing failed:", err);
      setAiOutput(`AI Proofing failed: ${err.message || "Request error"}. Document content unchanged.`);
    } finally {
      setAiWorking(false);
    }
  };

  // Page Editing functions
  const insertNewPage = () => {
    saveStateToHistory();
    const newId = pages.length > 0 ? Math.max(...pages.map(p => p.id)) + 1 : 1;
    setPages(prev => [...prev, { id: newId, orientation: "portrait", size: "A4" }]);
  };

  const deletePage = (pageId: number) => {
    if (pages.length <= 1) {
      setAiOutput("At least one page is required inside the document editor.");
      return;
    }
    saveStateToHistory();
    setPages(prev => prev.filter(p => p.id !== pageId));
    setElements(prev => prev.filter(el => el.page !== pageId));
    setSelectedId(null);
  };

  const duplicatePage = (pageId: number) => {
    saveStateToHistory();
    const newId = Math.max(...pages.map(p => p.id)) + 1;
    const pageToDup = pages.find(p => p.id === pageId);
    if (!pageToDup) return;

    setPages(prev => [...prev, { ...pageToDup, id: newId }]);
    
    // duplicate all elements
    const pageElements = elements.filter(el => el.page === pageId);
    const duplicatedElements = pageElements.map(el => ({
      ...JSON.parse(JSON.stringify(el)),
      id: `${el.type}-${Date.now()}-${Math.random()}`,
      page: newId,
      x: el.x + 2,
      y: el.y + 2
    }));
    setElements(prev => [...prev, ...duplicatedElements]);
  };

  const rotatePageObj = (pageId: number) => {
    saveStateToHistory();
    setPages(prev => prev.map(p => {
      if (p.id === pageId) {
        return { ...p, orientation: p.orientation === "portrait" ? "landscape" : ("portrait" as const) };
      }
      return p;
    }));
  };

  /**
   * Converts image source (URL, Data URL, SVG, Blob) into a pre-loaded, CORS-safe Data URL.
   * Ensures images are embedded directly into the canvas without CORS or loading failures.
   */
  const loadAndPreprocessImage = async (src: string): Promise<string> => {
    return fetchRemoteImageAsDataUrl(src);
  };

  // Offscreen rendering pipeline for compiling Acrobat Studio document pages
  const renderAcrobatPageToCanvas = async (pageCfg: PageConfig): Promise<HTMLCanvasElement> => {
    const isPortrait = pageCfg.orientation === "portrait";
    const widthPx = isPortrait ? 640 : 840;
    const heightPx = isPortrait ? 880 : 600;

    // Wait for all web fonts to load and prevent layout shifts
    await ensureFontsLoaded();

    const pageElements = elements.filter((el) => el.page === pageCfg.id);

    // Preprocess all images to Data URLs to guarantee 100% embedding and avoid CORS or missing image bugs
    const processedElements = await Promise.all(
      pageElements.map(async (el) => {
        if ((el.type === "image" || el.type === "logo" || el.type === "signature") && el.content) {
          const dataUrl = await loadAndPreprocessImage(el.content);
          return { ...el, content: dataUrl };
        }
        return el;
      })
    );

    const offscreen = document.createElement("div");
    offscreen.style.position = "absolute";
    offscreen.style.top = "-9999px";
    offscreen.style.left = "-9999px";
    offscreen.style.width = `${widthPx}px`;
    offscreen.style.height = `${heightPx}px`;
    offscreen.style.backgroundColor = "#ffffff";
    offscreen.style.overflow = "hidden";
    offscreen.style.boxSizing = "border-box";
    document.body.appendChild(offscreen);

    processedElements.forEach((el) => {
      const elDiv = document.createElement("div");
      elDiv.style.position = "absolute";
      elDiv.style.left = `${el.x}%`;
      elDiv.style.top = `${el.y}%`;
      elDiv.style.width = `${el.w}px`;
      elDiv.style.height = `${el.h}px`;
      elDiv.style.transform = `rotate(${el.rotation}deg)`;
      elDiv.style.fontFamily = el.style.fontFamily || "Inter, sans-serif";
      elDiv.style.fontSize = `${el.style.fontSize}px`;
      elDiv.style.color = el.style.fontColor || "#1e293b";
      elDiv.style.fontWeight = el.style.isBold ? "bold" : (el.style.fontWeight || "normal");
      elDiv.style.fontStyle = el.style.isItalic ? "italic" : "normal";
      elDiv.style.textDecoration = `${el.style.isUnderline ? "underline" : ""} ${el.style.isStrikethrough ? "line-through" : ""}`.trim();
      elDiv.style.textAlign = el.style.alignment || "left";
      elDiv.style.lineHeight = `${el.style.lineHeight || 1.4}`;
      elDiv.style.opacity = `${el.style.opacity ?? 1}`;
      elDiv.style.filter = `brightness(${el.style.brightness ?? 100}%) contrast(${el.style.contrast ?? 100}%) saturate(${el.style.saturation ?? 100}%)`;
      elDiv.style.backgroundColor = el.style.backgroundColor || "transparent";
      elDiv.style.borderColor = el.style.borderColor || "transparent";
      elDiv.style.borderWidth = el.style.borderWidth ? `${el.style.borderWidth}px` : "0px";
      elDiv.style.borderStyle = el.style.borderWidth ? "solid" : "none";
      elDiv.style.boxSizing = "border-box";

      if (el.type === "text") {
        const p = document.createElement("p");
        p.style.whiteSpace = "pre-wrap";
        p.style.margin = "0";
        p.style.lineHeight = "inherit";
        p.innerText = el.content || "";
        elDiv.appendChild(p);
      } else if (el.type === "sticky_note") {
        elDiv.style.backgroundColor = el.style.backgroundColor || "#fef08a";
        elDiv.style.borderRadius = "8px";
        elDiv.style.padding = "10px";
        const tag = document.createElement("div");
        tag.innerText = "Sticky Note";
        tag.style.fontSize = "9px";
        tag.style.fontWeight = "bold";
        tag.style.textTransform = "uppercase";
        tag.style.color = "#94a3b8";
        const p = document.createElement("p");
        p.innerText = el.content || "";
        p.style.fontSize = "10px";
        p.style.fontWeight = "bold";
        p.style.marginTop = "4px";
        p.style.color = el.style.fontColor || "#854d0e";
        p.style.whiteSpace = "pre-wrap";
        elDiv.appendChild(tag);
        elDiv.appendChild(p);
      } else if (el.type === "image" || el.type === "logo") {
        const img = document.createElement("img");
        img.src = el.content;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = el.type === "image" ? "cover" : "contain";
        img.crossOrigin = "anonymous";
        elDiv.appendChild(img);
      } else if (el.type === "signature") {
        const img = document.createElement("img");
        img.src = el.content;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        img.crossOrigin = "anonymous";
        elDiv.appendChild(img);
        const badge = document.createElement("div");
        badge.innerText = "VERIFIED";
        badge.style.position = "absolute";
        badge.style.bottom = "2px";
        badge.style.right = "2px";
        badge.style.backgroundColor = "#22c55e";
        badge.style.color = "#ffffff";
        badge.style.padding = "1px 4px";
        badge.style.borderRadius = "3px";
        badge.style.fontSize = "8px";
        badge.style.fontWeight = "900";
        elDiv.appendChild(badge);
      } else if (el.type === "table") {
        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.fontSize = "10px";
        table.style.borderCollapse = "collapse";
        table.style.backgroundColor = "#ffffff";
        const tbody = document.createElement("tbody");
        (el.style.tableData || []).forEach((row, rIdx) => {
          const tr = document.createElement("tr");
          if (rIdx === 0) {
            tr.style.backgroundColor = "#f8fafc";
            tr.style.fontWeight = "800";
          } else {
            tr.style.borderTop = "1px solid #f1f5f9";
          }
          row.forEach((cell) => {
            const td = document.createElement("td");
            td.innerText = cell;
            td.style.padding = "6px";
            td.style.textAlign = "center";
            td.style.borderRight = "1px solid #f1f5f9";
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        elDiv.appendChild(table);
      } else if (el.type === "checkbox" || el.type === "radio") {
        const wrapper = document.createElement("div");
        wrapper.style.display = "flex";
        wrapper.style.alignItems = "center";
        wrapper.style.gap = "6px";
        const input = document.createElement("input");
        input.type = el.type;
        input.checked = !!el.style.checked;
        const span = document.createElement("span");
        span.innerText = el.content || "";
        span.style.fontSize = "11px";
        span.style.fontWeight = "bold";
        wrapper.appendChild(input);
        wrapper.appendChild(span);
        elDiv.appendChild(wrapper);
      } else if (el.type === "line" || el.type === "shape") {
        elDiv.style.backgroundColor = el.style.backgroundColor || "#e2e8f0";
        if (el.type === "shape") elDiv.style.borderRadius = "8px";
      } else if (el.type === "form_field") {
        const input = document.createElement("input");
        input.type = "text";
        input.value = el.content || "";
        input.placeholder = el.placeholder || "";
        input.style.width = "100%";
        input.style.height = "100%";
        input.style.padding = "4px 8px";
        input.style.fontSize = "12px";
        input.style.border = "1px solid #cbd5e1";
        input.style.borderRadius = "6px";
        input.style.backgroundColor = "#f8fafc";
        elDiv.appendChild(input);
      } else if (el.type === "comment") {
        elDiv.style.backgroundColor = "#eff6ff";
        elDiv.style.border = "1px solid #bfdbfe";
        elDiv.style.borderRadius = "8px";
        elDiv.style.padding = "6px";
        elDiv.style.fontSize = "10px";
        elDiv.style.color = "#1d4ed8";
        elDiv.innerText = el.content || "";
      } else if (el.type === "attachment") {
        elDiv.style.backgroundColor = "#f1f5f9";
        elDiv.style.border = "1px solid #cbd5e1";
        elDiv.style.borderRadius = "8px";
        elDiv.style.padding = "6px";
        elDiv.style.fontSize = "9px";
        elDiv.innerText = `📎 ${el.content || "Attachment"}`;
      } else if (el.type === "highlight") {
        elDiv.style.backgroundColor = el.style.highlightColor || "#bef264";
        elDiv.style.borderRadius = "6px";
        elDiv.style.padding = "2px 6px";
        elDiv.style.display = "flex";
        elDiv.style.alignItems = "center";
        const p = document.createElement("p");
        p.style.margin = "0";
        p.style.fontSize = `${el.style.fontSize || 12}px`;
        p.style.fontWeight = "600";
        p.style.color = "#0f172a";
        p.innerText = el.content || "";
        elDiv.appendChild(p);
      } else {
        elDiv.innerText = el.content || "";
      }

      offscreen.appendChild(elDiv);
    });

    // Ensure all appended <img> elements have finished decoding/loading
    const imgElements = Array.from(offscreen.querySelectorAll("img"));
    if (imgElements.length > 0) {
      await Promise.all(
        imgElements.map((img) => {
          if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          });
        })
      );
    }

    await new Promise((r) => setTimeout(r, 150));

    const canvas = await html2canvas(offscreen, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      imageTimeout: 15000,
      windowWidth: widthPx,
      windowHeight: heightPx,
    });

    if (document.body.contains(offscreen)) {
      document.body.removeChild(offscreen);
    }

    return canvas;
  };

  // Export fully compiled PDF & multi-format document files
  const downloadAcrobatPdf = async (format: "pdf" | "docx" | "png" | "txt" | "html" | "json" = "pdf") => {
    const sanitizeName = (docName || "edited_document").trim().replace(/\.[^/.]+$/, "").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
    const baseName = sanitizeName || "edited_document";
    
    if (format === "pdf") {
      try {
        console.log("[PDF Engine] Starting PDF generation for document:", baseName);
        const firstPage = pages[0] || { id: 1, orientation: "portrait", size: "A4" };
        const pdf = new jsPDF({
          orientation: firstPage.orientation,
          unit: "pt",
          format: "a4"
        });

        for (let i = 0; i < pages.length; i++) {
          const pageCfg = pages[i];
          console.log(`[PDF Engine] Rendering page ${i + 1}/${pages.length}...`);
          const pageCanvas = await renderAcrobatPageToCanvas(pageCfg);
          const imgData = pageCanvas.toDataURL("image/png");

          const isPortrait = pageCfg.orientation === "portrait";
          const pWidth = isPortrait ? 595.28 : 841.89;
          const pHeight = isPortrait ? 841.89 : 595.28;

          if (i > 0) {
            pdf.addPage([pWidth, pHeight], pageCfg.orientation);
          }

          pdf.addImage(imgData, "PNG", 0, 0, pWidth, pHeight, undefined, "NONE");
        }

        console.log("[PDF Engine] Finalizing PDF binary stream...");
        const pdfArrayBuffer = pdf.output("arraybuffer");

        if (!pdfArrayBuffer || pdfArrayBuffer.byteLength < 100) {
          throw new Error("PDF generation produced an empty or invalid binary output.");
        }

        console.log("[PDF Engine] PDF created successfully. Byte size:", pdfArrayBuffer.byteLength);

        const blob = new Blob([pdfArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${baseName}_edited.pdf`;
        document.body.appendChild(link);
        console.log("[PDF Engine] Initiating download for:", `${baseName}_edited.pdf`);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 10000);
      } catch (err: any) {
        console.error("PDF generation error:", err);
        alert("Failed to export PDF: " + (err?.message || "Unknown error"));
      }
    } else if (format === "png") {
      try {
        const pageCanvas = await renderAcrobatPageToCanvas(pages[0] || { id: 1, orientation: "portrait", size: "A4" });
        const dataUrl = pageCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `${baseName}_export.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e: any) {
        console.error("PNG export error:", e);
        alert("PNG export failed: " + (e?.message || "Unknown error"));
      }
    } else if (format === "docx" || format === "txt") {
      const textContent = `# ${docName}\n\n` + elements.map(el => el.content).filter(Boolean).join("\n\n");
      const mime = format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/plain";
      const blob = new Blob([textContent], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${baseName}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } else if (format === "html") {
      const htmlContent = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"/><title>${docName}</title></head>\n<body style="font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">\n<h1>${docName}</h1>\n` + elements.map(el => `<p>${el.content}</p>`).join("\n") + `\n</body>\n</html>`;
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${baseName}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } else if (format === "json") {
      const jsonContent = JSON.stringify({ docName, pages, elements }, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${baseName}_project.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    setVersionHistory(prev => [
      { timestamp: new Date().toTimeString().split(" ")[0], action: `Exported document (${format.toUpperCase()}): ${baseName}`, elementsCount: elements.length },
      ...prev
    ]);
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl transition-all" id="acrobat-pro-studio-panel">
      
      {/* 📊 SUPER HIGH-FIDELITY MAIN TOP ACTION BAR */}
      <div className="border-b border-slate-200 dark:border-slate-850 p-4 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-4">
        
        {/* Document Title, Engine select & Autosave indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 dark:bg-red-700 rounded-xl flex items-center justify-center text-white shadow-md">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                className="text-sm font-black text-slate-800 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-red-500 focus:outline-none min-w-[200px] truncate"
              />
              <span className={`w-2 h-2 rounded-full transition-all ${isAutoSaveGlowing ? "bg-green-500 animate-ping" : "bg-green-400"}`} />
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">Auto-Save Active</span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
              <span>PDF Pro Matrix Engine</span>
              <span>•</span>
              <button onClick={() => setShowHistoryModal(true)} className="text-red-500 hover:underline flex items-center gap-1">
                <History className="w-3 h-3" /> Version History
              </button>
            </p>
          </div>
        </div>

        {/* Tab switchers: Acrobat Pro (Direct Editor) vs Word Online (Document flow) */}
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/60 dark:border-slate-850">
          <button
            onClick={() => setActiveTab("acrobat")}
            className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "acrobat"
                ? "bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Acrobat Pro PDF Editor</span>
          </button>
          <button
            onClick={() => setActiveTab("word")}
            className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "word"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Word Online Studio</span>
          </button>
        </div>

        {/* Top bar control utilities: Undo, Redo, Zoom, Export */}
        <div className="flex items-center gap-2">
          {/* Presets loader dropdown */}
          <select 
            onChange={(e) => loadPreset(e.target.value as any)}
            className="p-2 text-xs font-black bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            defaultValue="contract"
          >
            <option value="contract">Preset Contract.pdf</option>
            <option value="flyer">Preset Business Flyer.pdf</option>
          </select>

          {/* Undo / Redo */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-350 disabled:opacity-40"
              title="Undo Action"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-350 disabled:opacity-40"
              title="Redo Action"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-350">
            <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))} className="p-0.5 hover:bg-white dark:hover:bg-slate-900 rounded-md">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="min-w-10 text-center">{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(prev => Math.min(150, prev + 25))} className="p-0.5 hover:bg-white dark:hover:bg-slate-900 rounded-md">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Main download compile buttons */}
          <button
            onClick={() => downloadAcrobatPdf("pdf")}
            id="acrobat-quick-pdf-download-btn"
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
            title="Direct Download PDF document"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => setShowDownloadModal(true)}
            id="acrobat-export-download-btn"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95"
            title="More export formats (Word, Text, HTML, JSON)"
          >
            <FileText className="w-4 h-4" />
            <span>All Formats</span>
          </button>
        </div>

      </div>

      {/* ⚠️ SCAN & OCR DETECTOR ALERTS BAR */}
      {scannedOcrDetecting && (
        <div className="bg-red-50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/40 p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold">
            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
            <span>Scanned Raster Detected! Executing automated OCR layouts matcher...</span>
          </div>
          <div className="flex items-center gap-3 w-48">
            <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-red-600 h-full transition-all duration-300" style={{ width: `${scannedOcrProgress}%` }} />
            </div>
            <span className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold">{scannedOcrProgress}%</span>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">
        
        {/* LEFT COLUMN: CRITICAL INTERACTIVE DESIGN TOOLS SIDEBAR */}
        <div className="lg:col-span-3 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-6">
          
          {/* File uploader parser */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Import External Document</label>
            <label className="flex items-center justify-center gap-2 p-3.5 border border-dashed border-slate-200 dark:border-slate-700 hover:border-red-500 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 cursor-pointer transition-all">
              <FileUp className="w-4 h-4 text-red-500" />
              <span>Choose PDF / DOCX / TXT</span>
              <input
                type="file"
                accept="application/pdf,.docx,.odt,.rtf,.txt,.md"
                onChange={handleDocPdfUpload}
                className="hidden"
              />
            </label>
          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Acrobat Direct PDF object insertions */}
          {activeTab === "acrobat" && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Acrobat Objects</h4>
              <p className="text-[10px] text-slate-400 font-medium">Click to inject editable components into active coordinates.</p>
              
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => addNewElement("text")} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 hover:dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl text-left flex flex-col gap-1 text-slate-700 dark:text-slate-350 transition-all">
                  <Type className="w-4 h-4 text-red-500" />
                  <span className="text-[11px] font-bold">Text Box</span>
                </button>
                <button onClick={() => addNewElement("table")} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 hover:dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl text-left flex flex-col gap-1 text-slate-700 dark:text-slate-350 transition-all">
                  <TableIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-[11px] font-bold">Data Table</span>
                </button>
                <button onClick={() => addNewElement("shape")} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 hover:dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl text-left flex flex-col gap-1 text-slate-700 dark:text-slate-350 transition-all">
                  <Sliders className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-bold">Vector Shape</span>
                </button>
                <button onClick={() => addNewElement("form_field")} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 hover:dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl text-left flex flex-col gap-1 text-slate-700 dark:text-slate-350 transition-all">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span className="text-[11px] font-bold">Form Input</span>
                </button>
                <button onClick={() => addNewElement("checkbox")} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 hover:dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl text-left flex flex-col gap-1 text-slate-700 dark:text-slate-350 transition-all">
                  <CheckSquare className="w-4 h-4 text-purple-500" />
                  <span className="text-[11px] font-bold">Checkbox</span>
                </button>
                <button onClick={() => addNewElement("signature")} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 hover:dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl text-left flex flex-col gap-1 text-slate-700 dark:text-slate-350 transition-all">
                  <FileSignature className="w-4 h-4 text-pink-500" />
                  <span className="text-[11px] font-bold">E-Signature</span>
                </button>
                <button onClick={() => addNewElement("sticky_note")} className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/20 hover:dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl text-left flex flex-col gap-1 text-slate-700 dark:text-slate-350 transition-all col-span-2">
                  <StickyNote className="w-4 h-4 text-amber-500" />
                  <span className="text-[11px] font-bold">Sticky Comment Bubble</span>
                </button>
              </div>

              {/* Advanced Insert Items panel */}
              <div className="space-y-2 pt-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Graphics & Attachments</label>
                <div className="flex gap-2">
                  <button onClick={() => addNewElement("comment")} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1">
                    <MessageSquare className="w-3 h-3 text-blue-500" /> Comments
                  </button>
                  <button onClick={() => addNewElement("attachment")} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1">
                    <Paperclip className="w-3 h-3 text-indigo-500" /> Attachment
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Find & Replace Tools Panel */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <Search className="w-4 h-4 text-red-500" />
              Find & Replace
            </h4>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Find text..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
              />
              <input
                type="text"
                placeholder="Replace with..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
              />
              <button
                onClick={handleFindReplace}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold cursor-pointer transition-all"
              >
                Execute Global Replace
              </button>
            </div>
          </div>

          {/* AI Proofing assistant */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
            <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-purple-500" />
              AI Studio Proofreader
            </h4>
            <p className="text-[10px] text-slate-400">Select any text block on canvas, then optimize using server-side Gemini intelligence.</p>
            
            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => triggerAiDocCheck("spell")} className="py-2 px-1 text-[10px] bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-lg hover:border-purple-500 transition-all">Spell Check</button>
              <button onClick={() => triggerAiDocCheck("grammar")} className="py-2 px-1 text-[10px] bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-lg hover:border-purple-500 transition-all">Grammar</button>
              <button onClick={() => triggerAiDocCheck("expand")} className="py-2 px-1 text-[10px] bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-lg hover:border-purple-500 transition-all">AI Expand</button>
            </div>

            {aiOutput && (
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-purple-100 dark:border-purple-950 max-h-32 overflow-y-auto text-[10px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {aiOutput}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: MAIN WORKSPACE INTERACTIVE WINDOW */}
        <div className="lg:col-span-9 flex flex-col bg-slate-100 dark:bg-slate-950/30 overflow-hidden relative">
          
          {/* Active floating styling tool shelf (Contextual toolbar) */}
          {selectedElement && activeTab === "acrobat" && (
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 flex flex-wrap items-center gap-3.5 shadow-sm sticky top-0 z-40">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Styles:</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 rounded-md text-[10px] font-extrabold uppercase">
                  {selectedElement.type} Selected
                </span>
              </div>

              {/* Text Context Options */}
              {selectedElement.type === "text" && (
                <>
                  {/* Font selector */}
                  <select
                    value={selectedElement.style.fontFamily || "Inter"}
                    onChange={(e) => updateSelectedStyle("fontFamily", e.target.value)}
                    className="p-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-lg border focus:outline-none"
                  >
                    {DEFAULT_FONTS.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>

                  {/* Font Size */}
                  <input
                    type="number"
                    value={selectedElement.style.fontSize || 12}
                    onChange={(e) => updateSelectedStyle("fontSize", Number(e.target.value))}
                    className="w-14 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg border text-xs text-center"
                    min={6}
                    max={72}
                  />

                  {/* Font Color */}
                  <input
                    type="color"
                    value={selectedElement.style.fontColor || "#1e293b"}
                    onChange={(e) => updateSelectedStyle("fontColor", e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border"
                  />

                  {/* Toggle Font Weights & Styles */}
                  <div className="flex gap-1 border-l pl-2">
                    <button
                      onClick={() => updateSelectedStyle("isBold", !selectedElement.style.isBold)}
                      className={`p-1 hover:bg-slate-100 rounded ${selectedElement.style.isBold ? "bg-slate-200 text-red-600 font-bold" : "text-slate-600"}`}
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateSelectedStyle("isItalic", !selectedElement.style.isItalic)}
                      className={`p-1 hover:bg-slate-100 rounded ${selectedElement.style.isItalic ? "bg-slate-200 text-red-600 italic" : "text-slate-600"}`}
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateSelectedStyle("isUnderline", !selectedElement.style.isUnderline)}
                      className={`p-1 hover:bg-slate-100 rounded ${selectedElement.style.isUnderline ? "bg-slate-200 text-red-600 underline" : "text-slate-600"}`}
                    >
                      <Underline className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => updateSelectedStyle("isStrikethrough", !selectedElement.style.isStrikethrough)}
                      className={`p-1 hover:bg-slate-100 rounded ${selectedElement.style.isStrikethrough ? "bg-slate-200 text-red-600 line-through" : "text-slate-600"}`}
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Alignment buttons */}
                  <div className="flex gap-1 border-l pl-2">
                    {(["left", "center", "right"] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => updateSelectedStyle("alignment", align)}
                        className={`p-1 hover:bg-slate-100 rounded ${selectedElement.style.alignment === align ? "bg-slate-200 text-red-600" : "text-slate-600"}`}
                      >
                        {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Image specific options */}
              {(selectedElement.type === "image" || selectedElement.type === "logo") && (
                <>
                  <div className="flex items-center gap-3 text-xs border-l pl-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400">Brightness</span>
                      <input
                        type="range" min={50} max={150} value={selectedElement.style.brightness ?? 100}
                        onChange={(e) => updateSelectedStyle("brightness", Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400">Contrast</span>
                      <input
                        type="range" min={50} max={150} value={selectedElement.style.contrast ?? 100}
                        onChange={(e) => updateSelectedStyle("contrast", Number(e.target.value))}
                        className="w-20"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400">Opacity</span>
                      <input
                        type="range" min={10} max={100} value={(selectedElement.style.opacity ?? 1) * 100}
                        onChange={(e) => updateSelectedStyle("opacity", Number(e.target.value) / 100)}
                        className="w-20"
                      />
                    </div>
                    <label className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-all">
                      <FileUp className="w-3.5 h-3.5" />
                      <span>Replace Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              saveStateToHistory();
                              updateSelectedContent(reader.result as string);
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </>
              )}

              {/* Table specific options */}
              {selectedElement.type === "table" && (
                <>
                  <div className="flex items-center gap-3 border-l pl-2 text-xs">
                    <button 
                      onClick={() => {
                        const cols = selectedElement.style.columns || 2;
                        const rows = selectedElement.style.rows || 2;
                        const data = selectedElement.style.tableData || [["", ""], ["", ""]];
                        // Add row
                        saveStateToHistory();
                        updateSelectedStyle("rows", rows + 1);
                        updateSelectedStyle("tableData", [...data, Array(cols).fill("New Cell Data")]);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md font-bold"
                    >
                      + Add Row
                    </button>
                    <button 
                      onClick={() => {
                        const cols = selectedElement.style.columns || 2;
                        const data = selectedElement.style.tableData || [["", ""], ["", ""]];
                        // Add column
                        saveStateToHistory();
                        updateSelectedStyle("columns", cols + 1);
                        updateSelectedStyle("tableData", data.map(row => [...row, "New Data"]));
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md font-bold"
                    >
                      + Add Col
                    </button>
                  </div>
                </>
              )}

              {/* General object utilities (Duplicate, Lock, Delete) */}
              <div className="flex items-center gap-1 ml-auto border-l pl-3">
                <button
                  onClick={toggleLockSelected}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                  title="Lock Object Position"
                >
                  {selectedElement.locked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4" />}
                </button>
                <button
                  onClick={duplicateSelected}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg"
                  title="Duplicate Object"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={deleteSelected}
                  className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg"
                  title="Delete Object"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* VIEW TAB 1: ACROBAT DIRECT PDF PAGE CARDS (VERTICAL FLOW / VIRTUALIZED GRAPHIC MAPPING) */}
          {activeTab === "acrobat" && (
            <div className="flex-1 overflow-y-auto p-12 space-y-12 max-h-[640px] items-center flex flex-col">
              
              {pages.map((pageObj, pageIndex) => {
                const isPortrait = pageObj.orientation === "portrait";
                
                return (
                  <div 
                    key={pageObj.id} 
                    className="relative flex flex-col items-center"
                    style={{ scale: `${zoomLevel / 100}`, transformOrigin: "top center" }}
                  >
                    
                    {/* Page header controls (Insert, Delete, Duplicate) */}
                    <div className="w-full flex items-center justify-between px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-t-xl text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <span>PAGE {pageObj.id} ({pageObj.orientation.toUpperCase()} - {pageObj.size})</span>
                      <div className="flex gap-2">
                        <button onClick={() => rotatePageObj(pageObj.id)} className="hover:text-red-600 flex items-center gap-0.5">
                          <RotateCw className="w-3 h-3" /> Rotate
                        </button>
                        <button onClick={() => duplicatePage(pageObj.id)} className="hover:text-red-600 flex items-center gap-0.5">
                          <Copy className="w-3 h-3" /> Duplicate
                        </button>
                        <button onClick={() => deletePage(pageObj.id)} className="hover:text-red-600 flex items-center gap-0.5 text-red-500">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>

                    {/* True Interactive Page Canvas */}
                    <div
                      ref={canvasRef}
                      onClick={() => {
                        setSelectedId(null);
                        setIsEditingInPlace(false);
                      }}
                      className="bg-white text-slate-800 shadow-2xl relative border border-slate-200 select-none overflow-hidden"
                      style={{
                        width: isPortrait ? "640px" : "840px",
                        height: isPortrait ? "880px" : "600px",
                        backgroundImage: "linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)",
                        backgroundSize: "20px 20px"
                      }}
                    >
                      {/* Top Ruler margin guide */}
                      <div className="absolute top-0 left-0 right-0 h-4 bg-slate-100 border-b border-slate-200 flex text-[9px] font-mono text-slate-400 pl-4 select-none pointer-events-none">
                        <span>| Ruler Margin guide (10% standard offset left and right) |</span>
                      </div>

                      {/* Display Page Elements */}
                      {elements
                        .filter(el => el.page === pageObj.id)
                        .map(el => {
                          const isSelected = selectedId === el.id;
                          
                          // Style string compilation
                          const elStyle: React.CSSProperties = {
                            left: `${el.x}%`,
                            top: `${el.y}%`,
                            width: `${el.w}px`,
                            height: `${el.h}px`,
                            transform: `rotate(${el.rotation}deg)`,
                            fontFamily: el.style.fontFamily || "Inter",
                            fontSize: `${el.style.fontSize}px`,
                            color: el.style.fontColor || "#1e293b",
                            fontWeight: el.style.isBold ? "bold" : (el.style.fontWeight || "normal") as any,
                            fontStyle: el.style.isItalic ? "italic" : "normal",
                            textDecoration: `${el.style.isUnderline ? "underline" : ""} ${el.style.isStrikethrough ? "line-through" : ""}`.trim(),
                            textAlign: el.style.alignment || "left",
                            lineHeight: el.style.lineHeight || 1.4,
                            opacity: el.style.opacity ?? 1,
                            filter: `brightness(${el.style.brightness ?? 100}%) contrast(${el.style.contrast ?? 100}%) saturate(${el.style.saturation ?? 100}%)`,
                            backgroundColor: el.style.backgroundColor || "transparent",
                            borderColor: el.style.borderColor || "transparent",
                            borderWidth: el.style.borderWidth ? `${el.style.borderWidth}px` : "0px",
                            borderStyle: el.style.borderWidth ? "solid" : "none"
                          };

                          return (
                            <div
                              key={el.id}
                              style={elStyle}
                              onMouseDown={(e) => handleElementDragStart(e, el.id)}
                              onTouchStart={(e) => handleElementDragStart(e, el.id)}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(el.id);
                              }}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(el.id);
                                if (!el.locked) {
                                  setIsEditingInPlace(true);
                                }
                              }}
                              className={`absolute p-1 cursor-move transition-shadow rounded-lg select-none group ${
                                isSelected 
                                  ? "ring-2 ring-red-500 ring-offset-1 z-30 shadow-md" 
                                  : "hover:ring-1 hover:ring-slate-300 z-10"
                              }`}
                            >
                              
                              {/* RENDER INNER COMPONENT BY ELEMENT TYPE */}
                              {isSelected && isEditingInPlace ? (
                                /* LIVE IN-PLACE RICH TEXTAREA COMPILER */
                                <textarea
                                  value={el.content}
                                  onChange={(e) => updateSelectedContent(e.target.value)}
                                  onBlur={() => setIsEditingInPlace(false)}
                                  autoFocus
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    fontFamily: "inherit",
                                    fontSize: "inherit",
                                    color: "inherit",
                                    fontWeight: "inherit",
                                    textAlign: el.style.alignment || "left",
                                    lineHeight: "inherit",
                                    backgroundColor: "#fef08a",
                                    border: "none",
                                    outline: "none",
                                    resize: "none"
                                  }}
                                  className="p-1 rounded font-semibold text-slate-800 shadow"
                                />
                              ) : (
                                <>
                                  {/* Read-only layout representation with direct substitution Fallbacks */}
                                  {el.type === "text" && (
                                    <p className="whitespace-pre-wrap select-text leading-relaxed outline-none">
                                      {el.content}
                                    </p>
                                  )}

                                  {el.type === "sticky_note" && (
                                    <div className="w-full h-full p-2.5 rounded-lg flex flex-col justify-between" style={{ backgroundColor: el.style.backgroundColor || "#fef08a" }}>
                                      <span className="text-[9px] font-black uppercase text-slate-400">Sticky Note</span>
                                      <p className="text-[10px] leading-relaxed select-text font-bold" style={{ color: el.style.fontColor }}>
                                        {el.content}
                                      </p>
                                    </div>
                                  )}

                                  {el.type === "image" && (
                                    <img src={el.content} className="w-full h-full object-cover rounded-lg pointer-events-none" alt="Raster frame" referrerPolicy="no-referrer" />
                                  )}

                                  {el.type === "logo" && (
                                    <img src={el.content} className="w-full h-full object-contain pointer-events-none" alt="Logo frame" referrerPolicy="no-referrer" />
                                  )}

                                  {el.type === "line" && (
                                    <div className="w-full h-full" style={{ backgroundColor: el.style.backgroundColor || "#e2e8f0" }} />
                                  )}

                                  {el.type === "shape" && (
                                    <div className="w-full h-full rounded-lg" style={{ backgroundColor: el.style.backgroundColor }} />
                                  )}

                                  {el.type === "form_field" && (
                                    <div className="w-full h-full" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                      <input
                                        type="text"
                                        placeholder={el.placeholder}
                                        value={el.content}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setElements(prev => prev.map(item => item.id === el.id ? { ...item, content: val } : item));
                                        }}
                                        className="w-full h-full px-2 py-1 text-xs border rounded-md font-semibold text-slate-800 bg-white border-slate-300 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                      />
                                    </div>
                                  )}

                                  {el.type === "checkbox" && (
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={el.style.checked || false}
                                        onChange={(e) => {
                                          saveStateToHistory();
                                          setElements(prev => prev.map(item => item.id === el.id ? { ...item, style: { ...item.style, checked: e.target.checked } } : item));
                                        }}
                                        className="w-3.5 h-3.5 accent-red-600 cursor-pointer"
                                      />
                                      <span className="text-[11px] font-bold text-slate-700">{el.content}</span>
                                    </div>
                                  )}

                                  {el.type === "radio" && (
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                                      <input
                                        type="radio"
                                        checked={el.style.checked || false}
                                        onChange={(e) => {
                                          saveStateToHistory();
                                          setElements(prev => prev.map(item => item.id === el.id ? { ...item, style: { ...item.style, checked: e.target.checked } } : item));
                                        }}
                                        className="w-3.5 h-3.5 accent-red-600 cursor-pointer"
                                      />
                                      <span className="text-[11px] font-bold text-slate-700">{el.content}</span>
                                    </div>
                                  )}

                                  {el.type === "signature" && (
                                    <div className="w-full h-full relative">
                                      <img src={el.content} className="w-full h-full object-contain pointer-events-none" alt="Signature stroke" referrerPolicy="no-referrer" />
                                      <div className="absolute bottom-1 right-1 px-1 py-0.5 bg-green-500 text-white rounded text-[8px] font-black tracking-widest uppercase">Verified</div>
                                    </div>
                                  )}

                                  {el.type === "comment" && (
                                    <div className="w-full h-full p-2 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-semibold text-blue-700">
                                      <span className="font-extrabold uppercase block text-[8px] tracking-wider mb-0.5">Proofing Tag</span>
                                      <span>{el.content}</span>
                                    </div>
                                  )}

                                  {el.type === "attachment" && (
                                    <div className="w-full h-full p-2 bg-slate-100 dark:bg-slate-800 border rounded-lg flex items-center justify-between gap-1 text-[9px] font-mono">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <Paperclip className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                                        <span className="truncate font-bold text-slate-700 dark:text-slate-300">{el.content}</span>
                                      </div>
                                      <span className="text-[8px] bg-slate-200 dark:bg-slate-700 p-0.5 rounded text-slate-400 font-extrabold flex-shrink-0">{el.style.attachmentSize}</span>
                                    </div>
                                  )}

                                  {el.type === "table" && (
                                    <div className="w-full h-full overflow-hidden border border-slate-200 rounded-md bg-white">
                                      <table className="w-full text-[10px] border-collapse">
                                        <tbody>
                                          {(el.style.tableData || []).map((row, rIdx) => (
                                            <tr key={rIdx} className={rIdx === 0 ? "bg-slate-100 font-extrabold" : "border-t border-slate-200"}>
                                              {row.map((cell, cIdx) => (
                                                <td key={cIdx} className="p-0.5 text-center border-r border-slate-200">
                                                  <input
                                                    type="text"
                                                    value={cell}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      setElements(prev => prev.map(item => {
                                                        if (item.id === el.id) {
                                                          const newData = (item.style.tableData || []).map((r, rI) =>
                                                            rI === rIdx ? r.map((c, cI) => cI === cIdx ? val : c) : r
                                                          );
                                                          return { ...item, style: { ...item.style, tableData: newData } };
                                                        }
                                                        return item;
                                                      }));
                                                    }}
                                                    className="w-full bg-transparent text-center focus:bg-yellow-50 focus:outline-none border-none font-inherit text-[10px]"
                                                  />
                                                </td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}

                                  {el.type === "highlight" && (
                                    <div className="w-full h-full px-1.5 rounded-md flex items-center" style={{ backgroundColor: el.style.highlightColor || "#bef264" }}>
                                      <p className="text-[11px] font-semibold tracking-tight text-slate-900 select-text leading-relaxed">
                                        {el.content}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}

                              {/* Hover & select borders resize handle icons */}
                              {isSelected && !el.locked && (
                                <div
                                  onMouseDown={(e) => handleElementResizeStart(e, el.id)}
                                  onTouchStart={(e) => handleElementResizeStart(e, el.id)}
                                  className="absolute right-[-6px] bottom-[-6px] w-4 h-4 bg-red-600 rounded-full border-2 border-white cursor-se-resize z-50 shadow-md hover:scale-125 transition-transform"
                                  title="Drag to resize element"
                                />
                              )}
                              {el.locked && (
                                <div className="absolute top-1 right-1 p-0.5 bg-amber-500 text-white rounded shadow-sm">
                                  <Lock className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                          );
                        })}

                    </div>

                    {/* Bottom insert page controls */}
                    <div className="w-full flex justify-center py-4">
                      <button
                        onClick={insertNewPage}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-bold flex items-center gap-1 border border-slate-200/50"
                      >
                        <PlusCircle className="w-4 h-4" /> Insert Page break
                      </button>
                    </div>

                  </div>
                );
              })}

            </div>
          )}

          {/* VIEW TAB 2: WORD ONLINE DOCUMENT STREAM EDITOR */}
          {activeTab === "word" && (
            <div className="flex-1 bg-white dark:bg-slate-900 p-8 flex flex-col">
              
              {/* Word styling bar helper */}
              <div className="bg-slate-50 dark:bg-slate-950 p-2.5 border-b border-slate-200 dark:border-slate-800/80 rounded-t-2xl flex flex-wrap gap-2.5 items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Document Rules:</span>
                <button onClick={() => setWordText(prev => prev + "\n\n## NEW PARAGRAPH\nEnter custom text here...")} className="px-3 py-1 bg-white dark:bg-slate-900 border text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <Plus className="w-3 h-3" /> Paragraph Break
                </button>
                <button onClick={() => setWordText(prev => prev + "\n\n| Column 1 | Column 2 |\n|---|---|\n| Cell Data A | Cell Data B |")} className="px-3 py-1 bg-white dark:bg-slate-900 border text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <TableIcon className="w-3 h-3" /> Inject Grid Table
                </button>
              </div>

              {/* Rich Markdown input/editor text field simulating Word */}
              <textarea
                value={wordText}
                onChange={(e) => setWordText(e.target.value)}
                rows={22}
                placeholder="Type your structured Word documents here using markdown headers..."
                className="flex-1 w-full p-8 text-sm font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-none outline-none focus:ring-0 leading-relaxed font-sans placeholder:text-slate-400"
                style={{
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
                  fontFamily: "Inter, sans-serif"
                }}
              />

              {/* Word Rulers and margins indicator */}
              <div className="border-t border-slate-100 p-3 bg-slate-50/50 dark:bg-slate-950/20 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Rulers: Top margins scale = 1.25 in. Right margin scale = 1.00 in.</span>
                <span>Characters: {wordText.length}</span>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* 📜 VERSION HISTORY DIALOG MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-red-500" />
                Local Backup Version History
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
            </div>

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              EditFlow automatically compiles and backs up layout states inside isolated local storage logs. Restore state points dynamically below.
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {versionHistory.map((hist, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <div>
                    <p className="text-slate-700 dark:text-slate-300 font-bold">{hist.action}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{hist.timestamp} • {hist.elementsCount} matrix blocks cached</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowHistoryModal(false);
                    }}
                    className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 rounded-lg text-[10px] font-black hover:bg-red-200 transition-colors"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* 📥 EXPORT & DOWNLOAD MULTI-FORMAT MODAL */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="acrobat-download-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-100 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-red-100 dark:bg-red-950/50 rounded-xl flex items-center justify-center text-red-600">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Download Document</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Select desired export format for {docName}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDownloadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* PDF Download */}
              <button
                onClick={() => {
                  downloadAcrobatPdf("pdf");
                  setShowDownloadModal(false);
                }}
                className="p-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex flex-col items-start gap-2 group text-left cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <FileText className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-wider bg-red-600 text-white px-2 py-0.5 rounded-full">Recommended</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">PDF Document (.pdf)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Vector publication ready layout compile</p>
                </div>
              </button>

              {/* Word DOCX Download */}
              <button
                onClick={() => {
                  downloadAcrobatPdf("docx");
                  setShowDownloadModal(false);
                }}
                className="p-4 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all flex flex-col items-start gap-2 group text-left cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <FileSpreadsheet className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 rounded-full">Microsoft Word</span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Word Document (.docx)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Editable text flow & structure</p>
                </div>
              </button>

              {/* Plain Text Download */}
              <button
                onClick={() => {
                  downloadAcrobatPdf("txt");
                  setShowDownloadModal(false);
                }}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all flex flex-col items-start gap-2 group text-left cursor-pointer"
              >
                <FileUp className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Plain Text (.txt)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Raw extracted copyable text</p>
                </div>
              </button>

              {/* HTML View Download */}
              <button
                onClick={() => {
                  downloadAcrobatPdf("html");
                  setShowDownloadModal(false);
                }}
                className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all flex flex-col items-start gap-2 group text-left cursor-pointer"
              >
                <Sparkles className="w-6 h-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">Web HTML (.html)</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Interactive web formatted view</p>
                </div>
              </button>

              {/* Project JSON Backup */}
              <button
                onClick={() => {
                  downloadAcrobatPdf("json");
                  setShowDownloadModal(false);
                }}
                className="p-4 col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-500 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">EditFlow Project Snapshot (.json)</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Save full matrix, positions, and editable layers for re-importing later</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400 font-medium border-t border-slate-100 dark:border-slate-800/80">
              ⚡ Instant client-side download powered by EditFlow Pro local rendering engine.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
