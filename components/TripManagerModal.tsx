"use client";

import React, { useState } from "react";
import { X, Bus as BusIcon, Route as RouteIcon, PlayCircle, Plus } from "lucide-react";
import { Trip, Bus, Route } from "@/lib/types";
import { UNT_BUSES, UNT_ROUTES } from "@/lib/mock-data";

interface TripManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrip: Trip;
  onUpdateTrip: (updatedTrip: Trip) => void;
}

export default function TripManagerModal({
  isOpen,
  onClose,
  currentTrip,
  onUpdateTrip,
}: TripManagerModalProps) {
  const [selectedBusId, setSelectedBusId] = useState(currentTrip.busId);
  const [selectedRouteId, setSelectedRouteId] = useState(currentTrip.routeId);
  const [driverName, setDriverName] = useState(currentTrip.bus?.driverName || "");

  if (!isOpen) return null;

  const handleSave = () => {
    const bus = UNT_BUSES.find((b) => b.id === selectedBusId) || currentTrip.bus;
    const route = UNT_ROUTES.find((r) => r.id === selectedRouteId) || currentTrip.route;

    const updatedBus: Bus = {
      ...(bus as Bus),
      driverName: driverName.trim() || bus?.driverName || "Conductor UNT",
    };

    const updated: Trip = {
      ...currentTrip,
      busId: selectedBusId,
      routeId: selectedRouteId,
      bus: updatedBus,
      route: route as Route,
    };

    onUpdateTrip(updated);
    onClose();
  };

  const handleStartNewTrip = () => {
    if (confirm("¿Iniciar un nuevo viaje? Los datos actuales se archivarán.")) {
      const bus = UNT_BUSES.find((b) => b.id === selectedBusId) || UNT_BUSES[0];
      const route = UNT_ROUTES.find((r) => r.id === selectedRouteId) || UNT_ROUTES[0];

      const newTrip: Trip = {
        id: `trip-unt-${Date.now()}`,
        busId: bus.id,
        routeId: route.id,
        bus: { ...bus, driverName: driverName || bus.driverName },
        route,
        status: "IN_PROGRESS",
        departureTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        boardings: [],
      };

      onUpdateTrip(newTrip);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-unt-blue text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BusIcon className="w-5 h-5 text-unt-gold" />
            <h3 className="font-bold text-base">Configuración de Unidad y Ruta</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Select Bus */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <BusIcon className="w-3.5 h-3.5 text-unt-blue" />
              <span>Unidad de Transporte UNT</span>
            </label>
            <select
              value={selectedBusId}
              onChange={(e) => {
                const bus = UNT_BUSES.find((b) => b.id === e.target.value);
                setSelectedBusId(e.target.value);
                if (bus) setDriverName(bus.driverName);
              }}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 outline-none"
            >
              {UNT_BUSES.map((bus) => (
                <option key={bus.id} value={bus.id}>
                  {bus.unitNumber} ({bus.plateNumber}) - Capacidad: {bus.capacity} asientos
                </option>
              ))}
            </select>
          </div>

          {/* Driver Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Conductor Responsable
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Nombre del conductor"
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 outline-none"
            />
          </div>

          {/* Select Route */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
              <RouteIcon className="w-3.5 h-3.5 text-unt-blue" />
              <span>Ruta de Servicio</span>
            </label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 outline-none"
            >
              {UNT_ROUTES.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleStartNewTrip}
              className="px-3.5 py-2.5 rounded-xl border border-unt-blue/30 text-unt-blue hover:bg-unt-blue/5 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Iniciar Nuevo Viaje</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl bg-unt-blue hover:bg-[#082a57] text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <PlayCircle className="w-4 h-4 text-unt-gold" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
