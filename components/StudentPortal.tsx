"use client";

import React, { useState } from "react";
import { 
  GraduationCap, 
  QrCode, 
  Bus, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Sparkles, 
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Smartphone
} from "lucide-react";
import { Trip, Student } from "@/lib/types";
import { UNT_STUDENTS } from "@/lib/mock-data";
import { AuthUser } from "@/lib/auth";

interface StudentPortalProps {
  trip: Trip;
  currentUser?: AuthUser | null;
  onSwitchToDriver?: () => void;
}

export default function StudentPortal({ trip, currentUser, onSwitchToDriver }: StudentPortalProps) {
  // Current student selected for demo or authenticated user
  const initialCode = (currentUser?.role === "STUDENT" && currentUser?.studentCode) 
    ? currentUser.studentCode 
    : UNT_STUDENTS[0].code;
    
  const [selectedStudentCode, setSelectedStudentCode] = useState<string>(initialCode);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (currentUser?.role === "STUDENT" && currentUser?.studentCode) {
      setSelectedStudentCode(currentUser.studentCode);
    }
  }, [currentUser]);

  const student = UNT_STUDENTS.find((s) => s.code === selectedStudentCode) || UNT_STUDENTS[0];

  // Check if student is boarded in current trip
  const currentBoarding = trip.boardings.find((b) => b.studentCode === student.code);

  const capacity = trip.bus?.capacity || 40;
  const boardedCount = trip.boardings.length;
  const availableSeats = Math.max(0, capacity - boardedCount);
  const occupancyPercentage = Math.round((boardedCount / capacity) * 100);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(student.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Student Demo Profile Selector Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <GraduationCap className="w-4 h-4 text-unt-blue" />
          <span className="font-semibold text-slate-800">Perfil de Alumno Activo:</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStudentCode}
            onChange={(e) => setSelectedStudentCode(e.target.value)}
            className="w-full sm:w-auto text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-unt-blue"
          >
            {UNT_STUDENTS.map((s) => (
              <option key={s.id} value={s.code}>
                {s.lastName}, {s.name} ({s.code}) — {s.career}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Official Digital Student ID Card (Carné UNT) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-gradient-to-br from-unt-blue via-[#0d346b] to-unt-dark rounded-3xl p-6 text-white shadow-2xl border-2 border-unt-gold/40 relative overflow-hidden">
            {/* Background ornaments */}
            <div className="absolute top-0 right-0 -mr-12 -mt-12 w-44 h-44 rounded-full bg-unt-gold/15 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-44 h-44 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />

            {/* University Header */}
            <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/escudo-unt.png" 
                    alt="Escudo UNT" 
                    className="w-full h-full object-contain filter drop-shadow"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider text-unt-gold uppercase">
                    Universidad Nacional de Trujillo
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium">
                    Carné Digital de Movilidad Estudiantil UNT
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                ACTIVO 2026-I
              </span>
            </div>

            {/* Student Info & Photo Area */}
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start mb-6">
              {/* Photo placeholder with initials */}
              <div className="relative">
                <div className="w-24 h-28 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-unt-gold shadow-md flex flex-col items-center justify-center text-unt-blue">
                  <User className="w-10 h-10 opacity-70" />
                  <span className="text-[9px] font-bold mt-1 text-slate-600">UNT PERÚ</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-unt-gold text-unt-dark flex items-center justify-center font-black text-[10px] shadow">
                  ✓
                </div>
              </div>

              {/* Student Academic Details */}
              <div className="flex-1 text-center sm:text-left space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-unt-gold">
                  Estudiante Regular
                </span>
                <h4 className="text-lg font-black text-white leading-tight">
                  {student.lastName}, {student.name}
                </h4>
                <p className="text-xs text-blue-100 font-medium">
                  {student.career}
                </p>

                <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-white font-mono text-xs font-bold border border-white/10">
                    <span>Cód: {student.code}</span>
                    <button
                      onClick={handleCopyCode}
                      className="ml-1 text-unt-gold hover:text-white"
                      title="Copiar código"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-slate-200 text-xs">
                    <Phone className="w-3 h-3 text-unt-gold" />
                    {student.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Presentation for Scanner Terminal */}
            <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-inner flex flex-col sm:flex-row items-center gap-4">
              {/* High-Contrast Interactive QR Code representation */}
              <div className="p-2 bg-slate-50 border-2 border-slate-300 rounded-xl relative group">
                <div className="w-28 h-28 bg-white flex flex-col items-center justify-center relative p-1">
                  {/* Clean SVG QR Pattern Representation */}
                  <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                    {/* Top Left Marker */}
                    <rect x="5" y="5" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="13" y="13" width="12" height="12" rx="1" />
                    {/* Top Right Marker */}
                    <rect x="67" y="5" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="75" y="13" width="12" height="12" rx="1" />
                    {/* Bottom Left Marker */}
                    <rect x="5" y="67" width="28" height="28" rx="2" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="13" y="75" width="12" height="12" rx="1" />
                    {/* Data matrix dots */}
                    <rect x="42" y="8" width="6" height="6" />
                    <rect x="52" y="16" width="6" height="6" />
                    <rect x="42" y="24" width="6" height="6" />
                    <rect x="10" y="42" width="6" height="6" />
                    <rect x="20" y="50" width="6" height="6" />
                    <rect x="42" y="42" width="16" height="16" rx="2" fill="#002B66" />
                    <rect x="70" y="42" width="6" height="6" />
                    <rect x="85" y="48" width="6" height="6" />
                    <rect x="50" y="68" width="6" height="6" />
                    <rect x="65" y="75" width="6" height="6" />
                    <rect x="80" y="70" width="6" height="6" />
                    <rect x="45" y="85" width="6" height="6" />
                    <rect x="75" y="85" width="6" height="6" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="bg-unt-gold text-unt-dark font-black text-[7px] px-1 rounded shadow">UNT</span>
                  </span>
                </div>
                <p className="text-[9px] text-center font-mono font-bold text-slate-700 mt-1">
                  QR ESCANEABLE
                </p>
              </div>

              {/* Instructions */}
              <div className="flex-1 space-y-1.5 text-center sm:text-left">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-unt-blue uppercase">
                  <Smartphone className="w-3.5 h-3.5" />
                  Presentar al abordar el bus
                </span>
                <p className="text-xs text-slate-600 leading-snug">
                  Muestra este código QR o dicta tu número <strong>{student.code}</strong> en la tablet del conductor para validar tu acceso en menos de 5 segundos.
                </p>
                <div className="pt-1">
                  <button
                    onClick={onSwitchToDriver}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-unt-blue hover:text-unt-gold transition-colors"
                  >
                    <span>Ir a la terminal del Conductor para abordar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Security Barcode */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-col items-center">
              {/* Simulated Barcode */}
              <div className="w-full flex justify-center items-center gap-1 h-7 opacity-85 px-4 bg-white/5 rounded py-1">
                {[4, 2, 6, 2, 8, 3, 5, 2, 7, 3, 2, 6, 4, 3, 8, 2, 5, 3, 6, 2, 7, 4].map((w, i) => (
                  <div key={i} className="bg-white h-full" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
              <span className="font-mono text-[10px] tracking-widest text-slate-300 mt-1">
                *{student.code}*
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Bus Status & Boarding Record */}
        <div className="lg:col-span-6 space-y-4">
          {/* Status Alert for This Student */}
          {currentBoarding ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm text-emerald-900">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">
                    Abordaje Verificado con Éxito
                  </span>
                  <h4 className="text-base font-black text-emerald-950">
                    ¡Ya estás registrado a bordo de esta unidad!
                  </h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    Registrado a las{" "}
                    <strong>
                      {new Date(currentBoarding.boardedAt).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>{" "}
                    con tu firma digital. Tienes asiento asegurado.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm text-amber-900">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700">
                    Pendiente de Abordar
                  </span>
                  <h4 className="text-base font-black text-amber-950">
                    Aún no has registrado tu abordaje
                  </h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Acércate a la puerta del bus y presenta tu carné digital o código UNT al asistente de abordaje.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Live Bus Monitor Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-unt-blue text-white flex items-center justify-center">
                  <Bus className="w-4 h-4 text-unt-gold" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Bus en Operación
                  </h4>
                  <p className="text-sm font-black text-slate-900">
                    {trip.bus?.unitNumber || "Bus UNT #01"} &bull; {trip.bus?.plateNumber || "EGB-123"}
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                En Servicio
              </span>
            </div>

            {/* Route & Driver */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-unt-blue flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Ruta:</span>
                  <p className="text-unt-blue font-bold">{trip.route?.name}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-600">
                <span>Conductor:</span>
                <strong className="text-slate-800">{trip.bus?.driverName}</strong>
              </div>
            </div>

            {/* Live Capacity Semaphore */}
            <div className="pt-2 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">Aforo Disponible en Vivo</span>
                <span
                  className={
                    occupancyPercentage >= 100
                      ? "text-red-600"
                      : occupancyPercentage >= 80
                      ? "text-amber-600"
                      : "text-emerald-600"
                  }
                >
                  {availableSeats} Asientos Libres ({boardedCount}/{capacity})
                </span>
              </div>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-500 ${
                    occupancyPercentage >= 100
                      ? "bg-red-500"
                      : occupancyPercentage >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                {occupancyPercentage >= 100
                  ? "⚠️ Capacidad completa. Por favor espera la siguiente unidad."
                  : occupancyPercentage >= 80
                  ? "⚡ Pocos asientos disponibles. Dirígete pronto al paradero."
                  : "✅ Hay asientos disponibles suficientes."}
              </p>
            </div>
          </div>

          {/* Student Rights & Mobility Policies */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-unt-gold" />
              Normas del Servicio de Transporte UNT
            </h5>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
              <li>El servicio de transporte universitario es 100% gratuito para alumnos matriculados.</li>
              <li>Es obligatorio firmar el padrón digital táctil al ingresar a la unidad vehicular.</li>
              <li>El aforo no puede exceder el número de asientos sentados ({capacity} pasajeros) por seguridad vial y cobertura del seguro institucional.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
