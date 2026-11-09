import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Trip, Boarding } from "./types";
import { formatDateTime, formatTime } from "./utils";

export function generateBoardingManifestPDF(trip: Trip) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Background Banner (UNT Deep Blue)
  doc.setFillColor(0, 43, 102); // #002B66
  doc.rect(0, 0, pageWidth, 28, "F");

  // UNT Gold Accent Line
  doc.setFillColor(212, 175, 55); // #D4AF37
  doc.rect(0, 28, pageWidth, 2.5, "F");

  // University Header Titles
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", pageWidth / 2, 11, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Dirección de Bienestar Universitario | Sistema de Movilidad Estudiantil", pageWidth / 2, 18, {
    align: "center",
  });

  doc.setFontSize(8);
  doc.setTextColor(220, 230, 245);
  doc.text("PADRÓN OFICIAL DE ABORDAJE Y CONTROL DE PASAJEROS", pageWidth / 2, 24, {
    align: "center",
  });

  // Trip Information Card
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL SERVICIO Y UNIDAD", 14, 38);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 41, pageWidth - 28, 25, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Ruta:", 18, 48);
  doc.setFont("helvetica", "normal");
  doc.text(trip.route?.name || "Ruta Principal UNT", 32, 48);

  doc.setFont("helvetica", "bold");
  doc.text("Unidad:", 18, 54);
  doc.setFont("helvetica", "normal");
  doc.text(`${trip.bus?.unitNumber || "Bus #01"} (Placa: ${trip.bus?.plateNumber || "EGB-123"})`, 32, 54);

  doc.setFont("helvetica", "bold");
  doc.text("Conductor:", 18, 60);
  doc.setFont("helvetica", "normal");
  doc.text(trip.bus?.driverName || "Manuel Morales C.", 37, 60);

  // Right column of info
  const rightColX = pageWidth / 2 + 10;
  doc.setFont("helvetica", "bold");
  doc.text("Fecha / Hora:", rightColX, 48);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateTime(trip.departureTime), rightColX + 22, 48);

  doc.setFont("helvetica", "bold");
  doc.text("Estado Viaje:", rightColX, 54);
  doc.setFont("helvetica", "normal");
  doc.text(trip.status === "IN_PROGRESS" ? "EN CURSO" : trip.status, rightColX + 22, 54);

  const totalBoarded = trip.boardings.length;
  const capacity = trip.bus?.capacity || 40;
  const occupancyPercent = Math.round((totalBoarded / capacity) * 100);

  doc.setFont("helvetica", "bold");
  doc.text("Ocupación:", rightColX, 60);
  doc.setFont("helvetica", "normal");
  doc.text(`${totalBoarded} / ${capacity} Asientos (${occupancyPercent}%)`, rightColX + 22, 60);

  // Table Data Preparation
  const tableRows = trip.boardings.map((boarding: Boarding, index: number) => {
    return [
      (index + 1).toString(),
      boarding.studentCode,
      boarding.fullName.toUpperCase(),
      boarding.career,
      boarding.phone,
      formatTime(boarding.boardedAt),
      "", // Column reserved for Base64 signature rendering
    ];
  });

  // Render Table with autoTable
  autoTable(doc, {
    startY: 72,
    head: [["N°", "CÓDIGO UNT", "ESTUDIANTE", "ESCUELA PROFESIONAL", "TELÉFONO", "HORA", "FIRMA DIGITAL"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [0, 43, 102], // UNT Blue
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      valign: "middle",
      minCellHeight: 12, // Enough height for signature rendering
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 24, fontStyle: "bold", halign: "center" },
      2: { cellWidth: 44 },
      3: { cellWidth: 42 },
      4: { cellWidth: 22, halign: "center" },
      5: { cellWidth: 16, halign: "center" },
      6: { cellWidth: 26, halign: "center" }, // Signature column
    },
    didDrawCell: (data) => {
      // Draw signature image if present in the 6th column (index 6)
      if (data.section === "body" && data.column.index === 6) {
        const boarding = trip.boardings[data.row.index];
        if (boarding && boarding.signatureData && boarding.signatureData.startsWith("data:image")) {
          try {
            doc.addImage(
              boarding.signatureData,
              "PNG",
              data.cell.x + 2,
              data.cell.y + 1,
              data.cell.width - 4,
              data.cell.height - 2
            );
          } catch (e) {
            console.error("Error drawing signature in PDF cell:", e);
          }
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Signatures Footer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 200;
  const footerY = Math.min(finalY + 22, 275);

  doc.setDrawColor(148, 163, 184);
  doc.line(25, footerY, 85, footerY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Firma del Conductor / Responsable", 55, footerY + 5, { align: "center" });

  doc.line(pageWidth - 85, footerY, pageWidth - 25, footerY);
  doc.text("Sello Bienestar Universitario UNT", pageWidth - 55, footerY + 5, { align: "center" });

  // Page numbering
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Página ${i} de ${pageCount} - Generado por UNT Bus Movilidad (${new Date().toLocaleDateString("es-PE")})`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  // Generate File name
  const safeDate = new Date().toISOString().slice(0, 10);
  const fileName = `Manifiesto_UNT_Bus_${trip.bus?.plateNumber || "EGB-123"}_${safeDate}.pdf`;

  // Save to trigger download
  doc.save(fileName);
}
