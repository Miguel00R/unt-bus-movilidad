"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  UserCheck, 
  Search, 
  QrCode, 
  Smartphone, 
  GraduationCap, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  RotateCcw
} from "lucide-react";

import SignaturePad from "./SignaturePad";
import ScannerModal from "./ScannerModal";
import { UNT_STUDENTS } from "@/lib/mock-data";
import { Boarding } from "@/lib/types";
import { playSuccessBeep, playErrorBeep } from "@/lib/audio";

const boardingSchema = z.object({
  studentCode: z
    .string()
    .min(5, "El código UNT debe tener al menos 5 dígitos")
    .max(15, "Código demasiado largo"),
  fullName: z.string().min(3, "Ingrese apellidos y nombres completos"),
  career: z.string().min(3, "Ingrese la carrera / escuela profesional"),
  phone: z
    .string()
    .min(9, "El teléfono debe tener 9 dígitos")
    .regex(/^[0-9+ ]+$/, "Formato de teléfono inválido"),
  signatureData: z.string().min(1, "La firma digital es obligatoria"),
});

type BoardingFormData = z.infer<typeof boardingSchema>;

interface BoardingFormProps {
  tripId: string;
  onBoardingSuccess: (boarding: Boarding) => void;
  isBusFull?: boolean;
}

export default function BoardingForm({
  tripId,
  onBoardingSuccess,
  isBusFull = false,
}: BoardingFormProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<typeof UNT_STUDENTS>([]);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [signatureKey, setSignatureKey] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const codeInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BoardingFormData>({
    resolver: zodResolver(boardingSchema),
    defaultValues: {
      studentCode: "",
      fullName: "",
      career: "",
      phone: "",
      signatureData: "",
    },
  });

  const studentCodeValue = watch("studentCode");

  // Autocomplete student information when code is typed
  useEffect(() => {
    if (!studentCodeValue || studentCodeValue.length < 3) {
      setAutocompleteSuggestions([]);
      return;
    }

    const matches = UNT_STUDENTS.filter(
      (s) =>
        s.code.includes(studentCodeValue) ||
        `${s.name} ${s.lastName}`.toLowerCase().includes(studentCodeValue.toLowerCase())
    );

    setAutocompleteSuggestions(matches);

    // Exact code match auto-population
    const exact = UNT_STUDENTS.find((s) => s.code === studentCodeValue);
    if (exact) {
      setValue("fullName", `${exact.lastName}, ${exact.name}`, { shouldValidate: true });
      setValue("career", exact.career, { shouldValidate: true });
      setValue("phone", exact.phone, { shouldValidate: true });
    }
  }, [studentCodeValue, setValue]);

  const selectStudent = (student: (typeof UNT_STUDENTS)[0]) => {
    setValue("studentCode", student.code, { shouldValidate: true });
    setValue("fullName", `${student.lastName}, ${student.name}`, { shouldValidate: true });
    setValue("career", student.career, { shouldValidate: true });
    setValue("phone", student.phone, { shouldValidate: true });
    setAutocompleteSuggestions([]);
  };

  const handleScanSuccess = (scannedCode: string) => {
    setValue("studentCode", scannedCode, { shouldValidate: true });
    const matched = UNT_STUDENTS.find((s) => s.code === scannedCode);
    if (matched) {
      setValue("fullName", `${matched.lastName}, ${matched.name}`, { shouldValidate: true });
      setValue("career", matched.career, { shouldValidate: true });
      setValue("phone", matched.phone, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: BoardingFormData) => {
    if (isBusFull) {
      playErrorBeep();
      alert("¡El bus ha alcanzado su capacidad máxima! Verifique antes de continuar.");
      return;
    }

    setSubmitting(true);
    try {
      const newBoarding: Boarding = {
        id: `board-${Date.now()}`,
        tripId,
        studentCode: data.studentCode,
        fullName: data.fullName,
        career: data.career,
        phone: data.phone,
        signatureData: data.signatureData,
        boardedAt: new Date().toISOString(),
      };

      // Play instant electronic chime (<5s rapid feedback!)
      playSuccessBeep();

      // Show banner
      setSuccessNotice(`¡Abordaje registrado para ${data.fullName.split(",")[0]}!`);
      setTimeout(() => setSuccessNotice(null), 3000);

      // Trigger parent callback to update trip live boardings
      onBoardingSuccess(newBoarding);

      // Reset form & canvas for the NEXT student in line
      reset({
        studentCode: "",
        fullName: "",
        career: "",
        phone: "",
        signatureData: "",
      });
      setSignatureKey((prev) => prev + 1);

      // Re-focus on code input for the next student
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 50);
    } catch {
      playErrorBeep();
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualReset = () => {
    reset({
      studentCode: "",
      fullName: "",
      career: "",
      phone: "",
      signatureData: "",
    });
    setSignatureKey((prev) => prev + 1);
    setAutocompleteSuggestions([]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
      {/* Form Card Header */}
      <div className="bg-gradient-to-r from-unt-blue via-[#0d3b7a] to-unt-blue px-6 py-4 text-white flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-unt-gold" />
            <h2 className="text-lg font-bold tracking-tight">Registro de Abordaje Rápido</h2>
          </div>
          <p className="text-xs text-blue-100/90 mt-0.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            Optimizado para flujo continuo &bull; Menos de 5 seg. por estudiante
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-unt-gold text-slate-900 text-xs font-semibold hover:bg-amber-400 active:scale-95 transition-all shadow-md"
          title="Escanear carné UNT con cámara"
        >
          <QrCode className="w-4 h-4 text-slate-950" />
          <span>Escanear Carné</span>
        </button>
      </div>

      {/* Success Notice Banner */}
      {successNotice && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 flex items-center gap-2 animate-bounce-short">
          <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Form Body */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        {/* Row 1: UNT Code with Quick Suggestions */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Código Matrícula UNT</span>
              <span className="text-amber-500 text-[10px] lowercase font-normal">(autocompleta datos)</span>
            </label>
            {studentCodeValue && (
              <button
                type="button"
                onClick={() => setValue("studentCode", "")}
                className="text-[11px] text-slate-400 hover:text-slate-600"
              >
                Limpiar código
              </button>
            )}
          </div>

          <div className="relative">
            <input
              {...register("studentCode")}
              ref={(e) => {
                register("studentCode").ref(e);
                codeInputRef.current = e;
              }}
              type="text"
              inputMode="numeric"
              placeholder="Ej. 1020304021"
              autoComplete="off"
              className={`w-full text-base font-mono font-bold tracking-wider px-3.5 py-2.5 rounded-xl border bg-slate-50 focus:bg-white text-slate-900 transition-all outline-none ${
                errors.studentCode
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-slate-300 focus:border-unt-blue focus:ring-2 focus:ring-unt-blue/20"
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
          </div>

          {errors.studentCode && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.studentCode.message}
            </p>
          )}

          {/* Autocomplete Dropdown List */}
          {autocompleteSuggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
              <div className="bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
                Sugerencias de Alumnos UNT Encontradas ({autocompleteSuggestions.length}):
              </div>
              {autocompleteSuggestions.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => selectStudent(st)}
                  className="w-full text-left px-3.5 py-2 hover:bg-unt-blue/10 flex items-center justify-between border-b border-slate-100 last:border-0 transition-colors"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-unt-blue">{st.code}</span>
                    <span className="text-xs text-slate-800 ml-2 font-medium">
                      {st.lastName}, {st.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 italic max-w-[140px] truncate">
                    {st.career}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 2: Student Full Name & Professional Career */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">
              2. Apellidos y Nombres
            </label>
            <input
              {...register("fullName")}
              type="text"
              placeholder="Ej. Mendoza Silva, Carlos Eduardo"
              className={`w-full text-sm px-3.5 py-2 rounded-xl border bg-slate-50 focus:bg-white text-slate-900 transition-all outline-none ${
                errors.fullName
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-slate-300 focus:border-unt-blue focus:ring-2 focus:ring-unt-blue/20"
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 mt-1">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-unt-blue" />
              <span>3. Escuela / Carrera UNT</span>
            </label>
            <input
              {...register("career")}
              type="text"
              placeholder="Ej. Ingeniería de Sistemas"
              className={`w-full text-sm px-3.5 py-2 rounded-xl border bg-slate-50 focus:bg-white text-slate-900 transition-all outline-none ${
                errors.career
                  ? "border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-slate-300 focus:border-unt-blue focus:ring-2 focus:ring-unt-blue/20"
              }`}
            />
            {errors.career && (
              <p className="text-xs text-red-600 mt-1">{errors.career.message}</p>
            )}
          </div>
        </div>

        {/* Row 3: WhatsApp Phone */}
        <div>
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block flex items-center gap-1">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>4. Teléfono Celular (WhatsApp)</span>
          </label>
          <input
            {...register("phone")}
            type="tel"
            placeholder="Ej. 948123456"
            className={`w-full text-sm font-mono px-3.5 py-2 rounded-xl border bg-slate-50 focus:bg-white text-slate-900 transition-all outline-none ${
              errors.phone
                ? "border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-slate-300 focus:border-unt-blue focus:ring-2 focus:ring-unt-blue/20"
            }`}
          />
          {errors.phone && (
            <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>
          )}
        </div>

        {/* Row 4: Digital Signature Canvas */}
        <div className="pt-1">
          <SignaturePad
            key={signatureKey}
            onSignatureChange={(sig) => {
              setValue("signatureData", sig || "", { shouldValidate: true });
            }}
            height={130}
          />
          {errors.signatureData && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.signatureData.message}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleManualReset}
            className="px-3.5 py-3 rounded-xl border border-slate-300 text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center gap-1.5 text-xs font-medium"
            title="Limpiar formulario para nuevo registro"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            type="submit"
            disabled={submitting}
            className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] ${
              isBusFull
                ? "bg-slate-400 text-white cursor-not-allowed"
                : "bg-unt-blue hover:bg-[#082a57] text-white shadow-unt-blue/30 hover:shadow-unt-blue/50"
            }`}
          >
            <Sparkles className="w-4 h-4 text-unt-gold animate-pulse-quick" />
            <span>{submitting ? "REGISTRANDO..." : "REGISTRAR ABORDAJE (LISTO)"}</span>
          </button>
        </div>
      </form>

      {/* QR/Barcode Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
