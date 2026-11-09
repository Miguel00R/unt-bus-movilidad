import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface UniEstudiante {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  carrera: string;
  lugar?: string;
}

export interface UniViaje {
  id: number;
  chofer: string;
  placa: string;
  origen: string;
  destino: string;
  ruta: string;
  turno: string;
  horaSalida: string;
  horaLlegada?: string;
  fecha: string;
  totalAsientos: number;
  cerrado: boolean;
}

export interface UniPasajero {
  id: number;
  viajeId: number;
  horaAbordaje: string;
  nombres: string;
  apellidos: string;
  codigo: string;
  carrera: string;
  estado: string;
  firma?: string;
  paradero?: string;
  telefono?: string;
}

export function exportarExcelViaje(viaje: UniViaje, pasajeros: UniPasajero[]) {
  const wsData: (string | number)[][] = [
    ["UNIVERSIDAD NACIONAL DE TRUJILLO - FILIAL VALLE JEQUETEPEQUE"],
    ["REPORTE DE TRANSPORTE UNIVERSITARIO"],
    [],
    ["Ruta:", viaje.ruta, "Fecha:", viaje.fecha],
    ["Chofer:", viaje.chofer, "Placa:", viaje.placa || "—"],
    ["Turno:", viaje.turno, "Total Asientos:", viaje.totalAsientos],
    ["Hora Salida:", viaje.horaSalida || "—", "Hora Llegada:", viaje.horaLlegada || "—"],
    [],
    ["N°", "Hora Abordaje", "Código Universitario", "Apellidos", "Nombres", "Carrera", "Estado", "Firma Digital"],
  ];

  pasajeros.forEach((p, idx) => {
    wsData.push([
      idx + 1,
      p.horaAbordaje,
      p.codigo,
      p.apellidos,
      p.nombres,
      p.carrera,
      p.estado,
      p.firma ? "FIRMADO EN PANTALLA TÁCTIL" : "NO REGISTRADA",
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Pasajeros");

  const cleanRuta = viaje.ruta.replace(/\s+/g, "_");
  XLSX.writeFile(wb, `Reporte_Transporte_${cleanRuta}_${viaje.fecha}.xlsx`);
}

export function exportarPDFViaje(viaje: UniViaje, pasajeros: UniPasajero[]) {
  const doc = new jsPDF("p", "mm", "a4");

  // Azul UNT: [0, 48, 135], Rojo UNT: [200, 16, 46]
  doc.setFillColor(0, 48, 135);
  doc.roundedRect(14, 12, 182, 24, 3, 3, "F");

  // Textos Cabecera
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("UNIVERSIDAD NACIONAL DE TRUJILLO", 22, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("FILIAL VALLE JEQUETEPEQUE", 22, 25);

  // Línea Roja Decorativa
  doc.setDrawColor(200, 16, 46);
  doc.setLineWidth(1);
  doc.line(22, 27, 100, 27);

  doc.setTextColor(254, 240, 138); // Yellow 200
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE OFICIAL DE TRANSPORTE UNIVERSITARIO", 22, 32);

  // Cuadro de Información del Viaje
  doc.setDrawColor(209, 217, 232);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 40, 182, 30, 2, 2, "FD");

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text(`Fecha: ${viaje.fecha}`, 18, 47);
  doc.text(`Ruta: ${viaje.ruta}`, 75, 47);
  doc.text(`Turno: ${viaje.turno}`, 145, 47);

  doc.setFont("helvetica", "normal");
  doc.text(`Recorrido: ${viaje.origen} → ${viaje.destino}`, 18, 54);
  doc.text(`Chofer: ${viaje.chofer}`, 18, 61);
  doc.text(`Placa: ${viaje.placa || "—"}`, 75, 61);
  doc.text(`H. Salida: ${viaje.horaSalida || "—"}`, 120, 61);
  doc.text(`H. Llegada: ${viaje.horaLlegada || "—"}`, 155, 61);
  doc.text(
    `Total a bordo: ${pasajeros.length} de ${viaje.totalAsientos} asientos`,
    18,
    67
  );

  // Tabla de Pasajeros con Firma Digital
  const tableData = pasajeros.map((p, idx) => [
    idx + 1,
    p.horaAbordaje,
    p.codigo,
    `${p.apellidos}, ${p.nombres}`,
    p.carrera,
    p.estado,
    p.firma ? "" : "—",
  ]);

  autoTable(doc, {
    startY: 74,
    head: [["#", "Hora", "Código", "Estudiante", "Carrera", "Estado", "Firma"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [0, 48, 135],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], minCellHeight: 9 },
    alternateRowStyles: { fillColor: [242, 245, 251] },
    styles: { cellPadding: 2, valign: "middle" },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 6) {
        const p = pasajeros[data.row.index];
        if (p && p.firma) {
          try {
            doc.addImage(
              p.firma,
              "PNG",
              data.cell.x + 2,
              data.cell.y + 1,
              Math.min(data.cell.width - 4, 18),
              Math.min(data.cell.height - 2, 7)
            );
          } catch {
            // fallback
          }
        }
      }
    },
  });

  // Footer con Firmas
  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  const finalY = (lastTable ? lastTable.finalY : 150) + 25;
  if (finalY < 260) {
    doc.setDrawColor(150, 150, 150);
    doc.line(25, finalY, 85, finalY);
    doc.line(125, finalY, 185, finalY);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Firma del Conductor / Chofer", 32, finalY + 5);
    doc.text("Control / Seguridad UNT", 137, finalY + 5);
  }

  const cleanRuta = viaje.ruta.replace(/\s+/g, "_");
  doc.save(`Reporte_Transporte_${cleanRuta}_${viaje.fecha}.pdf`);
}

