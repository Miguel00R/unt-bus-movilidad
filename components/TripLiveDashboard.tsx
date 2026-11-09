"use client";

import React, { useState } from "react";
import { 
  Users, 
  Download, 
  Search, 
  Trash2, 
  FileText, 
  AlertTriangle,
  Eye, 
  CheckCircle, 
  MessageCircle, 
  X,
  Sparkles
} from "lucide-react";
import { Trip, Boarding } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { generateBoardingManifestPDF } from "@/lib/pdf-generator";

interface TripLiveDashboardProps {
  trip: Trip;
  onRemoveBoarding: (boardingId: string) => void;
  onClearAllBoardings: () => void;
}

export default function TripLiveDashboard({
  trip,
  onRemoveBoarding,
  onClearAllBoardings,
}: TripLiveDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSignature, setSelectedSignature] = useState<{
    name: string;
    code: string;
    dataUrl: string;
  } | null>(null);

  const capacity = trip.bus?.capacity || 40;
  const boardedCount = trip.boardings.length;
  const availableSeats = Math.max(0, capacity - boardedCount);
  const percentage = Math.min(100, Math.round((boardedCount / capacity) * 100));

  // Gauge color based on load
  let gaugeColor = "bg-emerald-500";
  let gaugeTextColor = "text-emerald-700";
  let gaugeBg = "bg-emerald-50 border-emerald-200";

  if (percentage >= 100) {
    gaugeColor = "bg-red-500";
    gaugeTextColor = "text-red-700";
    gaugeBg = "bg-red-50 border-red-200";
  } else if (percentage >= 80) {
    gaugeColor = "bg-amber-500";
    gaugeTextColor = "text-amber-700";
    gaugeBg = "bg-amber-50 border-amber-200";
  }

  // Filtered passengers
  const filteredBoardings = trip.boardings.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      b.studentCode.toLowerCase().includes(term) ||
      b.fullName.toLowerCase().includes(term) ||
      b.career.toLowerCase().includes(term)
    );
  });

  const handleDownloadPDF = () => {
    if (trip.boardings.length === 0) {
      alert("Aún no hay pasajeros registrados para generar el manifiesto.");
      return;
    }
    generateBoardingManifestPDF(trip);
  };

  return (
    <div className="space-y-4">
      {/* Capacity & Occupancy Dashboard Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-unt-blue" />
              <h3 className="font-bold text-slate-900 text-base">Control de Aforo y Pasajeros</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Capacidad total de la unidad: <span className="font-bold text-slate-800">{capacity} asientos</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-unt-blue hover:bg-[#082a57] text-white text-xs font-bold transition-all shadow-md active:scale-95"
              title="Descargar Manifiesto Oficial en Formato PDF con firmas digitales"
            >
              <Download className="w-4 h-4 text-unt-gold" />
              <span>Descargar PDF</span>
            </button>

            {trip.boardings.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("¿Está seguro de reiniciar los registros de este viaje?")) {
                    onClearAllBoardings();
                  }
                }}
                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Reiniciar lista de pasajeros"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Badges */}
        <div className="pt-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Ocupación Actual:</span>
              <span className={`px-2 py-0.5 rounded-full font-bold border ${gaugeBg} ${gaugeTextColor}`}>
                {boardedCount} / {capacity} Asientos ({percentage}%)
              </span>
            </span>

            <span className="text-xs font-semibold text-slate-500">
              {availableSeats > 0 ? (
                <span className="text-emerald-600 font-bold">{availableSeats} libres</span>
              ) : (
                <span className="text-red-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Aforo Completo
                </span>
              )}
            </span>
          </div>

          {/* Bar track */}
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${gaugeColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Passenger List Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-unt-blue" />
            <h4 className="font-bold text-sm text-slate-800">
              Estudiantes a Bordo ({filteredBoardings.length})
            </h4>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, nombre o carrera..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:border-unt-blue focus:ring-1 focus:ring-unt-blue outline-none bg-white text-slate-900"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Passengers Table */}
        <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
          {filteredBoardings.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-600">No hay estudiantes registrados en este viaje aún</p>
              <p className="text-xs text-slate-400 mt-1">
                Los registros de abordaje realizados en el formulario aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 text-center w-10">#</th>
                  <th className="py-2.5 px-3">Código UNT</th>
                  <th className="py-2.5 px-3">Estudiante</th>
                  <th className="py-2.5 px-3">Escuela / Carrera</th>
                  <th className="py-2.5 px-3">WhatsApp</th>
                  <th className="py-2.5 px-3 text-center">Hora</th>
                  <th className="py-2.5 px-3 text-center">Firma</th>
                  <th className="py-2.5 px-3 text-center w-12">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBoardings.map((b: Boarding, index: number) => (
                  <tr
                    key={b.id}
                    className="hover:bg-unt-blue/5 transition-colors group text-slate-700"
                  >
                    <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-unt-blue">
                      {b.studentCode}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {b.fullName}
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 font-medium max-w-[160px] truncate" title={b.career}>
                      {b.career}
                    </td>

                    <td className="py-2.5 px-3">
                      <a
                        href={`https://wa.me/51${b.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                        title="Abrir chat de WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-500" />
                        <span className="font-mono">{b.phone}</span>
                      </a>
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                      {formatTime(b.boardedAt)}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {b.signatureData ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSignature({
                              name: b.fullName,
                              code: b.studentCode,
                              dataUrl: b.signatureData,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-unt-blue hover:text-white transition-colors border border-slate-200 text-[10px] font-semibold"
                          title="Ver firma digital ampliada"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver</span>
                        </button>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveBoarding(b.id)}
                        className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Desembarcar / Eliminar registro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Signature Preview Modal */}
      {selectedSignature && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-unt-blue text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-unt-gold" />
                <h4 className="font-bold text-sm">Firma Digital Capturada</h4>
              </div>
              <button
                onClick={() => setSelectedSignature(null)}
                className="p-1 rounded text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-900">{selectedSignature.name}</p>
                <p className="text-[11px] font-mono text-unt-blue">Cód. UNT: {selectedSignature.code}</p>
              </div>

              <div className="p-2 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center min-h-[140px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedSignature.dataUrl}
                  alt="Firma Digital"
                  className="max-h-32 object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" /> Firma autenticada
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSignature(null)}
                  className="px-3 py-1 bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
