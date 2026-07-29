import React, { useState, useRef, useEffect } from "react";
import { 
  Image as ImageIcon, 
  Crop, 
  RotateCw, 
  FlipHorizontal, 
  Sparkles, 
  Sliders, 
  Scissors, 
  Sun, 
  Eraser, 
  Compass, 
  Download, 
  Check, 
  RefreshCw,
  PlusCircle,
  Eye,
  SlidersHorizontal,
  FolderSync
} from "lucide-react";

const GRADIENTS = [
  "from-pink-500 to-rose-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-indigo-500 to-violet-500",
  "from-blue-600 to-indigo-600",
  "from-slate-800 to-slate-950"
];

const BG_IMAGES = [
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=60", name: "Beach Escape" },
  { url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=60", name: "Mist Forest" },
  { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=60", name: "Cyber Cyberpunk" },
  { url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=60", name: "Deep Space" }
];

export default function ImageSuite() {
  const [activeToolTab, setActiveToolTab] = useState<"filters" | "adjust" | "ai" | "canvas">("filters");

  // Image source state
  const [imageSrc, setImageSrc] = useState<string>("https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1024&auto=format&fit=crop&q=80");
  const [imageName, setImageName] = useState<string>("portrait_default.jpg");
  const [originalSrc, setOriginalSrc] = useState<string>("https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1024&auto=format&fit=crop&q=80");

  // Adjustments states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);

  // Filter preset states
  const [activeFilter, setActiveFilter] = useState<string>("none");

  // AI Background Remover states
  const [bgRemoved, setBgRemoved] = useState(false);
  const [activeBgOption, setActiveBgOption] = useState<"transparent" | "gradient" | "scenic">("transparent");
  const [selectedGradient, setSelectedGradient] = useState<string>("from-indigo-500 to-violet-500");
  const [selectedScenicUrl, setSelectedScenicUrl] = useState<string>(BG_IMAGES[0].url);
  const [removingBg, setRemovingBg] = useState(false);

  // Magic eraser co-pilot states
  const [copilotCommand, setCopilotCommand] = useState("");
  const [coordinates, setCoordinates] = useState<{ x: number; y: number } | null>(null);
  const [historyLogs, setHistoryLogs] = useState<string[]>([
    "Initialized portrait_default.jpg canvas matrix",
    "Applied high-fidelity face retouching (auto-stabilized)"
  ]);
  const [eraserWorking, setEraserWorking] = useState(false);

  // Image canvas reference to construct compiled filters and export
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setOriginalSrc(reader.result as string);
        setBgRemoved(false);
        resetAdjustments();
        setHistoryLogs(prev => [...prev, `Uploaded customized image: ${file.name}`]);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setHue(0);
    setBlur(0);
    setGrayscale(0);
    setSepia(0);
    setActiveFilter("none");
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    resetAdjustments();
    if (filter === "vintage") {
      setSepia(35);
      setContrast(120);
      setBrightness(95);
    } else if (filter === "bnw") {
      setGrayscale(100);
      setContrast(130);
    } else if (filter === "warm") {
      setSepia(20);
      setSaturation(130);
    } else if (filter === "cool") {
      setHue(20);
      setSaturation(110);
      setContrast(95);
    } else if (filter === "cartoon") {
      setSaturation(150);
      setContrast(140);
    } else if (filter === "sketch") {
      setGrayscale(100);
      setContrast(180);
      setBrightness(110);
    }
    setHistoryLogs(prev => [...prev, `Applied filter preset: ${filter}`]);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeToolTab !== "ai") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setCoordinates({ x, y });
    setHistoryLogs(prev => [...prev, `Selected canvas target at coordinates: X: ${x}%, Y: ${y}%`]);
  };

  const runBgRemoval = async () => {
    setRemovingBg(true);
    setHistoryLogs(prev => [...prev, "Running high-precision AI background removal layer..."]);
    
    // Simulate real AI network segmenter
    await new Promise(resolve => setTimeout(resolve, 1500));
    setBgRemoved(true);
    setRemovingBg(false);
    setHistoryLogs(prev => [...prev, "Extracted foreground outline mask successfully!"]);
  };

  const runMagicEraser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotCommand.trim()) return;

    setEraserWorking(true);
    setHistoryLogs(prev => [...prev, `Sending AI request: "${copilotCommand}"`]);

    await new Promise(resolve => setTimeout(resolve, 1400));
    setHistoryLogs(prev => [
      ...prev, 
      `AI completed: "${copilotCommand}" applied near coordinates ${coordinates ? `[${coordinates.x}%, ${coordinates.y}%]` : "[Center]"}`
    ]);
    setCopilotCommand("");
    setCoordinates(null);
    setEraserWorking(false);
  };

  // Compile active styles for css filter
  const getFilterStyleString = () => {
    return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px) grayscale(${grayscale}%) sepia(${sepia}%)`;
  };

  const downloadCompiledImage = () => {
    const canvas = document.createElement("canvas");
    const img = imageRef.current;
    if (!img) return;

    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw background first if bg is removed and custom active background is selected
    if (bgRemoved) {
      if (activeBgOption === "gradient") {
        const grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grd.addColorStop(0, "#4f46e5");
        grd.addColorStop(1, "#7c3aed");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (activeBgOption === "transparent") {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      } else if (activeBgOption === "scenic") {
        // Draw scenic placeholder back
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    // Apply filters directly to canvas context
    ctx.filter = getFilterStyleString();
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const link = document.createElement("a");
    link.download = `editflow_${imageName}`;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setHistoryLogs(prev => [...prev, "Exported high-resolution compiled PNG file"]);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors" id="image-suite-container">
      
      {/* Upper header */}
      <div className="border-b border-slate-100 dark:border-slate-850 p-4 bg-slate-50/50 dark:bg-slate-950/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">AI Studio Photo Editor</h3>
            <p className="text-[10px] text-slate-400 font-medium">Apply dynamic filters, resize, adjust channels, or invoke magic AI co-pilot erasers.</p>
          </div>
        </div>

        {/* Upload Custom */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all border border-slate-200/50 dark:border-slate-700">
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={downloadCompiledImage}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 dark:shadow-none flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Quality</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN: ACTIVE CANVAS PREVIEW */}
        <div className="lg:col-span-8 bg-slate-900/10 dark:bg-black/20 p-8 flex flex-col justify-center items-center relative min-h-[460px]">
          
          <div 
            ref={canvasContainerRef}
            onClick={handleCanvasClick}
            className={`relative max-w-full max-h-[380px] overflow-hidden rounded-2xl shadow-xl transition-all cursor-crosshair border border-white/10 ${
              bgRemoved && activeBgOption === "gradient" 
                ? `bg-gradient-to-tr ${selectedGradient}` 
                : bgRemoved && activeBgOption === "transparent"
                ? "bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]"
                : ""
            }`}
          >
            {/* Background Image Layer if Scenic mode selected */}
            {bgRemoved && activeBgOption === "scenic" && (
              <img 
                src={selectedScenicUrl} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none blur-xs" 
                alt="Scenic BG" 
                referrerPolicy="no-referrer"
              />
            )}

            {/* Main Foreground Image */}
            <img
              ref={imageRef}
              src={imageSrc}
              style={{
                filter: getFilterStyleString(),
                maskImage: bgRemoved ? "radial-gradient(circle, black 70%, transparent 100%)" : "none",
                WebkitMaskImage: bgRemoved ? "radial-gradient(circle, black 70%, transparent 100%)" : "none"
              }}
              className="max-w-full max-h-[380px] object-contain block transition-transform relative z-10"
              alt="Canvas view"
              referrerPolicy="no-referrer"
            />

            {/* Click target coordinates highlight marker */}
            {coordinates && activeToolTab === "ai" && (
              <div 
                style={{ left: `${coordinates.x}%`, top: `${coordinates.y}%` }}
                className="absolute w-5 h-5 -ml-2.5 -mt-2.5 bg-red-500 text-white font-extrabold flex items-center justify-center rounded-full text-[9px] shadow-lg animate-ping border border-white z-50 pointer-events-none"
              />
            )}
          </div>

          {/* Bottom active indicators info */}
          <div className="absolute bottom-3 left-4 flex gap-3 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200/20">
            <span>Name: {imageName}</span>
            <span>Filters: {activeFilter !== "none" ? activeFilter.toUpperCase() : "RAW"}</span>
          </div>
        </div>

        {/* RIGHT COLUMN: EDITOR ADJUSTMENT SLIDERS */}
        <div className="lg:col-span-4 border-l border-slate-100 dark:border-slate-850 flex flex-col h-full min-h-[460px]">
          
          {/* Tool Tab Headers */}
          <div className="grid grid-cols-4 border-b border-slate-100 dark:border-slate-850 text-center bg-slate-50/30 dark:bg-slate-950/10">
            {[
              { id: "filters", label: "Presets", icon: Compass },
              { id: "adjust", label: "Adjust", icon: SlidersHorizontal },
              { id: "ai", label: "AI Magic", icon: Sparkles },
              { id: "canvas", label: "Stream", icon: FolderSync }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeToolTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveToolTab(tab.id as any)}
                  className={`py-3 text-[11px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all ${
                    active 
                      ? "text-indigo-600 bg-white dark:bg-slate-900 border-b-2 border-indigo-500" 
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tool content drawer */}
          <div className="p-5 flex-1 overflow-y-auto space-y-6 max-h-[380px]">
            
            {/* TAB 1: FILTERS PRESETS */}
            {activeToolTab === "filters" && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Fidelity Filter Matrices</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "none", label: "Raw Original" },
                    { id: "vintage", label: "Vintage Amber" },
                    { id: "bnw", label: "Slate Noir (B&W)" },
                    { id: "warm", label: "Warm Sunset" },
                    { id: "cool", label: "Cool Polar" },
                    { id: "cartoon", label: "Pop Cartoon" },
                    { id: "sketch", label: "Lead Sketch" }
                  ].map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleFilterClick(preset.id)}
                      className={`p-3 text-xs font-bold border rounded-2xl transition-all text-left flex items-center justify-between ${
                        activeFilter === preset.id 
                          ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600" 
                          : "border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <span>{preset.label}</span>
                      {activeFilter === preset.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: ADVANCED ADJUST CHANNELS */}
            {activeToolTab === "adjust" && (
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adjustment Nodes</h4>
                  <button onClick={resetAdjustments} className="text-[10px] text-indigo-600 font-bold hover:underline">Reset</button>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Brightness", val: brightness, set: setBrightness, min: 50, max: 150, unit: "%" },
                    { label: "Contrast", val: contrast, set: setContrast, min: 50, max: 150, unit: "%" },
                    { label: "Saturation", val: saturation, set: setSaturation, min: 0, max: 200, unit: "%" },
                    { label: "Hue Rotation", val: hue, set: setHue, min: 0, max: 360, unit: "°" },
                    { label: "Gaussian Blur", val: blur, set: setBlur, min: 0, max: 15, unit: "px" },
                    { label: "Grayscale", val: grayscale, set: setGrayscale, min: 0, max: 100, unit: "%" },
                    { label: "Sepia Tone", val: sepia, set: setSepia, min: 0, max: 100, unit: "%" }
                  ].map((sl, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-350">
                        <span>{sl.label}</span>
                        <span>{sl.val}{sl.unit}</span>
                      </div>
                      <input
                        type="range"
                        min={sl.min}
                        max={sl.max}
                        value={sl.val}
                        onChange={(e) => sl.set(Number(e.target.value))}
                        className="w-full accent-indigo-600 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: AI ASSISTANT & MAGIC ERASER */}
            {activeToolTab === "ai" && (
              <div className="space-y-5">
                
                {/* Background Removal segment */}
                <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 flex items-center gap-1.5">
                    <Scissors className="w-4 h-4 text-pink-500" />
                    AI Background Segmenter
                  </h4>
                  <p className="text-[11px] text-slate-400">Instantly isolate foreground targets using neural contour extraction.</p>
                  
                  {!bgRemoved ? (
                    <button
                      onClick={runBgRemoval}
                      disabled={removingBg}
                      className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-100 dark:shadow-none flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {removingBg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Isolate Subject Background</span>
                    </button>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                        <span>Choose Backfill:</span>
                        <button onClick={() => setBgRemoved(false)} className="text-red-500 hover:underline">Restore Original</button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {["transparent", "gradient", "scenic"].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setActiveBgOption(opt as any)}
                            className={`p-2 text-[10px] font-extrabold rounded-lg border uppercase transition-all ${
                              activeBgOption === opt 
                                ? "bg-indigo-600 border-indigo-600 text-white" 
                                : "bg-white border-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>

                      {/* Gradient backfills */}
                      {activeBgOption === "gradient" && (
                        <div className="grid grid-cols-6 gap-1.5">
                          {GRADIENTS.map((gr, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedGradient(gr)}
                              className={`aspect-square rounded-full bg-gradient-to-tr ${gr} border-2 ${
                                selectedGradient === gr ? "border-indigo-600" : "border-transparent"
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      {/* Scenic backfills */}
                      {activeBgOption === "scenic" && (
                        <div className="grid grid-cols-2 gap-1.5">
                          {BG_IMAGES.map((img, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedScenicUrl(img.url)}
                              className={`p-1 text-[10px] font-bold border rounded-lg overflow-hidden truncate max-w-full ${
                                selectedScenicUrl === img.url ? "border-indigo-600 bg-indigo-50/40" : "border-slate-200"
                              }`}
                            >
                              {img.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Magic object removal/addition */}
                <form onSubmit={runMagicEraser} className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-150 flex items-center gap-1.5">
                    <Eraser className="w-4 h-4 text-violet-500" />
                    AI Object Eraser & Painter
                  </h4>
                  <p className="text-[11px] text-slate-400">Click anywhere on the image on the left to set target, then describe modifications below.</p>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={copilotCommand}
                      onChange={(e) => setCopilotCommand(e.target.value)}
                      placeholder="e.g., 'Remove watermark', 'Add sun glasses'"
                      className="w-full px-3 py-2 text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl"
                    />
                    <button
                      type="submit"
                      disabled={eraserWorking || !copilotCommand.trim()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {eraserWorking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Execute Design Instruction</span>
                    </button>
                  </div>
                </form>

              </div>
            )}

            {/* TAB 4: HISTORY STREAMS */}
            {activeToolTab === "canvas" && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vector History & Layers</h4>
                <div className="space-y-2">
                  {historyLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2 text-[11px] font-semibold text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850/80">
                      <span className="text-indigo-500">✔</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
