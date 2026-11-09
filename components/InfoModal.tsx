"use client";

import React from "react";
import { X, CheckCircle, Smartphone, Database, Shield, Zap } from "lucide-react";
import { UNT_STUDENTS } from "@/lib/mock-data";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudentCode: (code: string) => void;
}

export default function InfoModal({
  isOpen,
  onClose,
  onSelectStudentCode,
}: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-unt-blue text-white p-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-unt-gold" />
              Sistema de Movilidad UNT &bull; Guía y Códigos de Prueba
            </h3>
            <p className="text-xs text-blue-200">Control de Abordaje Rápido &lt; 5 Segundos</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
          {/* Key Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
              <Zap className="w-4 h-4 text-unt-blue" />
              <p className="font-bold text-slate-900">Autocompletado</p>
              <p className="text-[11px] text-slate-500">Ingresa o escanea el código UNT y los datos se cargan al instante.</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
              <Smartphone className="w-4 h-4 text-amber-600" />
              <p className="font-bold text-slate-900">Firma en Canvas</p>
              <p className="text-[11px] text-slate-500">Captura la firma digital con el dedo o lápiz en pantalla táctil.</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <p className="font-bold text-slate-900">Reporte PDF</p>
              <p className="text-[11px] text-slate-500">Exporta el padrón oficial con jspdf e incrusta las firmas de cada alumno.</p>
            </div>
          </div>

          {/* Directory of Test Students */}
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
              <span>Directorio de Códigos UNT para Demostración</span>
              <span className="text-[11px] font-normal text-slate-400">(Clic en cualquiera para autocompletar)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {UNT_STUDENTS.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    onSelectStudentCode(st.code);
                    onClose();
                  }}
                  className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-unt-blue bg-slate-50/60 hover:bg-unt-blue/5 transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-unt-blue text-xs block">{st.code}</span>
                    <span className="font-medium text-slate-800 text-[11px] block truncate max-w-[160px]">
                      {st.name} {st.lastName}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">{st.career}</span>
                  </div>
                  <span className="text-[10px] text-unt-blue font-bold px-2 py-1 bg-white rounded border border-slate-200">
                    Usar
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Architecture note */}
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Persistencia y Arquitectura PostgreSQL + Prisma</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                El sistema incluye el esquema Prisma completo en <code className="font-mono bg-white px-1 py-0.5 rounded">prisma/schema.prisma</code> para PostgreSQL, compatible con Supabase, Neon o base de datos local, con sincronización de estado en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
