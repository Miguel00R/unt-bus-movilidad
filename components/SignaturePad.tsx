"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Eraser, Check, PenTool, Sparkles } from "lucide-react";

interface SignaturePadProps {
  onSignatureChange: (signatureBase64: string | null) => void;
  height?: number;
}

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

type Stroke = Point[];

export default function SignaturePad({
  onSignatureChange,
  height = 165,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [strokeThickness, setStrokeThickness] = useState<"fina" | "normal">("normal");

  // Store all strokes to redraw smoothly on resize without losing signature
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke>([]);

  // Base line width according to selected thickness
  const baseLineWidth = strokeThickness === "fina" ? 1.8 : 2.2;
  const inkColor = "#002B66"; // UNT Institutional Navy Blue

  // Configure context for high-precision and smoothness
  const setupContext = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.lineWidth = baseLineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = inkColor;
      ctx.fillStyle = inkColor;
    },
    [baseLineWidth]
  );

  // Redraw all recorded strokes using smooth Bézier curves
  const redrawStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setupContext(ctx);

    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;

      if (stroke.length === 1) {
        // Draw single dot
        const pt = stroke[0];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, baseLineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      if (stroke.length === 2) {
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        ctx.lineTo(stroke[1].x, stroke[1].y);
        ctx.stroke();
        continue;
      }

      // Smooth Bézier curve interpolation
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);

      for (let i = 1; i < stroke.length - 1; i++) {
        const p1 = stroke[i];
        const p2 = stroke[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }

      const last = stroke[stroke.length - 1];
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
  }, [baseLineWidth, setupContext]);

  // Handle canvas sizing and high-DPI retina display
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(window.devicePixelRatio || 1, 2); // Minimum 2x DPR for ultra crispness

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);
    setupContext(ctx);

    if (strokesRef.current.length > 0) {
      redrawStrokes();
    }
  }, [setupContext, redrawStrokes]);

  useEffect(() => {
    initCanvas();
    const handleResize = () => initCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initCanvas]);

  const getCoordinates = (
    e: PointerEvent | React.PointerEvent<HTMLCanvasElement>
  ): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure && e.pressure > 0 ? e.pressure : 0.5,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }

    setupContext(ctx);
    const pt = getCoordinates(e);
    currentStrokeRef.current = [pt];
    setIsDrawing(true);

    // Draw immediate responsive contact point (dot)
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, baseLineWidth * 0.6, 0, Math.PI * 2);
    ctx.fill();
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nativeEvt = e.nativeEvent as PointerEvent;
    // Extract high-rate hardware digitizer points if supported (up to 240Hz on modern touchscreens)
    const coalesced: PointerEvent[] =
      typeof nativeEvt.getCoalescedEvents === "function" &&
      nativeEvt.getCoalescedEvents().length > 0
        ? nativeEvt.getCoalescedEvents()
        : [nativeEvt];

    const currentStroke = currentStrokeRef.current;

    for (const subEvt of coalesced) {
      const pt = getCoordinates(subEvt);
      currentStroke.push(pt);

      const len = currentStroke.length;
      if (len < 2) continue;

      if (len === 2) {
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      } else {
        // High-precision smooth Bézier curve interpolation
        const p0 = currentStroke[len - 3];
        const p1 = currentStroke[len - 2];
        const p2 = currentStroke[len - 1];

        const midPrevX = (p0.x + p1.x) / 2;
        const midPrevY = (p0.y + p1.y) / 2;
        const midCurrX = (p1.x + p2.x) / 2;
        const midCurrY = (p1.y + p2.y) / 2;

        ctx.beginPath();
        ctx.moveTo(midPrevX, midPrevY);
        ctx.quadraticCurveTo(p1.x, p1.y, midCurrX, midCurrY);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(false);

    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {
      // safe fallback
    }

    if (currentStrokeRef.current.length > 0) {
      strokesRef.current.push([...currentStrokeRef.current]);
      currentStrokeRef.current = [];
      setHasSignature(true);

      // Export high-resolution transparent Base64 PNG
      const dataUrl = canvas.toDataURL("image/png");
      onSignatureChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    strokesRef.current = [];
    currentStrokeRef.current = [];
    setHasSignature(false);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    onSignatureChange(null);
  };

  return (
    <div className="w-full flex flex-col space-y-1.5 select-none">
      {/* Signature Toolbar */}
      <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-blue-900 font-semibold">
            <PenTool className="w-3.5 h-3.5 text-blue-600" />
            Firma Digital Táctil
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-2.5 h-2.5" />
            Trazo fluido
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Stroke thickness toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[10px]">
            <button
              type="button"
              onClick={() => setStrokeThickness("fina")}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                strokeThickness === "fina"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Fina
            </button>
            <button
              type="button"
              onClick={() => setStrokeThickness("normal")}
              className={`px-2 py-0.5 rounded transition-all font-medium ${
                strokeThickness === "normal"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Fluida
            </button>
          </div>

          <button
            type="button"
            onClick={clearCanvas}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors px-2 py-0.5 rounded text-xs bg-slate-100 hover:bg-red-50 border border-slate-200"
            title="Borrar y volver a firmar"
          >
            <Eraser className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* Signature Canvas Box */}
      <div
        className="relative w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white shadow-inner overflow-hidden select-none hover:border-blue-400 focus-within:border-blue-500 transition-colors"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          className="w-full h-full cursor-crosshair touch-none select-none"
          style={{
            touchAction: "none",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
          }}
        />

        {/* Visual institutional guide line */}
        <div className="pointer-events-none absolute bottom-4 left-6 right-6 border-b border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
          <span>X Firma del Alumno / Usuario</span>
          <span className="font-semibold text-slate-300 tracking-wider">UNT MOVILIDAD</span>
        </div>

        {/* Placeholder hint when clean */}
        {!hasSignature && !isDrawing && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-1">
            <span className="text-xs font-medium text-slate-500">
              Deslice su dedo aquí para firmar
            </span>
            <span className="text-[10px] text-slate-400">
              Trazo de alta sensibilidad adaptado a pantalla táctil
            </span>
          </div>
        )}

        {/* Success badge when captured */}
        {hasSignature && !isDrawing && (
          <div className="pointer-events-none absolute top-2 right-2 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-xs animate-in fade-in duration-200">
            <Check className="w-3 h-3 stroke-[3]" />
            Firma capturada
          </div>
        )}
      </div>
    </div>
  );
}
