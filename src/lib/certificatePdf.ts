import jsPDF from "jspdf";

export type CertificateData = {
  studentName: string;
  schoolName: string;
  schoolLogoUrl?: string | null;
  subLevelCode: string; // e.g. A2.1
  subLevelName?: string; // e.g. A2.1 — Einstieg
  finalScore: number;
  mention: string; // Passable / Bien / Très bien / Excellent
  certificateNumber: string;
  issuedAt: Date;
  sessionDate?: string; // date de la session d'examen
  directorName?: string;
  teacherName?: string;
  city?: string;
};

const FLAG_DE_DATA_URL =
  // Simple 3x1 tricolor (black/red/gold) rendered as SVG data URL
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 5 3'><rect width='5' height='1' y='0' fill='#000'/><rect width='5' height='1' y='1' fill='#DD0000'/><rect width='5' height='1' y='2' fill='#FFCE00'/></svg>`,
  );

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Build a Goethe-style A4 landscape certificate PDF. Returns Blob. */
export async function buildCertificatePdf(d: CertificateData): Promise<Blob> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(253, 251, 246);
  doc.rect(0, 0, W, H, "F");

  // Ornamental border (double frame)
  doc.setDrawColor(184, 134, 11); // gold
  doc.setLineWidth(1.4);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setLineWidth(0.3);
  doc.rect(11, 11, W - 22, H - 22);

  // Corner ornaments (simple diamond marks)
  const drawCorner = (x: number, y: number) => {
    doc.setFillColor(184, 134, 11);
    doc.circle(x, y, 1.6, "F");
  };
  drawCorner(14, 14); drawCorner(W - 14, 14);
  drawCorner(14, H - 14); drawCorner(W - 14, H - 14);

  // School logo (top-left)
  if (d.schoolLogoUrl) {
    const logo = await loadImageAsDataUrl(d.schoolLogoUrl);
    if (logo) {
      try { doc.addImage(logo, "PNG", 20, 18, 28, 28); } catch {}
    }
  }

  // German flag (top-right)
  try {
    doc.addImage(FLAG_DE_DATA_URL, "SVG", W - 48, 20, 28, 17);
  } catch {
    // Fallback: draw rectangles
    doc.setFillColor(0, 0, 0); doc.rect(W - 48, 20, 28, 5.6, "F");
    doc.setFillColor(221, 0, 0); doc.rect(W - 48, 25.6, 28, 5.6, "F");
    doc.setFillColor(255, 206, 0); doc.rect(W - 48, 31.2, 28, 5.6, "F");
  }

  // Title
  doc.setTextColor(20, 20, 20);
  doc.setFont("times", "bold");
  doc.setFontSize(34);
  doc.text("ZERTIFIKAT", W / 2, 48, { align: "center" });
  doc.setFontSize(14);
  doc.setFont("times", "italic");
  doc.setTextColor(120, 90, 20);
  doc.text("Certificat de langue allemande", W / 2, 56, { align: "center" });

  // Divider
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.6);
  doc.line(W / 2 - 40, 60, W / 2 + 40, 60);

  // Awarded to
  doc.setFont("times", "normal");
  doc.setFontSize(13);
  doc.setTextColor(60, 60, 60);
  doc.text("Wird hiermit verliehen an / Décerné à", W / 2, 72, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(28);
  doc.setTextColor(20, 20, 20);
  doc.text(d.studentName, W / 2, 88, { align: "center" });

  // Underline the name
  const nameWidth = doc.getTextWidth(d.studentName);
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - nameWidth / 2 - 4, 91, W / 2 + nameWidth / 2 + 4, 91);

  // Body text
  doc.setFont("times", "normal");
  doc.setFontSize(13);
  doc.setTextColor(50, 50, 50);
  const line1 = `für den erfolgreichen Abschluss der Prüfung auf dem Niveau`;
  doc.text(line1, W / 2, 102, { align: "center" });

  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(184, 134, 11);
  doc.text(d.subLevelName || d.subLevelCode, W / 2, 114, { align: "center" });

  // Score + mention
  doc.setFont("times", "normal");
  doc.setFontSize(13);
  doc.setTextColor(50, 50, 50);
  doc.text(
    `Endnote / Note finale : ${d.finalScore}/100  —  Bewertung / Mention : ${d.mention}`,
    W / 2, 126, { align: "center" },
  );

  // Session date
  if (d.sessionDate) {
    doc.setFontSize(11);
    doc.setTextColor(90, 90, 90);
    doc.text(`Prüfungsdatum / Date de session : ${d.sessionDate}`, W / 2, 134, { align: "center" });
  }

  // School line
  doc.setFont("times", "italic");
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text(`Ausgestellt von / Délivré par : ${d.schoolName}`, W / 2, 144, { align: "center" });

  // Signatures
  const sigY = H - 40;
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.3);
  doc.line(35, sigY, 95, sigY);
  doc.line(W - 95, sigY, W - 35, sigY);

  doc.setFont("times", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(d.teacherName || "Der Prüfer / Le professeur", 65, sigY + 5, { align: "center" });
  doc.text(d.directorName || "Der Direktor / Le directeur", W - 65, sigY + 5, { align: "center" });

  // Seal (center-bottom)
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.6);
  doc.circle(W / 2, sigY + 2, 12);
  doc.circle(W / 2, sigY + 2, 9);
  doc.setFont("times", "bold");
  doc.setFontSize(8);
  doc.setTextColor(184, 134, 11);
  doc.text("DEUTSCH", W / 2, sigY - 1, { align: "center" });
  doc.text("MEISTER", W / 2, sigY + 3, { align: "center" });
  doc.setFontSize(6);
  doc.text("SIEGEL", W / 2, sigY + 7, { align: "center" });

  // Footer: number + date + city
  doc.setFont("times", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  const footerLeft = `N° ${d.certificateNumber}`;
  const footerRight = `${d.city ? d.city + ", " : ""}${d.issuedAt.toLocaleDateString("de-DE")}`;
  doc.text(footerLeft, 20, H - 16);
  doc.text(footerRight, W - 20, H - 16, { align: "right" });

  return doc.output("blob");
}

export function computeMention(score: number): string {
  if (score >= 90) return "Ausgezeichnet / Excellent";
  if (score >= 80) return "Sehr gut / Très bien";
  if (score >= 70) return "Gut / Bien";
  if (score >= 60) return "Befriedigend / Assez bien";
  return "Bestanden / Passable";
}
