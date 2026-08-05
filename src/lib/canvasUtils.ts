import QRCode from "qrcode";

/**
 * Promise-based font loader utility that utilizes the document.fonts.ready API
 * or checks individual font loading states to ensure all Google Fonts (Inter, Poppins, etc.)
 * defined in index.html or used in documents are fully loaded before the PDF generation process begins,
 * preventing layout shifts.
 */
export async function ensureFontsLoaded(
  fontFamilies: string[] = [
    "Inter",
    "Poppins",
    "Montserrat",
    "Roboto",
    "Playfair Display",
    "JetBrains Mono",
    "Space Grotesk",
    "Orbitron"
  ],
  timeoutMs = 4000
): Promise<boolean> {
  if (typeof document === "undefined") return true;

  try {
    // 1. Wait for document.fonts.ready API
    if ("fonts" in document && document.fonts && document.fonts.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, timeoutMs))
      ]);
    }

    // 2. Load / check individual font loading states
    if ("fonts" in document && document.fonts && typeof document.fonts.load === "function") {
      const loadTasks = fontFamilies.map(async (family) => {
        if (!family) return;
        try {
          await document.fonts.load(`16px "${family}"`);
          await document.fonts.load(`700 16px "${family}"`);
        } catch (err) {
          console.warn(`Font load check failed for font family "${family}":`, err);
        }
      });

      await Promise.race([
        Promise.all(loadTasks),
        new Promise((resolve) => setTimeout(resolve, timeoutMs))
      ]);
    }

    return true;
  } catch (err) {
    console.warn("ensureFontsLoaded utility caught error:", err);
    return false;
  }
}

/**
 * Helper function to fetch remote image assets as Blobs and convert them to base64 DataURLs
 * before processing in the PDF export engine to resolve CORS loading issues.
 */
export async function fetchRemoteImageAsDataUrl(src: string): Promise<string> {
  if (!src) return "";
  if (src.startsWith("data:image/") || src.startsWith("data:application/")) return src;

  // Attempt fetch as Blob first to bypass CORS issues and convert to clean base64 DataURL
  try {
    const res = await fetch(src, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
            resolve(reader.result);
          } else {
            resolve(src);
          }
        };
        reader.onerror = () => resolve(src);
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn("Blob fetch failed for remote image, falling back to Canvas draw:", err);
  }

  // Fallback: draw image onto an HTML5 Canvas element using anonymous CORS mode
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
          return;
        }
      } catch (e) {
        console.warn("Canvas export fallback failed:", e);
      }
      resolve(src);
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/**
 * Removes white/light background from an image (specifically for signatures)
 * and returns a transparent PNG base64 Data URL.
 */
export function removeSignatureBackground(imageBase64: string, threshold = 230): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageBase64;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(imageBase64);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Loop through all pixels (r, g, b, a)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // If the pixel is very bright (close to white), make it fully transparent
        if (r >= threshold && g >= threshold && b >= threshold) {
          data[i + 3] = 0; // Alpha = 0
        }
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (err) => {
      console.error("Error loading signature image for background removal:", err);
      resolve(imageBase64); // Return original if error
    };
  });
}

/**
 * Generates a high quality QR Code base64 data URL
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    const url = await QRCode.toDataURL(text, {
      margin: 1,
      width: 512,
      color: {
        dark: "#000000",
        light: "#ffffff"
      }
    });
    return url;
  } catch (error) {
    console.error("QR Code generation failed:", error);
    return "";
  }
}

/**
 * Smart Text Scaling: Dynamically scale font size based on text length to prevent overflow
 */
export function getSmartTextScale(text: string, referenceLimit = 15): number {
  if (!text) return 1.0;
  if (text.length <= referenceLimit) return 1.0;
  
  // Exponential / linear decline for smoothing
  const factor = referenceLimit / text.length;
  // bound it so it doesn't shrink infinitely to 0
  return Math.max(0.45, factor);
}

/**
 * Capitalization Helper (Title Case)
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Formats values based on textTransform style
 */
export function formatFieldValue(value: string, transform: "none" | "uppercase" | "lowercase" | "titlecase"): string {
  if (!value) return "";
  switch (transform) {
    case "uppercase":
      return value.toUpperCase();
    case "lowercase":
      return value.toLowerCase();
    case "titlecase":
      return toTitleCase(value);
    default:
      return value;
  }
}
