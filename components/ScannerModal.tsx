"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, Camera, Zap, AlertCircle } from "lucide-react";
import { UNT_STUDENTS } from "@/lib/mock-data";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (studentCode: string) => void;
}

export default function ScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: ScannerModalProps) {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<unknown>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    async function startScanner() {
      try {
        setIsScanning(true);
        setCameraError(null);

        // Dynamically import Html5Qrcode to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode");
        
        if (!mounted) return;

        const html5QrCode = new Html5Qrcode("reader");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            // Found barcode/QR code!
            html5QrCode.stop().catch(() => {});
            onScanSuccess(decodedText.trim());
            onClose();
          },
          () => {
            // Scanning in progress...
          }
        );
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : "No se pudo acceder a la cámara";
        setCameraError(msg);
      } finally {
        if (mounted) setIsScanning(false);
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (scannerRef.current as any).stop?.().catch(() => {});
      }
    };
  }, [isOpen, onClose, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-unt-blue text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-unt-gold" />
            <h3 className="font-semibold text-base">Escanear Carné UNT (Código/QR)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="p-4 flex flex-col items-center">
          <div className="relative w-full aspect-square max-h-64 rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border-2 border-dashed border-unt-blue/40">
            <div id="reader" className="w-full h-full" />
            
            {cameraError && (
              <div className="absolute inset-0 bg-slate-900/90 text-slate-200 p-4 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                <p className="text-xs font-medium text-slate-300 mb-1">Cámara no disponible o sin permisos</p>
                <p className="text-[11px] text-slate-400 mb-3">Puedes seleccionar un estudiante UNT de la lista rápida abajo:</p>
              </div>
            )}
            
            {isScanning && !cameraError && (
              <div className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-red-500 shadow-[0_0_8px_red] animate-pulse" />
            )}
          </div>

          <p className="text-xs text-slate-500 mt-2 text-center">
            Apunta la cámara al código de barras o QR del Carné Universitario UNT.
          </p>

          {/* Quick Selection Shortcuts (Ideal for test or fallback) */}
          <div className="w-full mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <Zap className="w-3.5 h-3.5 text-unt-amber" />
              <span>Acceso Rápido Simulado (Alumnos UNT):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {UNT_STUDENTS.slice(0, 6).map((student) => (
                <button
                  key={student.id}
                  onClick={() => {
                    onScanSuccess(student.code);
                    onClose();
                  }}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-unt-blue/5 hover:border-unt-blue transition-all"
                >
                  <p className="text-xs font-bold text-unt-blue font-mono">{student.code}</p>
                  <p className="text-[11px] text-slate-700 truncate">{student.name} {student.lastName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{student.career}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
