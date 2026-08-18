import { jsPDF } from "jspdf";
import { activeChecklistGroups, checklistTotals, formatDateFR, GAMMES, todayISO } from "./checklist";
import type { Dossier, Photo } from "./types";

function drawCheckGlyph(doc: jsPDF, x: number, y: number, type: "conforme" | "nonconforme" | "empty") {
  const s = 3.2;
  if (type === "conforme") {
    doc.setDrawColor(63, 203, 114);
    doc.setLineWidth(0.6);
    doc.line(x, y + s * 0.55, x + s * 0.4, y + s);
    doc.line(x + s * 0.4, y + s, x + s, y);
  } else if (type === "nonconforme") {
    doc.setDrawColor(255, 92, 92);
    doc.setLineWidth(0.6);
    doc.line(x, y, x + s, y + s);
    doc.line(x, y + s, x + s, y);
  } else {
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.rect(x, y, s, s);
  }
}

async function urlToDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function slug(str: string | null | undefined): string {
  return (str || "chantier")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function summaryText(d: Dossier): string {
  const totals = checklistTotals(d.gammes, d.produits, d.checklist, d.custom_items);
  return (
    `Fiche de contrôle chantier — ${d.client_final || "Client"}\n` +
    `Réf. KARLIA : ${d.ref_karlia || "—"}\n` +
    `Conformité : ${totals.conforme}/${totals.total} points conformes (${totals.percent}%)\n` +
    `Date de contrôle : ${formatDateFR(d.date_controle)}\n` +
    `Contrôleur : ${d.controleur_nom || "—"}`
  );
}

export async function buildPdf(d: Dossier, photos: Photo[]): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const marginX = 16;
  let y = 0;

  function drawFooter() {
    const page = (doc as any).internal.getCurrentPageInfo().pageNumber;
    doc.setFontSize(7.5);
    doc.setTextColor(150);
    doc.text(`Fonroche Lighting — Fiche de contrôle chantier — généré le ${formatDateFR(todayISO())}`, marginX, 291);
    doc.text(`Page ${page}`, pageW - marginX, 291, { align: "right" });
  }

  function checkPageBreak(minSpace: number) {
    if (y > 297 - minSpace) {
      doc.addPage();
      drawFooter();
      y = 20;
    }
  }

  // header band
  doc.setFillColor(20, 24, 28);
  doc.rect(0, 0, pageW, 26, "F");
  doc.setTextColor(255, 178, 56);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("FONROCHE LIGHTING", marginX, 12);
  doc.setTextColor(240, 242, 244);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Fiche de contrôle chantier — installation candélabre solaire", marginX, 19);

  y = 34;
  doc.setTextColor(30, 30, 30);

  function infoLine(label: string, value: string | null | undefined) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "—"), marginX + 42, y);
    y += 6;
  }

  infoLine("Client final", d.client_final);
  infoLine("Réf. KARLIA", d.ref_karlia);
  infoLine("Installateur", d.installateur);
  infoLine("Installateur formé", d.installateur_forme === true ? "Oui" : d.installateur_forme === false ? "Non" : "—");
  if (d.installateur_forme === true && d.date_formation) infoLine("Date de formation", formatDateFR(d.date_formation));
  infoLine("Chantier vendu avec pose", d.vendu_avec_pose === true ? "Oui" : d.vendu_avec_pose === false ? "Non" : "—");
  infoLine("Date de fin de pose", formatDateFR(d.date_fin_pose));
  infoLine("Date de contrôle", formatDateFR(d.date_controle));
  if (d.date_conformite_finale) infoLine("Date de conformité finale", formatDateFR(d.date_conformite_finale));
  infoLine("Adresse / GPS", d.adresse);

  const gammesActives = GAMMES.filter((n) => d.gammes && (d.gammes as any)[n.toLowerCase()]);
  infoLine("Gamme(s) produit", gammesActives.length ? gammesActives.join(", ") : "—");

  if ((d.produits || []).length) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Produits installés", marginX, y);
    y += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    d.produits.forEach((p) => {
      checkPageBreak(8);
      doc.text(`• ${p.gamme} — ${p.modele}  ×${p.quantite || "—"}`, marginX + 2, y);
      y += 5;
    });
    y += 2;
  }

  const totals = checklistTotals(d.gammes, d.produits, d.checklist, d.custom_items);
  y += 2;
  doc.setDrawColor(220);
  doc.line(marginX, y, pageW - marginX, y);
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Conformité globale : ${totals.conforme}/${totals.total} points conformes (${totals.percent}%)`, marginX, y);
  y += 8;

  const groups = activeChecklistGroups(d.gammes, d.produits);
  groups.forEach((g) => {
    checkPageBreak(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 122, 61);
    doc.text(g.title.toUpperCase(), marginX, y);
    y += 5.5;
    doc.setTextColor(30, 30, 30);
    g.items.forEach((it) => {
      checkPageBreak(14);
      const v = d.checklist[it.id] || { conforme: false, nonConforme: false, remarque: "" };
      const type = v.conforme ? "conforme" : v.nonConforme ? "nonconforme" : "empty";
      drawCheckGlyph(doc, marginX, y - 3, type);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(it.label, marginX + 7, y);
      y += 5;
      if (it.hasTime && v.heure) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(110);
        doc.text(`Mesuré à ${v.heure}`, marginX + 7, y);
        y += 4;
        doc.setTextColor(30, 30, 30);
      }
      if (v.remarque) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(110);
        const lines = doc.splitTextToSize(`Remarque : ${v.remarque}`, pageW - marginX * 2 - 7);
        doc.text(lines, marginX + 7, y);
        y += lines.length * 4 + 1;
        doc.setTextColor(30, 30, 30);
      }
      y += 1.5;
    });
    y += 3;
  });

  if ((d.custom_items || []).length) {
    checkPageBreak(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 122, 61);
    doc.text("POINTS COMPLÉMENTAIRES", marginX, y);
    y += 5.5;
    doc.setTextColor(30, 30, 30);
    d.custom_items.forEach((ci) => {
      checkPageBreak(14);
      const type = ci.conforme ? "conforme" : ci.nonConforme ? "nonconforme" : "empty";
      drawCheckGlyph(doc, marginX, y - 3, type);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(ci.label || "(sans titre)", marginX + 7, y);
      y += 5;
      if (ci.remarque) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(110);
        const lines = doc.splitTextToSize(`Remarque : ${ci.remarque}`, pageW - marginX * 2 - 7);
        doc.text(lines, marginX + 7, y);
        y += lines.length * 4 + 1;
        doc.setTextColor(30, 30, 30);
      }
      y += 1.5;
    });
    y += 3;
  }

  // controller / signature
  checkPageBreak(46);
  doc.setDrawColor(220);
  doc.line(marginX, y, pageW - marginX, y);
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Contrôleur : ${d.controleur_nom || "—"}${d.controleur_entreprise ? " — " + d.controleur_entreprise : ""}`,
    marginX,
    y
  );
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Date de signature : ${d.signature_date ? formatDateFR(d.signature_date) : "—"}`, marginX, y);
  y += 4;
  if (d.signature_url) {
    const sigData = await urlToDataURL(d.signature_url);
    if (sigData) {
      try {
        doc.addImage(sigData, "PNG", marginX, y, 55, 24);
      } catch {
        // ignore malformed image
      }
    }
  }

  // photos — start on a fresh page right after the signature block
  if (photos.length) {
    doc.addPage();
    drawFooter();
    y = 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30, 30, 30);
    doc.text("Photos du chantier", marginX, y);
    y += 8;

    const pw = 85;
    const ph = 58;
    const gap = 6;
    const rowH = 80;
    let col = 0;

    for (let idx = 0; idx < photos.length; idx++) {
      const p = photos[idx];
      if (col === 0 && y + rowH > 283) {
        doc.addPage();
        drawFooter();
        y = 20;
      }
      const x = marginX + col * (pw + gap);
      const data = await urlToDataURL(p.url);
      if (data) {
        try {
          doc.addImage(data, "JPEG", x, y, pw, ph);
        } catch {
          // ignore malformed image
        }
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(140);
      doc.text(`Photo ${idx + 1}`, x, y + ph + 3.5);
      doc.setTextColor(30, 30, 30);
      if (p.caption) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(90);
        let capLines: string[] = doc.splitTextToSize(p.caption, pw);
        if (capLines.length > 2) {
          capLines = capLines.slice(0, 2);
          capLines[1] = capLines[1].slice(0, Math.max(0, capLines[1].length - 1)) + "…";
        }
        doc.text(capLines, x, y + ph + 7.5);
        doc.setTextColor(30, 30, 30);
      }
      col++;
      if (col > 1) {
        col = 0;
        y += rowH;
      }
    }
  }

  drawFooter();
  return doc;
}
