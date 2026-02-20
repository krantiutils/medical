import bwipjs from "bwip-js";

/**
 * Generate a Code128 barcode as a data URL (PNG).
 * Works server-side (Node canvas) and client-side (browser canvas).
 */
export async function generateBarcodeDataUrl(text: string): Promise<string> {
  const canvas = document.createElement("canvas");
  bwipjs.toCanvas(canvas, {
    bcid: "code128",
    text,
    scale: 3,
    height: 10, // mm
    includetext: true,
    textxalign: "center",
    textsize: 8,
  });
  return canvas.toDataURL("image/png");
}

interface LabLabelData {
  orderNumber: string;
  patientName: string;
  patientNumber: string;
  tests: string; // comma-separated test abbreviations
  date: string; // formatted date string
  priority?: string;
}

/**
 * Generate printable HTML for 2 thermal labels (50mm x 25mm each):
 * one for the requisition form, one for the sample vial.
 *
 * Opens a print window with @page sizing for thermal printers.
 */
export async function printLabLabels(data: LabLabelData): Promise<void> {
  const barcodeDataUrl = await generateBarcodeDataUrl(data.orderNumber);

  const priorityBadge =
    data.priority && data.priority !== "ROUTINE"
      ? `<span style="background:${data.priority === "STAT" ? "#D02020" : "#F0C020"};color:${data.priority === "STAT" ? "#fff" : "#121212"};padding:1px 4px;font-size:7px;font-weight:bold;border-radius:2px;">${data.priority}</span>`
      : "";

  const labelHtml = `
    <div class="label">
      <div class="row">
        <div class="left">
          <div class="patient-name">${escapeHtml(data.patientName)}</div>
          <div class="patient-num">${escapeHtml(data.patientNumber)}</div>
        </div>
        <div class="right">
          ${priorityBadge}
        </div>
      </div>
      <div class="tests">${escapeHtml(data.tests)}</div>
      <div class="barcode-row">
        <img src="${barcodeDataUrl}" class="barcode" />
      </div>
      <div class="date">${escapeHtml(data.date)}</div>
    </div>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lab Labels - ${escapeHtml(data.orderNumber)}</title>
      <style>
        @page {
          size: 50mm 25mm;
          margin: 1mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8px;
          line-height: 1.2;
        }
        .label {
          width: 48mm;
          height: 23mm;
          padding: 1mm;
          page-break-after: always;
          overflow: hidden;
        }
        .label:last-child {
          page-break-after: auto;
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .patient-name {
          font-weight: bold;
          font-size: 9px;
          max-width: 35mm;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .patient-num {
          font-size: 7px;
          color: #333;
        }
        .tests {
          font-size: 7px;
          color: #555;
          margin: 0.5mm 0;
          max-height: 3mm;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .barcode-row {
          text-align: center;
          margin: 0.5mm 0;
        }
        .barcode {
          max-width: 44mm;
          max-height: 10mm;
          height: auto;
        }
        .date {
          font-size: 6px;
          color: #666;
          text-align: right;
        }
        .no-print { text-align: center; margin-top: 10px; }
        @media print {
          .no-print { display: none !important; }
        }
        @media screen {
          body { padding: 20px; background: #eee; }
          .label {
            background: white;
            border: 1px dashed #999;
            margin: 10px auto;
          }
        }
      </style>
    </head>
    <body>
      ${labelHtml}
      ${labelHtml}
      <div class="no-print">
        <p style="font-size:12px;margin-bottom:8px;">2 labels: Form + Vial</p>
        <button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer;border:2px solid #121212;background:#1040C0;color:white;font-weight:bold;">
          Print Labels
        </button>
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
