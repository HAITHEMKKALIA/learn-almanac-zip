import jsPDF from "jspdf";

export type TxPdfRow = {
  transaction_date: string;
  direction: "income" | "expense";
  categoryLabel: string;
  description: string | null;
  amount_tnd: number;
  payment_method: string | null;
  reference: string | null;
};

export type TxPdfOptions = {
  title: string;
  subtitle?: string;
  from: string;
  to: string;
  rows: TxPdfRow[];
};

const fmt = (n: number) => `${n.toFixed(3)} TND`;
const frDate = (d: string) => {
  try { return new Date(d).toLocaleDateString("fr-FR"); } catch { return d; }
};

export function generateTransactionsPdf(opts: TxPdfOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 12;

  const income = opts.rows.filter((r) => r.direction === "income").reduce((s, r) => s + Number(r.amount_tnd), 0);
  const expense = opts.rows.filter((r) => r.direction === "expense").reduce((s, r) => s + Number(r.amount_tnd), 0);

  const header = () => {
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, W, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(opts.title, M, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `${opts.subtitle ? opts.subtitle + " — " : ""}Période : ${frDate(opts.from)} au ${frDate(opts.to)}`,
      M,
      16,
    );
    doc.setTextColor(0, 0, 0);
  };

  header();

  // Summary
  let y = 30;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Revenus : ${fmt(income)}`, M, y);
  doc.text(`Dépenses : ${fmt(expense)}`, M + 80, y);
  doc.text(`Solde net : ${fmt(income - expense)}`, M + 160, y);

  y += 8;
  const cols = [
    { k: "date", label: "Date", w: 22 },
    { k: "dir", label: "Sens", w: 20 },
    { k: "cat", label: "Catégorie", w: 40 },
    { k: "desc", label: "Description", w: 100 },
    { k: "amt", label: "Montant", w: 28 },
    { k: "pay", label: "Mode", w: 24 },
    { k: "ref", label: "Référence", w: 30 },
  ];

  const drawHead = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(M, y - 5, W - M * 2, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    let x = M + 1;
    for (const c of cols) { doc.text(c.label, x, y); x += c.w; }
    y += 6;
    doc.setFont("helvetica", "normal");
  };
  drawHead();

  doc.setFontSize(8);
  for (const r of opts.rows) {
    if (y > H - 15) {
      doc.addPage();
      header();
      y = 30;
      drawHead();
      doc.setFontSize(8);
    }
    const desc = doc.splitTextToSize(r.description || "—", cols[3].w - 2)[0] || "—";
    const cells = [
      frDate(r.transaction_date),
      r.direction === "income" ? "Revenu" : "Dépense",
      r.categoryLabel,
      desc,
      `${r.direction === "income" ? "+" : "-"}${Number(r.amount_tnd).toFixed(3)}`,
      r.payment_method || "—",
      r.reference || "—",
    ];
    let x = M + 1;
    cells.forEach((c, i) => {
      const txt = doc.splitTextToSize(String(c), cols[i].w - 2)[0] || "";
      doc.text(txt, x, y);
      x += cols[i].w;
    });
    doc.setDrawColor(230);
    doc.line(M, y + 1.5, W - M, y + 1.5);
    y += 6;
  }

  doc.save(`rapport_transactions_${opts.from}_${opts.to}.pdf`);
}
