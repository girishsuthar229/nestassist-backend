import PDFDocument from "pdfkit";
import { Stream } from "stream";
import path from "path";
import fs from "fs";
export interface InvoiceData {
  invoiceNumber: string;
  bookingId: number;
  customerName: string;
  customerAddress: string;
  serviceName: string;
  servicePartnerName?: string;
  servicePartnerPhone?: string;
  subTotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  currency: string;
  date: Date | string;
  status: string;
  couponCode?: string;
  quantity?: number;
  rate?: number;
  paymentMethod?: string;
  serviceDuration?: number;
  serviceDescription?: string;
  taxPercentage?: string;
}

const getCurrencySymbol = (currency: string) => {
  const map: Record<string, string> = {
    USD: "$",
    INR: "₹",
  };

  return map[currency] || currency;
};

const drawNestAssistLogoFallback = (
  doc: PDFKit.PDFDocument,
  x: number,
  y: number
) => {
  const gray = "#3A3A3A";
  const blue = "#4540E1";
  const fontSize = 28;

  doc.font("Helvetica-Bold");

  doc.fontSize(fontSize);

  doc.fillColor(gray).text("H", x, y, {
    lineBreak: false,
  });

  doc.fillColor(blue).text("o", x + 20, y, {
    lineBreak: false,
  });

  doc.fillColor(gray).text("meCare", x + 38, y, {
    lineBreak: false,
  });
};
const logoPath = path.join(process.cwd(), "public/assets/logo.png");
let logoExists: boolean | null = null;

const formatDateTimeShort = (date: Date | string) => {
  const d = new Date(date);
  const day = d.getDate();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[d.getMonth()];

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? "0" + minutes : minutes;
  return `${day} ${month}, ${hours}:${strMinutes} ${ampm}`;
};

export const generateInvoicePDF = (data: InvoiceData, stream: Stream): void => {
  const currencySymbol = getCurrencySymbol(data.currency);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(stream as any);

  const primaryColor = "#4540E1";
  const secondaryColor = "#666666";
  const darkColor = "#333333";
  const borderColor = "#cfcfcf";
  const lightGray = "#f8f9fb";

  // Cache logo existence to avoid synchronous I/O on every request
  if (logoExists === null) {
    logoExists = fs.existsSync(logoPath);
  }

  // =========================
  // Header
  // =========================
  if (logoExists) {
    doc.image(logoPath, 50, 35, { width: 185, height: 30 });
  } else {
    drawNestAssistLogoFallback(doc, 50, 35);
  }

  doc
    .fillColor(darkColor)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("INVOICE", 400, 45, { align: "right" })
    .fontSize(11)
    .font("Helvetica")
    .text(`Invoice #: ${data.invoiceNumber}`, 400, 80, { align: "right" })
    .text(`Date: ${new Date(data.date).toLocaleDateString()}`, 400, 98, {
      align: "right",
    });

  doc
    .strokeColor("#e5e7eb")
    .lineWidth(1)
    .moveTo(50, 125)
    .lineTo(545, 125)
    .stroke();

  // =========================
  // Billing / Partner Info
  // =========================
  const detailsY = 145;

  doc
    .fillColor(secondaryColor)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("BILL TO", 50, detailsY)
    .fillColor(darkColor)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text(data.customerName, 50, detailsY + 18)
    .font("Helvetica")
    .fontSize(10)
    .fillColor(secondaryColor)
    .text("Service Address:", 50, detailsY + 42)
    .fillColor(darkColor)
    .text(data.customerAddress, 50, detailsY + 56, { width: 220, lineGap: 2 });

  // SERVICE PARTNER (Right-aligned at the very end of the page content)
  const rightColumnX = 50;
  const rightColumnWidth = 495;

  doc
    .fillColor(secondaryColor)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("SERVICE PARTNER", rightColumnX, detailsY, {
      align: "right",
      width: rightColumnWidth,
    });

  if (data.servicePartnerName) {
    doc
      .fillColor(darkColor)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(data.servicePartnerName, rightColumnX, detailsY + 18, {
        align: "right",
        width: rightColumnWidth,
      })
      .font("Helvetica")
      .fontSize(10)
      .text(
        `Phone: ${data.servicePartnerPhone || "N/A"}`,
        rightColumnX,
        detailsY + 42,
        {
          align: "right",
          width: rightColumnWidth,
        }
      );
  } else {
    doc
      .fillColor("#6b7280")
      .fontSize(10)
      .font("Helvetica-Oblique")
      .text("Assignment in progress...", rightColumnX, detailsY + 18, {
        align: "right",
        width: rightColumnWidth,
      });
  }

  // =========================
  // Main Service Table
  // =========================
  const tableTop = 275;
  const tableLeft = 50;
  const tableWidth = 495;
  const headerHeight = 35;

  // Column widths
  const col1 = 35; // Qty
  const col2 = 200; // Service Name
  const col3 = 105; // Start Date & Time
  const col4 = 80; // Payment
  const col5 = 75; // Sub Total

  const x1 = tableLeft;
  const x2 = x1 + col1;
  const x3 = x2 + col2;
  const x4 = x3 + col3;
  const x5 = x4 + col4;

  // Calculate dynamic body height based on service name length
  const serviceNameWidth = col2 - 20;
  doc.font("Helvetica-Bold").fontSize(10);
  const serviceNameHeight = doc.heightOfString(data.serviceName, {
    width: serviceNameWidth,
    lineGap: 2,
  });
  const bodyHeight = Math.max(45, serviceNameHeight + 25); // Minimum 45px, or text height + padding

  // 1. Header background fill (DO THIS FIRST so it doesn't cover borders)
  doc
    .fillColor("#f3f4f6")
    .rect(tableLeft, tableTop, tableWidth, headerHeight)
    .fill();

  // 2. Outer border
  doc
    .lineWidth(1)
    .strokeColor(borderColor)
    .rect(tableLeft, tableTop, tableWidth, headerHeight + bodyHeight)
    .stroke();

  // 3. Vertical lines
  doc
    .strokeColor(borderColor)
    .moveTo(x2, tableTop)
    .lineTo(x2, tableTop + headerHeight + bodyHeight)
    .stroke();

  doc
    .strokeColor(borderColor)
    .moveTo(x3, tableTop)
    .lineTo(x3, tableTop + headerHeight + bodyHeight)
    .stroke();

  doc
    .strokeColor(borderColor)
    .moveTo(x4, tableTop)
    .lineTo(x4, tableTop + headerHeight + bodyHeight)
    .stroke();

  doc
    .strokeColor(borderColor)
    .moveTo(x5, tableTop)
    .lineTo(x5, tableTop + headerHeight + bodyHeight)
    .stroke();

  // Horizontal line between header and row
  doc
    .moveTo(tableLeft, tableTop + headerHeight)
    .lineTo(tableLeft + tableWidth, tableTop + headerHeight)
    .stroke();

  // Header text
  doc
    .fillColor(darkColor)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text("Qty", x1 + 5, tableTop + 12, { width: col1 - 10, align: "center" })
    .text("Service Name", x2 + 10, tableTop + 12, {
      width: col2 - 20,
      align: "left",
    })
    .text("Start Date & Time", x3 + 5, tableTop + 12, {
      width: col3 - 10,
      align: "center",
    })
    .text("Payment", x4 + 5, tableTop + 12, {
      width: col4 - 10,
      align: "center",
    })
    .text("Sub Total", x5 + 5, tableTop + 12, {
      width: col5 - 10,
      align: "center",
    });

  // Row data
  const qty = data.quantity || 1;

  // Calculate vertical center offset for other columns
  // Approximate font height for size 10 is 12px, so offset is ~6px
  const centeredY = tableTop + headerHeight + (bodyHeight - 10) / 2;
  const serviceNameCenteredY =
    tableTop + headerHeight + (bodyHeight - serviceNameHeight) / 2;

  doc
    .fillColor(darkColor)
    .font("Helvetica")
    .fontSize(10)
    .text(qty % 1 === 0 ? qty.toString() : qty.toFixed(2), x1 + 5, centeredY, {
      width: col1 - 10,
      align: "center",
    });

  doc
    .font("Helvetica-Bold")
    .text(data.serviceName, x2 + 10, serviceNameCenteredY, {
      width: col2 - 20,
      lineGap: 2,
    });

  doc
    .font("Helvetica")
    .text(formatDateTimeShort(data.date), x3 + 5, centeredY, {
      width: col3 - 10,
      align: "center",
    });

  doc.text((data.paymentMethod || "Online").toLowerCase(), x4 + 5, centeredY, {
    width: col4 - 10,
    align: "center",
  });

  doc.text(`${currencySymbol} ${data.subTotal.toFixed(2)}`, x5 + 5, centeredY, {
    width: col5 - 10,
    align: "center",
  });

  // =========================
  // Totals Box (Right side)
  // =========================
  const summaryTop = tableTop + headerHeight + bodyHeight + 25;
  const summaryLeft = 330;
  const summaryWidth = 215;
  const summaryRowHeight = 26;

  const summaryRows = data.discount > 0 ? 4 : 3;
  const summaryHeight = summaryRows * summaryRowHeight;

  doc
    .strokeColor(borderColor)
    .lineWidth(1)
    .rect(summaryLeft, summaryTop, summaryWidth, summaryHeight)
    .stroke();

  for (let i = 1; i < summaryRows; i++) {
    doc
      .moveTo(summaryLeft, summaryTop + i * summaryRowHeight)
      .lineTo(summaryLeft + summaryWidth, summaryTop + i * summaryRowHeight)
      .stroke();
  }

  const splitX = summaryLeft + 120;
  doc
    .moveTo(splitX, summaryTop)
    .lineTo(splitX, summaryTop + summaryHeight)
    .stroke();

  const totalRowY = summaryTop + (summaryRows - 1) * summaryRowHeight;
  doc
    .fillColor(lightGray)
    .rect(summaryLeft, totalRowY, summaryWidth, summaryRowHeight)
    .fill();

  doc
    .strokeColor(borderColor)
    .rect(summaryLeft, summaryTop, summaryWidth, summaryHeight)
    .stroke();

  doc
    .moveTo(splitX, summaryTop)
    .lineTo(splitX, summaryTop + summaryHeight)
    .stroke();

  let currentY = summaryTop + 8;

  doc
    .fillColor(darkColor)
    .font("Helvetica")
    .fontSize(10)
    .text("Sub Total", summaryLeft + 10, currentY, {
      width: 100,
      align: "right",
    })
    .text(
      `${currencySymbol} ${data.subTotal.toFixed(2)}`,
      splitX + 10,
      currentY,
      { width: 75, align: "right" }
    );

  currentY += summaryRowHeight;

  doc
    .text(`Tax(${data.taxPercentage}%)`, summaryLeft + 10, currentY, {
      width: 100,
      align: "right",
    })
    .text(`${currencySymbol} ${data.tax.toFixed(2)}`, splitX + 10, currentY, {
      width: 75,
      align: "right",
    });

  if (data.discount > 0) {
    currentY += summaryRowHeight;
    doc
      .fillColor("#059669")
      .text("Discount", summaryLeft + 10, currentY, {
        width: 100,
        align: "right",
      })
      .text(
        `- ${currencySymbol} ${data.discount.toFixed(2)}`,
        splitX + 10,
        currentY,
        { width: 75, align: "right" }
      );
  }

  currentY += summaryRowHeight;

  doc
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("Total", summaryLeft + 10, currentY, { width: 100, align: "right" })
    .text(
      `${currencySymbol} ${data.totalAmount.toFixed(2)}`,
      splitX + 10,
      currentY,
      { width: 75, align: "right" }
    );

  // =========================
  // Footer
  // =========================
  const footerTop = 750;

  doc
    .fillColor(primaryColor)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text("Thank you for choosing Home Care!", 50, footerTop, {
      align: "center",
      width: 500,
    });

  doc
    .fontSize(8)
    .fillColor("#9ca3af")
    .font("Helvetica")
    .text(
      "This is a computer-generated invoice and does not require a signature. For any queries, please contact support@nestassist.com",
      50,
      footerTop + 30,
      { align: "center", width: 500 }
    );

  doc.end();
};
