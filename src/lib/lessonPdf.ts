import jsPDF from "jspdf";
import type { EnrichedLesson } from "@/data/lessonEnrichment";
import { formatSeconds } from "@/data/lessonEnrichment";
import { HOEREN_SCENES } from "@/data/hoerenScenes";
import { AMBIANCES } from "@/lib/ambientAudio";
import { getLessonStats } from "@/lib/lessonStats";

interface PdfExtraOptions {
  /** Inclure les scènes Hören du temps + ambiances utilisées */
  includeHoerenScenes?: boolean;
  /** Inclure l'encart prononciation (✓/○) à partir des stats locales */
  includePronunciation?: boolean;
  /** Inclure la Fiche de révision (mots/heures faibles + lien vers exercices ciblés) */
  includeRevisionSheet?: boolean;
}

/**
 * Génère un PDF imprimable d'une leçon enrichie.
 * Sections : couverture, cours, vocabulaire, exercices imprimables, solutions,
 * Hören (résumé + scènes + ambiances), prononciation (✓/○).
 */
export function exportLessonToPdf(
  lesson: EnrichedLesson,
  unitTitle: string,
  unitId = "u1",
  opts: PdfExtraOptions = { includeHoerenScenes: true, includePronunciation: true, includeRevisionSheet: true },
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48; // marge
  let y = M;

  const safe = (s: string) => s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ""); // strip emojis (jsPDF font ne les rend pas)

  const addPageIfNeeded = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };

  const writeWrapped = (text: string, maxWidth: number, lineHeight = 14, fontSize = 10) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(safe(text), maxWidth);
    for (const line of lines) {
      addPageIfNeeded(lineHeight);
      doc.text(line, M, y);
      y += lineHeight;
    }
  };

  // ====== Page de couverture ======
  doc.setFillColor(59, 130, 246);
  doc.rect(0, 0, W, 120, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(safe(lesson.title), M, 70);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(safe(unitTitle), M, 92);

  doc.setTextColor(40, 40, 40);
  y = 160;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Sommaire", M, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const toc = [
    `1. Cours`,
    `2. Vocabulaire (${lesson.vocab.length} mots)`,
    `3. Exercices imprimables (${lesson.exercises.length})`,
    `4. Compréhension orale Hören (~${formatSeconds(lesson.estimatedSeconds)})`,
    ...(opts.includeHoerenScenes ? [`5. Scènes Hören (avec ambiance)`] : []),
    ...(opts.includePronunciation ? [`6. Prononciation (vos résultats ✓/○)`] : []),
    ...(opts.includeRevisionSheet ? [`7. Fiche de révision (mots/heures faibles + reprise)`] : []),
  ];
  for (const item of toc) {
    doc.text(item, M, y);
    y += 16;
  }

  y += 12;
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y, W - M, y);
  y += 18;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Document généré par DeutschMeister", M, y);
  doc.setTextColor(40, 40, 40);

  // ====== Section Cours ======
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("1. Cours", M, y);
  y += 24;
  doc.setFont("helvetica", "normal");
  const courseLines = lesson.content.split("\n");
  for (const line of courseLines) {
    if (!line.trim()) { y += 8; continue; }
    const isHeading = line.startsWith("**") && line.endsWith("**");
    if (isHeading) {
      addPageIfNeeded(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(59, 130, 246);
      doc.text(safe(line.replace(/\*\*/g, "")), M, y);
      y += 18;
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "normal");
    } else {
      writeWrapped(line.replace(/\*\*/g, ""), W - 2 * M, 13, 10);
    }
  }

  // ====== Section Vocabulaire ======
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`2. Vocabulaire (${lesson.vocab.length} mots)`, M, y);
  y += 24;

  // Header tableau
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(M, y - 12, W - 2 * M, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.text("Allemand", M + 6, y);
  doc.text("Français", M + 180, y);
  doc.text("Exemple", M + 320, y);
  y += 14;
  doc.setFont("helvetica", "normal");

  for (const v of lesson.vocab) {
    addPageIfNeeded(28);
    const exLines = doc.splitTextToSize(safe(v.ex || "—"), W - M - 320 - 6);
    const rowHeight = Math.max(18, exLines.length * 12 + 4);
    doc.setDrawColor(230, 230, 230);
    doc.line(M, y + rowHeight - 4, W - M, y + rowHeight - 4);
    doc.setFont("helvetica", "bold");
    doc.text(safe(v.de), M + 6, y + 4);
    doc.setFont("helvetica", "normal");
    doc.text(safe(v.fr), M + 180, y + 4);
    let exY = y + 4;
    for (const l of exLines) {
      doc.text(l, M + 320, exY);
      exY += 12;
    }
    y += rowHeight;
  }

  // ====== Section Exercices imprimables ======
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`3. Exercices à imprimer (${lesson.exercises.length})`, M, y);
  y += 18;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("Répondez sur les lignes prévues. Solutions à la fin.", M, y);
  doc.setTextColor(40, 40, 40);
  y += 18;

  lesson.exercises.forEach((ex, i) => {
    addPageIfNeeded(70);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${i + 1}. [${ex.type.toUpperCase()}]`, M, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    writeWrapped(ex.q, W - 2 * M, 13, 10);

    if (ex.type === "qcm" && ex.opts) {
      ex.opts.forEach((o, j) => {
        addPageIfNeeded(14);
        doc.text(`   ${String.fromCharCode(65 + j)}. ${safe(o)}`, M + 10, y);
        y += 13;
      });
    } else {
      // Lignes pour répondre
      for (let k = 0; k < 2; k++) {
        addPageIfNeeded(14);
        doc.setDrawColor(180, 180, 180);
        doc.line(M + 10, y + 6, W - M, y + 6);
        y += 14;
      }
    }
    y += 8;
  });

  // ====== Solutions ======
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Solutions", M, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  lesson.exercises.forEach((ex, i) => {
    addPageIfNeeded(18);
    let answer = "";
    if (ex.type === "qcm" && ex.opts) answer = ex.opts[ex.ans as number] ?? "";
    else answer = String(ex.ans ?? "");
    doc.text(`${i + 1}. ${safe(answer)}`, M, y);
    y += 14;
  });

  // ====== Section Hören ======
  doc.addPage();
  y = M;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("4. Compréhension orale (Hören)", M, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Durée d'écoute estimée : ~${formatSeconds(lesson.estimatedSeconds)}`, M, y);
  y += 16;
  doc.text(`Nombre de séquences : ${lesson.hoerenItems.length}`, M, y);
  y += 22;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text("Réécoutez chaque séquence en cachant la traduction française.", M, y);
  doc.setTextColor(40, 40, 40);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  lesson.hoerenItems.forEach((v, i) => {
    addPageIfNeeded(20);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}. ${safe(v.de)}`, M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(110, 110, 110);
    doc.text(`(${safe(v.fr)})`, M + 250, y);
    doc.setTextColor(40, 40, 40);
    y += 14;
  });

  // ====== Section Scenes Horen (ambiances + duree par scene) ======
  if (opts.includeHoerenScenes) {
    const timeScenes = HOEREN_SCENES.filter(s =>
      s.id.includes("time") || s.id.includes("train") || s.id.includes("appointment") ||
      s.id.includes("alarm") || s.category === "transport"
    );
    if (timeScenes.length > 0) {
      doc.addPage();
      y = M;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("5. Scenes Horen (avec ambiance)", M, y);
      y += 22;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text("Chaque scene se joue dans l'app avec un fond sonore reel (rue, train...).", M, y);
      doc.setTextColor(40, 40, 40);
      y += 18;

      const usedAmbiances = Array.from(new Set(timeScenes.map(s => s.ambiance)));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Ambiances sonores utilisees :", M, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      for (const a of usedAmbiances) {
        const meta = AMBIANCES.find(x => x.id === a);
        if (!meta) continue;
        addPageIfNeeded(14);
        doc.text(`- ${safe(meta.label)}`, M + 6, y);
        y += 13;
      }
      y += 10;

      for (const s of timeScenes) {
        addPageIfNeeded(60);
        const meta = AMBIANCES.find(x => x.id === s.ambiance);
        const estSec = s.lines.length * 5;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(59, 130, 246);
        doc.text(safe(s.title), M, y);
        doc.setTextColor(40, 40, 40);
        y += 14;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(110, 110, 110);
        doc.text(
          `Ambiance : ${safe(meta?.label ?? s.ambiance)} - ${s.lines.length} repliques - duree ~${formatSeconds(estSec)}`,
          M, y,
        );
        doc.setTextColor(40, 40, 40);
        y += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        for (const line of s.lines) {
          addPageIfNeeded(20);
          doc.setFont("helvetica", "bold");
          doc.text(`${safe(line.speaker)}:`, M + 6, y);
          doc.setFont("helvetica", "normal");
          const wrapped = doc.splitTextToSize(safe(line.de), W - M - 110);
          doc.text(wrapped, M + 70, y);
          y += wrapped.length * 11;
          doc.setTextColor(110, 110, 110);
          const fr = doc.splitTextToSize(`(${safe(line.fr)})`, W - M - 110);
          doc.text(fr, M + 70, y);
          doc.setTextColor(40, 40, 40);
          y += fr.length * 11 + 4;
        }
        y += 10;
      }
    }
  }

  // ====== Section Prononciation (vos resultats) ======
  if (opts.includePronunciation) {
    const stats = getLessonStats(lesson.id, unitId);
    const ok = stats.pronunciationOk ?? [];
    const ko = stats.pronunciationKo ?? [];
    const weak = stats.weakWords ?? [];
    if (ok.length + ko.length + weak.length > 0) {
      doc.addPage();
      y = M;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("6. Prononciation (vos resultats)", M, y);
      y += 22;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 139, 34);
      doc.text(`OK Maitrises (${ok.length})`, M, y);
      doc.setTextColor(200, 70, 70);
      doc.text(`A retravailler (${ko.length})`, M + (W - 2 * M) / 2, y);
      doc.setTextColor(40, 40, 40);
      y += 16;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const half = (W - 2 * M) / 2 - 10;
      const colY0 = y;
      let yL = colY0, yR = colY0;
      ok.forEach(w => {
        const lines = doc.splitTextToSize(`v ${safe(w)}`, half);
        if (yL + lines.length * 12 > H - M) { doc.addPage(); yL = M; }
        doc.text(lines, M, yL);
        yL += lines.length * 12;
      });
      ko.forEach(w => {
        const lines = doc.splitTextToSize(`o ${safe(w)}`, half);
        if (yR + lines.length * 12 > H - M) { doc.addPage(); yR = M; }
        doc.text(lines, M + (W - 2 * M) / 2, yR);
        yR += lines.length * 12;
      });
      y = Math.max(yL, yR) + 12;

      if (weak.length > 0) {
        addPageIfNeeded(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("Mots faibles (toutes categories)", M, y);
        y += 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const txt = weak.map(w => `- ${safe(w)}`).join("   ");
        const wrapped = doc.splitTextToSize(txt, W - 2 * M);
        for (const l of wrapped) {
          addPageIfNeeded(13);
          doc.text(l, M, y);
          y += 13;
        }
      }
    }
  }

  // ====== Section Fiche de révision (mots/heures faibles + lien) ======
  if (opts.includeRevisionSheet) {
    const stats = getLessonStats(lesson.id, unitId);
    const weakWords = stats.weakWords ?? [];
    const weakTimes = stats.weakTimes ?? [];
    if (weakWords.length + weakTimes.length > 0) {
      doc.addPage();
      y = M;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("7. Fiche de revision", M, y);
      y += 22;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(110, 110, 110);
      doc.text("Vos points faibles compiles. Lien vers la reprise ciblee dans l'app : Stats > Fiche de revision.", M, y);
      doc.setTextColor(40, 40, 40);
      y += 18;

      if (weakWords.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Mots a retravailler (${weakWords.length})`, M, y);
        y += 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const txt = weakWords.map(w => `- ${safe(w)}`).join("   ");
        const wrapped = doc.splitTextToSize(txt, W - 2 * M);
        for (const l of wrapped) { addPageIfNeeded(13); doc.text(l, M, y); y += 13; }
        y += 8;
      }

      if (weakTimes.length > 0) {
        addPageIfNeeded(40);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Heures a revoir (${weakTimes.length})`, M, y);
        y += 16;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        for (const hhmm of weakTimes) {
          addPageIfNeeded(14);
          const [hh, mm] = hhmm.split(":").map(n => parseInt(n, 10));
          const isPm = hh >= 12;
          const h12 = (hh % 12) || 12;
          doc.text(
            `- ${hhmm} (24h)  =  ${h12}:${String(mm).padStart(2, "0")} ${isPm ? "PM" : "AM"} (12h)`,
            M + 6, y,
          );
          y += 13;
        }
        y += 8;
      }

      addPageIfNeeded(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246);
      doc.text("➜ Lancez 'Reprise ciblee' dans l'app pour generer des exercices automatiques :", M, y);
      doc.setTextColor(40, 40, 40);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("Onglet Stats > Fiche de revision > Lancer une session ciblee.", M + 6, y);
      doc.text("Inclut QCM mots faibles + horloges + conversion 24h <-> 12h (am/pm).", M + 6, y + 13);
    }
  }

  // Numérotation pages
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${p} / ${pageCount}`, W - M, H - 20, { align: "right" });
    doc.setTextColor(40, 40, 40);
  }

  const filename = `${lesson.id}-${safe(lesson.title).replace(/\s+/g, "_").slice(0, 40)}.pdf`;
  doc.save(filename);
}
