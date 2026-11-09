"use client";

import React from "react";
import { Bus, MapPin, User, Settings2, ShieldCheck } from "lucide-react";
import { Trip } from "@/lib/types";

interface TripHeaderProps {
  trip: Trip;
  onOpenTripManager: () => void;
}

export default function TripHeader({ trip, onOpenTripManager }: TripHeaderProps) {
  const bus = trip.bus;
  const route = trip.route;

  return (
    <div className="bg-gradient-to-r from-unt-blue via-[#0d2f5d] to-unt-navy text-white rounded-2xl p-5 shadow-lg border border-white/10 relative overflow-hidden">
      {/* Decorative UNT background accent */}
      <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-unt-gold/10 blur-2xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        {/* Left: Bus & Route Information */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-unt-gold text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-md tracking-wider flex items-center gap-1 shadow-sm">
              <Bus className="w-3.5 h-3.5" />
              {bus?.unitNumber || "Bus UNT #01"}
            </span>

            <span className="bg-white/15 text-slate-100 text-xs font-mono font-semibold px-2 py-0.5 rounded-md border border-white/10">
              Placa: {bus?.plateNumber || "EGB-123"}
            </span>

            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {trip.status === "IN_PROGRESS" ? "EN SERVICIO ACTIVO" : trip.status}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-unt-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm md:text-base font-bold text-white tracking-wide">
                {route?.name || "Ciudad Universitaria -> Local Central -> Huanchaco"}
              </p>
              <p className="text-xs text-blue-200">
                Origen: <span className="text-white font-medium">{route?.origin}</span> &rarr; Destino:{" "}
                <span className="text-white font-medium">{route?.destination}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Driver & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 lg:self-center">
          <div className="bg-black/20 rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-unt-blue border border-unt-gold/40 flex items-center justify-center text-unt-gold font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-300 font-medium uppercase tracking-wider">Conductor UNT</p>
              <p className="text-xs font-bold text-white">{bus?.driverName || "Manuel Morales C."}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenTripManager}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-all shadow-sm"
            title="Cambiar Bus, Conductor o Ruta de Viaje"
          >
            <Settings2 className="w-4 h-4 text-unt-gold" />
            <span>Cambiar Viaje / Ruta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
