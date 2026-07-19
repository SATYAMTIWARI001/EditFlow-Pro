import QRCode from "qrcode";

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
