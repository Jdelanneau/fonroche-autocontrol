import { jsPDF } from "jspdf";
import { activeChecklistGroups, checklistTotals, formatDateFR, GAMMES, todayISO } from "./checklist";
import { FONROCHE_LOGO_BASE64 } from "./logo";
import type { Dossier, Photo } from "./types";

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const INK: [number, number, number] = [20, 24, 28];
const INK_SOFT: [number, number, number] = [60, 66, 72];
const ORANGE: [number, number, number] = [255, 122, 61];
const ORANGE_D: [number, number, number] = [214, 96, 42];
const GOLD: [number, number, number] = [255, 178, 56];
const GREEN: [number, number, number] = [37, 168, 96];
const GREEN_BG: [number, number, number] = [230, 246, 237];
const RED: [number, number, number] = [224, 70, 70];
const RED_BG: [number, number, number] = [253, 233, 233];
const GRAY_BG: [number, number, number] = [246, 247, 248];
const CARD_LINE: [number, number, number] = [228, 230, 232];
const TEXT: [number, number, number] = [28, 30, 32];
const TEXT_DIM: [number, number, number] = [120, 126, 132];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE_W = 210;
const MARGIN = 15;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM_LIMIT = 278; // last usable y before footer zone

// ---------------------------------------------------------------------------
// Small drawing helpers (kept close to jsPDF's own API so the file stays easy
// to tweak — everything is expressed in "distance from top-left", in mm).
// ---------------------------------------------------------------------------
function setFill(doc: jsPDF, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function setDraw(doc: jsPDF, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}
function setText(doc: jsPDF, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function rrect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: [number, number, number],
  stroke?: [number, number, number],
  lw = 0.3
) {
  if (fill) setFill(doc, fill);
  if (stroke) {
    setDraw(doc, stroke);
    doc.setLineWidth(lw);
  }
  const style = fill && stroke ? "FD" : fill ? "F" : "S";
  doc.roundedRect(x, y, w, h, r, r, style as any);
}

function rect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: [number, number, number]
) {
  if (fill) setFill(doc, fill);
  doc.rect(x, y, w, h, "F");
}

function hline(
  doc: jsPDF,
  x1: number,
  y: number,
  x2: number,
  color: [number, number, number] = CARD_LINE,
  lw = 0.3
) {
  setDraw(doc, color);
  doc.setLineWidth(lw);
  doc.line(x1, y, x2, y);
}

function txt(
  doc: jsPDF,
  x: number,
  y: number,
  s: string,
  opts: {
    size?: number;
    color?: [number, number, number];
    style?: "normal" | "bold" | "italic";
    align?: "left" | "center" | "right";
  } = {}
) {
  const { size = 9, color = TEXT, style = "normal", align = "left" } = opts;
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  setText(doc, color);
  doc.text(s, x, y, { align });
}

function circle(
  doc: jsPDF,
  cx: number,
  cy: number,
  r: number,
  fill?: [number, number, number],
  stroke?: [number, number, number],
  lw = 0.4
) {
  if (fill) setFill(doc, fill);
  if (stroke) {
    setDraw(doc, stroke);
    doc.setLineWidth(lw);
  }
  const style = fill && stroke ? "FD" : fill ? "F" : "S";
  doc.circle(cx, cy, r, style as any);
}

function drawCheckGlyph(doc: jsPDF, cx: number, cy: number, kind: "conforme" | "nonconforme" | "empty") {
  const r = 2.6;
  if (kind === "conforme") {
    circle(doc, cx, cy, r, GREEN_BG);
    setDraw(doc, GREEN);
    doc.setLineWidth(0.7);
    doc.setLineCap("round"); // round
    doc.line(cx - 1.15, cy + 0.1, cx - 0.25, cy + 1.0);
    doc.line(cx - 0.25, cy + 1.0, cx + 1.3, cy - 1.1);
  } else if (kind === "nonconforme") {
    circle(doc, cx, cy, r, RED_BG);
    setDraw(doc, RED);
    doc.setLineWidth(0.7);
    doc.setLineCap("round");
    doc.line(cx - 1.05, cy - 1.05, cx + 1.05, cy + 1.05);
    doc.line(cx - 1.05, cy + 1.05, cx + 1.05, cy - 1.05);
  } else {
    circle(doc, cx, cy, r, GRAY_BG, CARD_LINE, 0.4);
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

// ---------------------------------------------------------------------------
// Header / footer
// ---------------------------------------------------------------------------
function drawMainHeader(doc: jsPDF, d: Dossier) {
  rect(doc, 0, 0, PAGE_W, 32, INK);
  rect(doc, 0, 32, PAGE_W, 1.1, ORANGE);

  // The Fonroche Lighting logo is a wide wordmark (~3.7:1), not a square
  // mark — the plate below is sized to that shape so the logo is never
  // stretched/squashed. It sits on white because the wordmark's dark-grey
  // "FONROCHE" text would be unreadable directly on the dark header.
  const lx = MARGIN;
  const ly = 6;
  const lw = 74;
  const lh = 20;
  rrect(doc, lx, ly, lw, lh, 2.5, WHITE);
  if (FONROCHE_LOGO_BASE64) {
    const pad = 2;
    const availW = lw - pad * 2;
    const availH = lh - pad * 2;
    const LOGO_ASPECT = 768 / 207; // native size of the supplied logo file
    let imgW = availH * LOGO_ASPECT;
    let imgH = availH;
    if (imgW > availW) {
      imgW = availW;
      imgH = availW / LOGO_ASPECT;
    }
    const imgX = lx + pad + (availW - imgW) / 2;
    const imgY = ly + pad + (availH - imgH) / 2;
    try {
      doc.addImage(FONROCHE_LOGO_BASE64, "PNG", imgX, imgY, imgW, imgH);
    } catch {
      // fall through silently if the logo data is malformed
    }
  } else {
    txt(doc, lx + lw / 2, ly + lh / 2 + 3.2, "FL", { size: 20, color: INK, style: "bold", align: "center" });
  }

  const tx = lx + lw + 7;
  txt(doc, tx, 16, "Fiche de contrôle chantier", { size: 11.5, color: WHITE, style: "bold" });
  txt(doc, tx, 22, "Installation candélabre solaire autonome", { size: 8, color: [184, 191, 198] });

  const ref = d.ref_karlia || "—";
  const chipW = 46;
  const cx0 = PAGE_W - MARGIN - chipW;
  rrect(doc, cx0, 9, chipW, 14, 2, INK_SOFT);
  txt(doc, cx0 + chipW / 2, 15, "RÉF. KARLIA", { size: 6.3, color: [179, 186, 194], align: "center" });
  txt(doc, cx0 + chipW / 2, 20.3, ref, { size: 9.5, color: WHITE, style: "bold", align: "center" });
}

function drawContinuationHeader(doc: jsPDF, d: Dossier) {
  rect(doc, 0, 0, PAGE_W, 14, INK);
  rect(doc, 0, 14, PAGE_W, 0.8, ORANGE);
  txt(doc, MARGIN, 9, "FONROCHE LIGHTING — Fiche de contrôle chantier", { size: 8.5, color: WHITE, style: "bold" });
  txt(doc, PAGE_W - MARGIN, 9, `Réf. KARLIA : ${d.ref_karlia || "—"}`, { size: 8, color: GOLD, align: "right" });
}

function drawFooter(doc: jsPDF) {
  const page = (doc as any).internal.getCurrentPageInfo().pageNumber;
  hline(doc, MARGIN, 284, PAGE_W - MARGIN);
  txt(doc, MARGIN, 289, `Fonroche Lighting  •  Fiche de contrôle chantier  •  généré le ${formatDateFR(todayISO())}`, {
    size: 7,
    color: TEXT_DIM
  });
  txt(doc, PAGE_W - MARGIN, 289, `Page ${page}`, { size: 7, color: TEXT_DIM, align: "right" });
}

function sectionLabel(doc: jsPDF, x: number, y: number, label: string) {
  circle(doc, x + 1.5, y - 1, 1.5, ORANGE);
  txt(doc, x + 6, y, label.toUpperCase(), { size: 9.3, color: INK, style: "bold" });
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------
export async function buildPdf(d: Dossier, photos: Photo[]): Promise<jsPDF> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 0;

  function checkPageBreak(minSpace: number) {
    if (y > BOTTOM_LIMIT - minSpace) {
      drawFooter(doc);
      doc.addPage();
      drawContinuationHeader(doc, d);
      y = 22;
    }
  }

  // ---- header --------------------------------------------------------
  drawMainHeader(doc, d);
  y = 40;
  setText(doc, TEXT);

  // ---- info card -------------------------------------------------------
  const infoRows: Array<[string, string]> = [
    ["Client final", d.client_final || "—"],
    ["Installateur", d.installateur || "—"],
    ["Install. formé", d.installateur_forme === true ? "Oui" : d.installateur_forme === false ? "Non" : "—"],
    ["Vendu avec pose", d.vendu_avec_pose === true ? "Oui" : d.vendu_avec_pose === false ? "Non" : "—"]
  ];
  if (d.installateur_forme === true && d.date_formation) {
    infoRows.push(["Date de formation", formatDateFR(d.date_formation)]);
  }
  infoRows.push(["Date de fin de pose", formatDateFR(d.date_fin_pose)]);
  infoRows.push(["Date de contrôle", formatDateFR(d.date_controle)]);
  if (d.date_conformite_finale) {
    infoRows.push(["Date de conformité finale", formatDateFR(d.date_conformite_finale)]);
  }

  {
    const pad = 6;
    const colW = CONTENT_W / 2;
    const rowH = 9.2;
    const nRows = Math.ceil(infoRows.length / 2);
    const gridH = nRows * rowH;

    // Adresse / GPS gets its own full-width line at the bottom of the card
    // (can run long, so it's wrapped rather than squeezed into one column).
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    const addrLines = doc.splitTextToSize(d.adresse || "—", CONTENT_W - pad * 2);
    const addrH = 4.2 + addrLines.length * 4.4;

    const h = pad * 2 + gridH + 3 + addrH;
    checkPageBreak(h + 6);
    rrect(doc, MARGIN, y, CONTENT_W, h, 2.5, GRAY_BG, CARD_LINE, 0.3);
    infoRows.forEach(([label, value], i) => {
      const col = Math.floor(i / nRows);
      const row = i % nRows;
      const x = MARGIN + pad + col * colW;
      const ry = y + pad + row * rowH + 3.2;
      txt(doc, x, ry, label.toUpperCase(), { size: 6.3, color: TEXT_DIM, style: "bold" });
      txt(doc, x, ry + 4.6, value, { size: 9.3, color: TEXT });
    });

    const addrTop = y + pad + gridH + 3;
    hline(doc, MARGIN + pad, addrTop - 1.5, MARGIN + CONTENT_W - pad);
    txt(doc, MARGIN + pad, addrTop + 3, "ADRESSE / GPS", { size: 6.3, color: TEXT_DIM, style: "bold" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    setText(doc, TEXT);
    doc.text(addrLines, MARGIN + pad, addrTop + 7.4);

    y += h + 6;
  }

  // ---- conformity card ---------------------------------------------
  const totals = checklistTotals(d.gammes, d.produits, d.checklist, d.custom_items);
  const gammesActives = GAMMES.filter((n) => d.gammes && (d.gammes as any)[n.toLowerCase()]);

  {
    const h = 26;
    checkPageBreak(h + 6);
    rrect(doc, MARGIN, y, CONTENT_W, h, 2.5, WHITE, CARD_LINE, 0.4);
    const color: [number, number, number] =
      totals.percent === 100 ? GREEN : totals.percent < 70 ? RED : ORANGE_D;

    txt(doc, MARGIN + 8, y + 18, `${totals.percent}%`, { size: 26, color, style: "bold" });
    txt(doc, MARGIN + 8, y + 22.5, "CONFORMITÉ GLOBALE", { size: 6.6, color: TEXT_DIM, style: "bold" });

    const barX = MARGIN + 40;
    const barW = 78;
    const barY = y + 12;
    rrect(doc, barX, barY, barW, 3.4, 1.7, GRAY_BG);
    const fillW = Math.max(3.4, (barW * totals.percent) / 100);
    rrect(doc, barX, barY, fillW, 3.4, 1.7, color);
    txt(doc, barX, barY - 2.4, `${totals.conforme} / ${totals.total} points conformes`, { size: 8.3, color: TEXT });
    txt(doc, barX, y + h - 4.5, `Gamme(s) : ${gammesActives.length ? gammesActives.join(", ") : "—"}`, {
      size: 7.6,
      color: TEXT_DIM
    });
    y += h + 6;
  }

  // ---- produits installés (chips) -----------------------------------
  if ((d.produits || []).length) {
    checkPageBreak(18);
    txt(doc, MARGIN, y, "Produits installés", { size: 8, color: TEXT_DIM, style: "bold" });
    y += 5;
    let x = MARGIN;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.6);
    d.produits.forEach((p) => {
      const label = `${p.gamme} — ${p.modele}  ×${p.quantite || "—"}`;
      const w = doc.getTextWidth(label) + 7;
      if (x + w > PAGE_W - MARGIN) {
        x = MARGIN;
        y += 8.5;
        checkPageBreak(10);
      }
      rrect(doc, x, y, w, 6.4, 3.2, GRAY_BG, CARD_LINE, 0.25);
      txt(doc, x + w / 2, y + 4.4, label, { size: 7.6, color: TEXT, align: "center" });
      x += w + 3;
    });
    y += 10;
  }

  // ---- checklist groups ----------------------------------------------
  const groups = activeChecklistGroups(d.gammes, d.produits);
  groups.forEach((g) => {
    checkPageBreak(26);
    sectionLabel(doc, MARGIN, y + 3, g.title);
    y += 8.5;
    hline(doc, MARGIN, y, PAGE_W - MARGIN);
    y += 4.5;

    g.items.forEach((it) => {
      checkPageBreak(14);
      const v = d.checklist[it.id] || { conforme: false, nonConforme: false, remarque: "" };
      const kind = v.conforme ? "conforme" : v.nonConforme ? "nonconforme" : "empty";
      drawCheckGlyph(doc, MARGIN + 3, y - 1, kind);
      txt(doc, MARGIN + 8, y, it.label, { size: 8.8, color: TEXT });
      y += 5.0;

      if (it.hasTime && v.heure) {
        checkPageBreak(6);
        txt(doc, MARGIN + 8, y, `Mesuré à ${v.heure}`, { size: 7.4, color: TEXT_DIM, style: "italic" });
        y += 4.0;
      }
      if (v.remarque) {
        const lines = doc.splitTextToSize(`→ ${v.remarque}`, CONTENT_W - 8);
        checkPageBreak(lines.length * 4 + 2);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.4);
        setText(doc, TEXT_DIM);
        doc.text(lines, MARGIN + 8, y);
        y += lines.length * 4 + 1;
      }
      y += 1.6;
    });
    y += 3;
  });

  // ---- points complémentaires -----------------------------------------
  if ((d.custom_items || []).length) {
    checkPageBreak(26);
    sectionLabel(doc, MARGIN, y + 3, "Points complémentaires");
    y += 8.5;
    hline(doc, MARGIN, y, PAGE_W - MARGIN);
    y += 4.5;

    d.custom_items.forEach((ci) => {
      checkPageBreak(14);
      const kind = ci.conforme ? "conforme" : ci.nonConforme ? "nonconforme" : "empty";
      drawCheckGlyph(doc, MARGIN + 3, y - 1, kind);
      txt(doc, MARGIN + 8, y, ci.label || "(sans titre)", { size: 8.8, color: TEXT });
      y += 5.0;
      if (ci.remarque) {
        const lines = doc.splitTextToSize(`→ ${ci.remarque}`, CONTENT_W - 8);
        checkPageBreak(lines.length * 4 + 2);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.4);
        setText(doc, TEXT_DIM);
        doc.text(lines, MARGIN + 8, y);
        y += lines.length * 4 + 1;
      }
      y += 1.6;
    });
    y += 3;
  }

  // ---- contrôleur & signature -----------------------------------------
  {
    const h = 46;
    checkPageBreak(h + 6);
    sectionLabel(doc, MARGIN, y + 3, "Contrôleur & signature");
    y += 8.5;
    rrect(doc, MARGIN, y, CONTENT_W, h, 2.5, WHITE, CARD_LINE, 0.4);
    txt(doc, MARGIN + 6, y + 9, `${d.controleur_nom || "—"}${d.controleur_entreprise ? " — " + d.controleur_entreprise : ""}`, {
      size: 10,
      color: TEXT,
      style: "bold"
    });
    txt(doc, MARGIN + 6, y + 15, `Date de signature : ${d.signature_date ? formatDateFR(d.signature_date) : "—"}`, {
      size: 8.5,
      color: TEXT_DIM
    });
    if (d.signature_url) {
      const sigData = await urlToDataURL(d.signature_url);
      if (sigData) {
        try {
          doc.addImage(sigData, "PNG", MARGIN + 6, y + 18, 55, 20);
        } catch {
          // ignore malformed image
        }
      }
    }
    hline(doc, MARGIN + 6, y + h - 3, MARGIN + 70);
    y += h;
  }

  // ---- photos — always start on a fresh page --------------------------
  if (photos.length) {
    drawFooter(doc);
    doc.addPage();
    drawContinuationHeader(doc, d);
    y = 22;
    sectionLabel(doc, MARGIN, y + 3, "Photos du chantier");
    y += 8.5;
    hline(doc, MARGIN, y, PAGE_W - MARGIN);
    y += 8;

    const pw = (CONTENT_W - 6) / 2;
    const ph = 64;
    const gap = 6;
    const innerPad = 1.6;
    const imgH = ph - innerPad * 2 - 11;
    let col = 0;

    for (let idx = 0; idx < photos.length; idx++) {
      const p = photos[idx];
      if (col === 0 && y + ph > 275) {
        drawFooter(doc);
        doc.addPage();
        drawContinuationHeader(doc, d);
        y = 22;
      }
      const x = MARGIN + col * (pw + gap);

      // card + soft "shadow" (flat offset rect — avoids relying on canvas
      // opacity/GState support, which varies across jsPDF builds)
      rrect(doc, x + 1.1, y + 1.1, pw, ph, 2.5, [210, 212, 215]);
      rrect(doc, x, y, pw, ph, 2.5, WHITE, CARD_LINE, 0.3);

      const data = await urlToDataURL(p.url);
      if (data) {
        try {
          doc.addImage(data, "JPEG", x + innerPad, y + innerPad, pw - innerPad * 2, imgH);
        } catch {
          // ignore malformed image
        }
      }

      circle(doc, x + 5, y + 5, 3.4, ORANGE);
      txt(doc, x + 5, y + 6.1, String(idx + 1), { size: 7.5, color: WHITE, style: "bold", align: "center" });

      if (p.caption) {
        let capLines: string[] = doc.splitTextToSize(p.caption, pw - innerPad * 2);
        if (capLines.length > 2) {
          capLines = capLines.slice(0, 2);
          capLines[1] = capLines[1].slice(0, Math.max(0, capLines[1].length - 1)) + "…";
        }
        txt(doc, x + innerPad, y + ph - 8, capLines[0] || "", { size: 7.2, color: TEXT_DIM });
        if (capLines[1]) txt(doc, x + innerPad, y + ph - 4.2, capLines[1], { size: 7.2, color: TEXT_DIM });
      } else {
        txt(doc, x + innerPad, y + ph - 4.2, "Sans description", { size: 7.2, color: [170, 174, 178] });
      }

      col++;
      if (col > 1) {
        col = 0;
        y += ph + 7;
      }
    }
  }

  drawFooter(doc);
  return doc;
}
