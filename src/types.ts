export type FontWeight = "light" | "normal" | "medium" | "bold";
export type TextAlignment = "left" | "center" | "right";
export type TextTransform = "none" | "uppercase" | "lowercase" | "titlecase";

export interface CharacterOverride {
  char?: string;          // Custom letter replacement (e.g. 'A', '★', 'Ë')
  color?: string;         // Individual character color
  fontSizeScale?: number; // Size multiplier for this letter (e.g. 1.4 for drop cap)
  offsetY?: number;       // Vertical shift in px (e.g. -6px for superscript)
  bold?: boolean;         // Per-character bold
  italic?: boolean;       // Per-character italic
  underline?: boolean;    // Per-character underline
  bgColor?: string;       // Background highlight for this specific letter
}

export interface FieldStyle {
  fontFamily: string;
  fontSize: number; // in px, relative to template scale
  fontWeight: FontWeight;
  fontColor: string;
  alignment: TextAlignment;
  letterSpacing: number; // in px
  wordSpacing?: number; // in px
  lineHeight: number;
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  strokeColor: string;
  strokeWidth: number;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  textTransform: TextTransform;

  // Background Highlight Box / Badge
  bgHighlightEnabled?: boolean;
  bgHighlightColor?: string;
  bgHighlightPadding?: number;
  bgHighlightRadius?: number;

  // Gradient Text Fill
  gradientEnabled?: boolean;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
}

export interface CertificateField {
  id: string;
  name: string; // e.g. "NAME", "DATE", "COLLEGE", "EVENT", "ORGANIZER", "POSITION", "CERTIFICATE_ID", "YEAR"
  placeholder: string; // e.g. "{{NAME}}"
  x: number; // percent from left (0-100)
  y: number; // percent from top (0-100)
  width: number; // percent width (0-100)
  style: FieldStyle;

  // Character-level overrides & direct string value customization
  customText?: string; // Direct character-by-character string override
  characterOverrides?: Record<number, CharacterOverride>; // Individual letter customization indexed by position
}

export interface QRCodeConfig {
  id: string;
  url: string;
  x: number; // percent
  y: number; // percent
  size: number; // percent of template width
  enabled: boolean;
}

export interface SignatureConfig {
  id: string;
  imageSrc: string; // Base64 transparent png
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  enabled: boolean;
}

export interface WatermarkConfig {
  id: string;
  text: string;
  imageSrc?: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  opacity: number;
  enabled: boolean;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  category: string; // "Hackathon" | "Workshop" | "Internship" | "Google Student Ambassador" | "Participation" | "Winner" | "Volunteer" | "Completion"
  imageSrc: string; // Original template background (Data URL or base64)
  fields: CertificateField[];
  qrCode: QRCodeConfig;
  signature: SignatureConfig;
  watermark: WatermarkConfig;
  isUserUploaded?: boolean;
}

export interface ParticipantRecord {
  id: string;
  certificateId: string; // GSA-2026-XXXX
  name: string;
  date: string;
  college: string;
  event: string;
  organizer: string;
  position: string;
  year: string;
  generatedAt: string;
}

export interface VerificationRecord {
  certificateId: string;
  participantName: string;
  templateName: string;
  category: string;
  date: string;
  college: string;
  event: string;
  organizer: string;
  position: string;
  year: string;
  generatedAt: string;
}
