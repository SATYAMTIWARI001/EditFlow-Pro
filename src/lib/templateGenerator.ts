import { CertificateTemplate, CertificateField, FieldStyle } from "../types";

const defaultStyle = (overrides?: Partial<FieldStyle>): FieldStyle => ({
  fontFamily: "Poppins",
  fontSize: 28,
  fontWeight: "normal",
  fontColor: "#1e293b", // Slate 800
  alignment: "center",
  letterSpacing: 0,
  lineHeight: 1.2,
  rotation: 0,
  opacity: 1,
  shadowColor: "#000000",
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  strokeColor: "#000000",
  strokeWidth: 0,
  isBold: false,
  isItalic: false,
  isUnderline: false,
  textTransform: "none",
  ...overrides,
});

const defaultFields = (titleY: number): CertificateField[] => [
  {
    id: "field-name",
    name: "NAME",
    placeholder: "{{NAME}}",
    x: 50,
    y: 50,
    width: 60,
    style: defaultStyle({
      fontFamily: "Google Sans",
      fontSize: 42,
      fontWeight: "bold",
      fontColor: "#0f172a", // Slate 900
      isBold: true,
    }),
  },
  {
    id: "field-event",
    name: "EVENT",
    placeholder: "{{EVENT}}",
    x: 50,
    y: 63,
    width: 50,
    style: defaultStyle({
      fontSize: 18,
      fontWeight: "medium",
      fontColor: "#334155", // Slate 700
    }),
  },
  {
    id: "field-college",
    name: "COLLEGE",
    placeholder: "{{COLLEGE}}",
    x: 50,
    y: 57,
    width: 50,
    style: defaultStyle({
      fontSize: 16,
      fontWeight: "normal",
      fontColor: "#475569", // Slate 600
      isItalic: true,
    }),
  },
  {
    id: "field-date",
    name: "DATE",
    placeholder: "{{DATE}}",
    x: 30,
    y: 78,
    width: 25,
    style: defaultStyle({
      fontSize: 14,
      fontWeight: "normal",
      fontColor: "#475569",
    }),
  },
  {
    id: "field-organizer",
    name: "ORGANIZER",
    placeholder: "{{ORGANIZER}}",
    x: 70,
    y: 78,
    width: 25,
    style: defaultStyle({
      fontSize: 14,
      fontWeight: "normal",
      fontColor: "#475569",
    }),
  },
  {
    id: "field-cert-id",
    name: "CERTIFICATE_ID",
    placeholder: "{{CERTIFICATE_ID}}",
    x: 12,
    y: 88,
    width: 20,
    style: defaultStyle({
      fontFamily: "JetBrains Mono",
      fontSize: 10,
      fontWeight: "normal",
      fontColor: "#94a3b8", // Slate 400
      alignment: "left",
    }),
  },
];

// Helper to draw a canvas and return background base64
export function generateDefaultTemplates(): CertificateTemplate[] {
  const templates: CertificateTemplate[] = [];

  // Canvas details (high resolution 1920x1357 - standard certificate aspect ratio ~ 1.414 A4)
  const width = 1920;
  const height = 1357;

  // 1. Google Student Ambassador / Tech Developer
  (() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // White clean card background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Main Outer Border (Google Blue)
      ctx.strokeStyle = "#4285F4";
      ctx.lineWidth = 20;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Inner elegant thin border (Slate 300)
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 55, width - 110, height - 110);

      // Corner Google colored circles / accents
      // Top Left: Blue, Red
      ctx.fillStyle = "rgba(66, 133, 244, 0.15)"; // Blue
      ctx.beginPath();
      ctx.arc(0, 0, 300, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(234, 67, 53, 0.1)"; // Red
      ctx.beginPath();
      ctx.arc(0, 0, 200, 0, Math.PI * 2);
      ctx.fill();

      // Top Right: Yellow
      ctx.fillStyle = "rgba(251, 188, 5, 0.12)"; // Yellow
      ctx.beginPath();
      ctx.arc(width, 0, 250, 0, Math.PI * 2);
      ctx.fill();

      // Bottom Right: Green
      ctx.fillStyle = "rgba(52, 168, 83, 0.15)"; // Green
      ctx.beginPath();
      ctx.arc(width, height, 350, 0, Math.PI * 2);
      ctx.fill();

      // Draw elegant crest icon/seal in bottom center-ish
      ctx.strokeStyle = "#4285f4";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(width / 2, height - 350, 45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#4285f4";
      ctx.beginPath();
      ctx.arc(width / 2, height - 350, 35, 0, Math.PI * 2);
      ctx.fill();

      // Draw Ribbon Tails
      ctx.fillStyle = "#34a853";
      ctx.beginPath();
      ctx.moveTo(width / 2 - 25, height - 320);
      ctx.lineTo(width / 2 - 40, height - 250);
      ctx.lineTo(width / 2 - 20, height - 260);
      ctx.lineTo(width / 2 - 5, height - 250);
      ctx.lineTo(width / 2 - 15, height - 320);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ea4335";
      ctx.beginPath();
      ctx.moveTo(width / 2 + 15, height - 320);
      ctx.lineTo(width / 2 + 5, height - 250);
      ctx.lineTo(width / 2 + 20, height - 260);
      ctx.lineTo(width / 2 + 40, height - 250);
      ctx.lineTo(width / 2 + 25, height - 320);
      ctx.closePath();
      ctx.fill();

      // Certificate Title Text
      ctx.fillStyle = "#0f172a"; // Slate 900
      ctx.font = "bold 64px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CERTIFICATE OF EXCELLENCE", width / 2, 280);

      // Subtitle
      ctx.fillStyle = "#475569"; // Slate 600
      ctx.font = "normal 22px 'Inter', sans-serif";
      ctx.fillText("GOOGLE STUDENT AMBASSADOR PROGRAM", width / 2, 350);

      // Statement
      ctx.fillStyle = "#64748b"; // Slate 500
      ctx.font = "italic 20px 'Inter', sans-serif";
      ctx.fillText("This is proudly presented to", width / 2, 430);

      // Under name line statement
      ctx.fillStyle = "#64748b";
      ctx.font = "normal 18px 'Inter', sans-serif";
      ctx.fillText("for outstanding contribution, leadership, and successful completion of the academic year", width / 2, 560);

      // Signature line descriptors
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#cbd5e1";
      // Left line for Date
      ctx.beginPath();
      ctx.moveTo(width * 0.2, height - 280);
      ctx.lineTo(width * 0.4, height - 280);
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.fillText("DATE", width * 0.3, height - 255);

      // Right line for Organizer
      ctx.beginPath();
      ctx.moveTo(width * 0.6, height - 280);
      ctx.lineTo(width * 0.8, height - 280);
      ctx.stroke();
      ctx.fillText("PROGRAM LEADER / ORGANIZER", width * 0.7, height - 255);

      // Save Template
      templates.push({
        id: "tpl-gsa",
        name: "Google Student Ambassador",
        category: "Google Student Ambassador",
        imageSrc: canvas.toDataURL("image/png"),
        fields: defaultFields(280),
        qrCode: {
          id: "qr-gsa",
          url: "https://ai.studio/build",
          x: 88,
          y: 76,
          size: 7,
          enabled: true,
        },
        signature: {
          id: "sig-gsa",
          imageSrc: "",
          x: 65,
          y: 69,
          width: 10,
          height: 6,
          rotation: -5,
          enabled: false,
        },
        watermark: {
          id: "wm-gsa",
          text: "CertifyAI Verified",
          x: 50,
          y: 50,
          size: 10,
          rotation: -30,
          opacity: 0.05,
          enabled: false,
        },
      });
    }
  })();

  // 2. Hackathon Winner (Dark Tech Glowing Theme)
  (() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Cosmic Deep Indigo gradient background
      const grad = ctx.createRadialGradient(width / 2, height / 2, 100, width / 2, height / 2, width * 0.8);
      grad.addColorStop(0, "#0f172a"); // Slate 900
      grad.addColorStop(1, "#020617"); // Slate 950
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Neon cyan and violet grid lines (subtle background)
      ctx.strokeStyle = "rgba(139, 92, 246, 0.1)"; // Violet
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 80) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
      }
      for (let j = 0; j < height; j += 80) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(width, j);
        ctx.stroke();
      }

      // Neon glowing border lines
      ctx.strokeStyle = "#8b5cf6"; // Violet glow
      ctx.lineWidth = 6;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      ctx.strokeStyle = "#06b6d4"; // Cyan outer glow border
      ctx.lineWidth = 2;
      ctx.strokeRect(52, 52, width - 104, height - 104);

      // Tech corners
      ctx.fillStyle = "rgba(6, 182, 212, 0.2)";
      ctx.fillRect(40, 40, 60, 6);
      ctx.fillRect(40, 40, 6, 60);

      ctx.fillRect(width - 100, 40, 60, 6);
      ctx.fillRect(width - 46, 40, 6, 60);

      ctx.fillRect(40, height - 46, 60, 6);
      ctx.fillRect(40, height - 100, 6, 60);

      ctx.fillRect(width - 100, height - 46, 60, 6);
      ctx.fillRect(width - 46, height - 100, 6, 60);

      // Title Text (Neon Glowing Gold / Cyan)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 68px 'Orbitron', 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("HACKATHON CHAMPION AWARD", width / 2, 280);

      ctx.fillStyle = "#06b6d4"; // Cyan text color for event statement
      ctx.font = "bold 20px 'Space Grotesk', sans-serif";
      ctx.fillText("GLOBAL DEVFEST COMPILATION 2026", width / 2, 350);

      ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; // Muted white
      ctx.font = "italic 18px 'Inter', sans-serif";
      ctx.fillText("This certificate of outstanding victory is proudly bestowed upon", width / 2, 430);

      // Details under name
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "normal 18px 'Inter', sans-serif";
      ctx.fillText("for capturing the 1st position with innovative engineering and stellar project delivery", width / 2, 560);

      // Left line for Date
      ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
      ctx.beginPath();
      ctx.moveTo(width * 0.2, height - 280);
      ctx.lineTo(width * 0.4, height - 280);
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "bold 13px 'Space Grotesk', sans-serif";
      ctx.fillText("DATE OF ISSUE", width * 0.3, height - 255);

      // Right line for Organizer
      ctx.beginPath();
      ctx.moveTo(width * 0.6, height - 280);
      ctx.lineTo(width * 0.8, height - 280);
      ctx.stroke();
      ctx.fillText("HACKATHON JURY / CHAIRPERSON", width * 0.7, height - 255);

      // Set fields custom styling for dark mode compatibility!
      const fields = defaultFields(280);
      // Main participant Name is cyan/white glow
      fields[0].style.fontColor = "#06b6d4"; // Neon cyan
      fields[0].style.shadowColor = "rgba(6, 182, 212, 0.8)";
      fields[0].style.shadowBlur = 15;
      // Other text is bright white
      fields[1].style.fontColor = "#e2e8f0";
      fields[2].style.fontColor = "#cbd5e1";
      fields[3].style.fontColor = "#94a3b8";
      fields[4].style.fontColor = "#94a3b8";

      templates.push({
        id: "tpl-hackathon",
        name: "Hackathon Winner",
        category: "Winner",
        imageSrc: canvas.toDataURL("image/png"),
        fields,
        qrCode: {
          id: "qr-hackathon",
          url: "https://ai.studio/build",
          x: 88,
          y: 76,
          size: 7,
          enabled: true,
        },
        signature: {
          id: "sig-hackathon",
          imageSrc: "",
          x: 65,
          y: 69,
          width: 10,
          height: 6,
          rotation: -5,
          enabled: false,
        },
        watermark: {
          id: "wm-hackathon",
          text: "SECURE AI VERIFIED",
          x: 50,
          y: 50,
          size: 10,
          rotation: -25,
          opacity: 0.08,
          enabled: false,
        },
      });
    }
  })();

  // 3. Workshop Participation (Academic White-Navy Professional)
  (() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Warm ivory background
      ctx.fillStyle = "#fcfbf7";
      ctx.fillRect(0, 0, width, height);

      // Deep Navy elegant border with gold corners
      ctx.strokeStyle = "#1e3a8a"; // Navy 900
      ctx.lineWidth = 16;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // Gold thin inner line border
      ctx.strokeStyle = "#d97706"; // Amber 600 (Goldish)
      ctx.lineWidth = 3;
      ctx.strokeRect(62, 62, width - 124, height - 124);

      // Corner geometric triangles / gold designs
      ctx.fillStyle = "#d97706";
      // Top Left Corner Ribbon design
      ctx.beginPath();
      ctx.moveTo(40, 40);
      ctx.lineTo(160, 40);
      ctx.lineTo(40, 160);
      ctx.closePath();
      ctx.fill();

      // Top Right Corner Ribbon design
      ctx.beginPath();
      ctx.moveTo(width - 40, 40);
      ctx.lineTo(width - 160, 40);
      ctx.lineTo(width - 40, 160);
      ctx.closePath();
      ctx.fill();

      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(40, height - 40);
      ctx.lineTo(160, height - 40);
      ctx.lineTo(40, height - 160);
      ctx.closePath();
      ctx.fill();

      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(width - 40, height - 40);
      ctx.lineTo(width - 160, height - 40);
      ctx.lineTo(width - 40, height - 160);
      ctx.closePath();
      ctx.fill();

      // Academic watermarked background seal (huge, very faint)
      ctx.strokeStyle = "rgba(30, 58, 138, 0.02)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 350, 0, Math.PI * 2);
      ctx.stroke();

      // Elegant Serif Display Typography for Title
      ctx.fillStyle = "#1e3a8a"; // Navy
      ctx.font = "bold 64px 'Playfair Display', 'Georgia', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CERTIFICATE OF PARTICIPATION", width / 2, 280);

      // Subtitle
      ctx.fillStyle = "#d97706"; // Gold
      ctx.font = "bold 20px 'Georgia', serif";
      ctx.fillText("AWARDED BY THE ACADEMY COUNCIL", width / 2, 350);

      // Presentment statement
      ctx.fillStyle = "#4b5563"; // Gray 600
      ctx.font = "italic 19px 'Georgia', serif";
      ctx.fillText("This document certifies that", width / 2, 430);

      // Sub-text
      ctx.fillStyle = "#4b5563";
      ctx.font = "normal 18px 'Inter', sans-serif";
      ctx.fillText("has successfully participated in the advanced curriculum and professional skill development workshop", width / 2, 560);

      // Signature line descriptors
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width * 0.2, height - 280);
      ctx.lineTo(width * 0.4, height - 280);
      ctx.stroke();
      ctx.fillStyle = "#4b5563";
      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.fillText("DATE OF COMPLETION", width * 0.3, height - 255);

      // Right line for Organizer
      ctx.beginPath();
      ctx.moveTo(width * 0.6, height - 280);
      ctx.lineTo(width * 0.8, height - 280);
      ctx.stroke();
      ctx.fillText("PROGRAM DIRECTORS / CHAIRMEN", width * 0.7, height - 255);

      const fields = defaultFields(280);
      fields[0].style.fontFamily = "Georgia";
      fields[0].style.fontColor = "#1e3a8a"; // Deep Navy
      fields[1].style.fontFamily = "Georgia";
      fields[1].style.fontColor = "#d97706"; // Gold

      templates.push({
        id: "tpl-workshop",
        name: "Workshop Participation",
        category: "Participation",
        imageSrc: canvas.toDataURL("image/png"),
        fields,
        qrCode: {
          id: "qr-workshop",
          url: "https://ai.studio/build",
          x: 88,
          y: 76,
          size: 7,
          enabled: true,
        },
        signature: {
          id: "sig-workshop",
          imageSrc: "",
          x: 65,
          y: 69,
          width: 10,
          height: 6,
          rotation: -5,
          enabled: false,
        },
        watermark: {
          id: "wm-workshop",
          text: "VERIFIED CERTIFICATE",
          x: 50,
          y: 50,
          size: 10,
          rotation: -30,
          opacity: 0.04,
          enabled: false,
        },
      });
    }
  })();

  // 4. Internship Completion (Burgundy & Gold Corporate Crest)
  (() => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Warm elegant cream background
      ctx.fillStyle = "#faf6f0";
      ctx.fillRect(0, 0, width, height);

      // Rich Burgundy main border
      ctx.strokeStyle = "#7f1d1d"; // Red 900
      ctx.lineWidth = 18;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // Gold inner pinstripe
      ctx.strokeStyle = "#ca8a04"; // Yellow 600
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, width - 120, height - 120);

      // Elegant gold filigree or corners (subtle lines)
      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 1;
      // Top left corner filigree
      ctx.beginPath();
      ctx.moveTo(80, 80);
      ctx.lineTo(180, 80);
      ctx.lineTo(80, 180);
      ctx.closePath();
      ctx.stroke();

      // Top right
      ctx.beginPath();
      ctx.moveTo(width - 80, 80);
      ctx.lineTo(width - 180, 80);
      ctx.lineTo(width - 80, 180);
      ctx.closePath();
      ctx.stroke();

      // Certificate Title
      ctx.fillStyle = "#7f1d1d"; // Burgundy
      ctx.font = "bold 60px 'Times New Roman', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CERTIFICATE OF INTERNSHIP", width / 2, 280);

      ctx.fillStyle = "#ca8a04"; // Gold
      ctx.font = "bold 18px 'Inter', sans-serif";
      ctx.fillText("CORPORATE RECOGNITION AND EXCELLENCE", width / 2, 355);

      ctx.fillStyle = "#374151"; // Gray 700
      ctx.font = "italic 19px 'Times New Roman', serif";
      ctx.fillText("This certificate is honorably awarded to", width / 2, 430);

      ctx.fillStyle = "#374151";
      ctx.font = "normal 18px 'Inter', sans-serif";
      ctx.fillText("for successful completion of their professional internship term with distinguished performance", width / 2, 560);

      // Signature line descriptors
      ctx.strokeStyle = "#b91c1c";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(width * 0.2, height - 280);
      ctx.lineTo(width * 0.4, height - 280);
      ctx.stroke();
      ctx.fillStyle = "#374151";
      ctx.font = "bold 13px 'Inter', sans-serif";
      ctx.fillText("DATE OF ISSUE", width * 0.3, height - 255);

      // Right line for Organizer
      ctx.beginPath();
      ctx.moveTo(width * 0.6, height - 280);
      ctx.lineTo(width * 0.8, height - 280);
      ctx.stroke();
      ctx.fillText("MANAGING DIRECTOR / SUPERVISOR", width * 0.7, height - 255);

      const fields = defaultFields(280);
      fields[0].style.fontFamily = "Times New Roman";
      fields[0].style.fontColor = "#7f1d1d"; // Burgundy
      fields[1].style.fontFamily = "Times New Roman";
      fields[1].style.fontColor = "#ca8a04"; // Gold

      templates.push({
        id: "tpl-internship",
        name: "Internship Completion",
        category: "Internship",
        imageSrc: canvas.toDataURL("image/png"),
        fields,
        qrCode: {
          id: "qr-internship",
          url: "https://ai.studio/build",
          x: 88,
          y: 76,
          size: 7,
          enabled: true,
        },
        signature: {
          id: "sig-internship",
          imageSrc: "",
          x: 65,
          y: 69,
          width: 10,
          height: 6,
          rotation: -5,
          enabled: false,
        },
        watermark: {
          id: "wm-internship",
          text: "OFFICIAL SIGN-OFF",
          x: 50,
          y: 50,
          size: 10,
          rotation: -30,
          opacity: 0.04,
          enabled: false,
        },
      });
    }
  })();

  return templates;
}
