"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bus,
  QrCode,
  Users,
  GraduationCap,
  History,
  UserCheck,
  ShieldCheck,
  FileText,
  FileSpreadsheet,
  Scan,
  Compass,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  CameraOff,
  Search,
  Pencil,
  Trash2,
  Eye,
  Check,
  Play,
  X,
  Upload,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { AuthUser } from "@/lib/auth";
import { playSuccessBeep, playErrorBeep } from "@/lib/audio";
import {
  UniEstudiante,
  UniViaje,
  UniPasajero,
  exportarExcelViaje,
  exportarPDFViaje,
} from "@/lib/export-utils";

// --- SEED INITIAL STUDENTS (Matching screenshot 3) ---
const SEED_ESTUDIANTES: UniEstudiante[] = [
  {
    id: 1,
    codigo: "1052300512",
    nombres: "Carlos Alberto",
    apellidos: "García Vega",
    carrera: "Agronomía",
    lugar: "Guadalupe",
  },
  {
    id: 2,
    codigo: "1052100122",
    nombres: "Jhon Robinson",
    apellidos: "Llique Chávarry",
    carrera: "Ingeniería de Sistemas",
    lugar: "Pacasmayo",
  },
  {
    id: 3,
    codigo: "1052100890",
    nombres: "Ana Lucía",
    apellidos: "Rojas Mendoza",
    carrera: "Ingeniería de Sistemas",
    lugar: "San Pedro de Lloc",
  },
  {
    id: 4,
    codigo: "1052200341",
    nombres: "María Fernanda",
    apellidos: "Torres Silva",
    carrera: "Administración",
    lugar: "Chepén",
  },
];

type ActiveTab =
  | "tab-viaje"
  | "tab-abordaje"
  | "tab-pasajeros"
  | "tab-estudiantes"
  | "tab-historial";

export type UserRole = "admin" | "operador" | "estudiante";

interface UniControlDashboardProps {
  currentUser?: AuthUser | null;
  initialRole?: UserRole;
  onLogout?: () => void;
}

export default function UniControlDashboard({
  currentUser,
  initialRole = "admin",
  onLogout,
}: UniControlDashboardProps) {
  // App State
  const [estudiantes, setEstudiantes] = useState<UniEstudiante[]>([]);
  const [viajes, setViajes] = useState<UniViaje[]>([]);
  const [pasajeros, setPasajeros] = useState<UniPasajero[]>([]);
  const [activeViajeId, setActiveViajeId] = useState<number | null>(null);

  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);
  const [activeTab, setActiveTab] = useState<ActiveTab>("tab-viaje");
  const [systemTime, setSystemTime] = useState<string>("--:--:--");

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedViajeDetail, setSelectedViajeDetail] = useState<UniViaje | null>(
    null
  );

  // New Trip Form state
  const [viajeChofer, setViajeChofer] = useState("");
  const [viajePlaca, setViajePlaca] = useState("");
  const [viajeOrigen, setViajeOrigen] = useState("Filial Jequetepeque");
  const [viajeDestino, setViajeDestino] = useState("Chepén / Guadalupe");
  const [viajeRuta, setViajeRuta] = useState("Ruta A - Chepén");
  const [viajeTurno, setViajeTurno] = useState("Mañana");
  const [viajeAsientos, setViajeAsientos] = useState(48);
  const [viajeFecha, setViajeFecha] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Scanner & Validation state
  const [inputCodigoScan, setInputCodigoScan] = useState("");
  const [scanResult, setScanResult] = useState<{
    type: "neutral" | "success" | "duplicate" | "error";
    title: string;
    subtitle: string;
    badges: string[];
  }>({
    type: "neutral",
    title: "Esperando lectura...",
    subtitle: "Los datos del estudiante registrado aparecerán aquí",
    badges: [],
  });
  const [showQuickRegister, setShowQuickRegister] = useState(false);
  const [qrNombres, setQrNombres] = useState("");
  const [qrApellidos, setQrApellidos] = useState("");
  const [qrCarrera, setQrCarrera] = useState("");
  const [qrLugar, setQrLugar] = useState("");

  // Camera state
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [ocrStatusMsg, setOcrStatusMsg] = useState("Listo para escanear");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Passengers Tab state
  const [searchPasajeros, setSearchPasajeros] = useState("");

  // Students Tab state
  const [searchEstudiantes, setSearchEstudiantes] = useState("");
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [estCodigo, setEstCodigo] = useState("");
  const [estCarrera, setEstCarrera] = useState("");
  const [estNombres, setEstNombres] = useState("");
  const [estApellidos, setEstApellidos] = useState("");
  const [estLugar, setEstLugar] = useState("");

  // History Tab state
  const [filterFechaHistorial, setFilterFechaHistorial] = useState(
    new Date().toISOString().split("T")[0]
  );

  // 1. Initial Load & Clock
  useEffect(() => {
    try {
      const storedEst = localStorage.getItem("unicontrol_estudiantes");
      if (storedEst) {
        setEstudiantes(JSON.parse(storedEst));
      } else {
        setEstudiantes(SEED_ESTUDIANTES);
        localStorage.setItem(
          "unicontrol_estudiantes",
          JSON.stringify(SEED_ESTUDIANTES)
        );
      }

      const storedViajes = localStorage.getItem("unicontrol_viajes");
      if (storedViajes) setViajes(JSON.parse(storedViajes));

      const storedPasajeros = localStorage.getItem("unicontrol_pasajeros");
      if (storedPasajeros) setPasajeros(JSON.parse(storedPasajeros));

      const storedActiveId = localStorage.getItem("unicontrol_active_viaje_id");
      if (storedActiveId) setActiveViajeId(JSON.parse(storedActiveId));

      const storedRole = localStorage.getItem("unicontrol_user_role");
      if (storedRole) setCurrentRole(storedRole as UserRole);
    } catch {
      // fallback
    }

    // Digital clock interval
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString("es-PE", { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save changes to storage
  const saveEstudiantes = (data: UniEstudiante[]) => {
    setEstudiantes(data);
    localStorage.setItem("unicontrol_estudiantes", JSON.stringify(data));
  };

  const saveViajes = (data: UniViaje[]) => {
    setViajes(data);
    localStorage.setItem("unicontrol_viajes", JSON.stringify(data));
  };

  const savePasajeros = (data: UniPasajero[]) => {
    setPasajeros(data);
    localStorage.setItem("unicontrol_pasajeros", JSON.stringify(data));
  };

  const saveActiveViajeId = (id: number | null) => {
    setActiveViajeId(id);
    localStorage.setItem("unicontrol_active_viaje_id", JSON.stringify(id));
  };

  const activeViaje = viajes.find((v) => v.id === activeViajeId && !v.cerrado) || null;
  const activePasajeros = activeViaje
    ? pasajeros.filter((p) => p.viajeId === activeViaje.id)
    : [];

  // --- TRIP LOGIC ---
  const handleCrearViaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeViaje) {
      alert(
        `Ya tienes un viaje activo (${activeViaje.ruta}). Debes cerrarlo antes de iniciar otro.`
      );
      return;
    }

    if (!viajeChofer.trim()) {
      alert("Por favor ingresa el nombre del Chofer.");
      return;
    }

    const nuevo: UniViaje = {
      id: Date.now(),
      chofer: viajeChofer.trim(),
      placa: viajePlaca.trim().toUpperCase(),
      origen: viajeOrigen.trim(),
      destino: viajeDestino.trim(),
      ruta: viajeRuta,
      turno: viajeTurno,
      horaSalida: new Date().toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      horaLlegada: "",
      fecha: viajeFecha,
      totalAsientos: viajeAsientos || 48,
      cerrado: false,
    };

    const updatedViajes = [nuevo, ...viajes];
    saveViajes(updatedViajes);
    saveActiveViajeId(nuevo.id);
    setActiveTab("tab-abordaje");
    playSuccessBeep();
  };

  const handleMarcarHoraSalida = () => {
    if (!activeViaje) return;
    const ahora = new Date().toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const updated = viajes.map((v) =>
      v.id === activeViaje.id ? { ...v, horaSalida: ahora } : v
    );
    saveViajes(updated);
    alert(`Hora de salida actualizada: ${ahora}`);
  };

  const handleCerrarViaje = () => {
    if (!activeViaje) return;
    if (!confirm(`¿Deseas finalizar y cerrar el viaje ${activeViaje.ruta}?`))
      return;

    const horaLlegada = new Date().toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const updated = viajes.map((v) =>
      v.id === activeViaje.id ? { ...v, cerrado: true, horaLlegada } : v
    );
    saveViajes(updated);
    saveActiveViajeId(null);
    alert(`Viaje cerrado exitosamente a las ${horaLlegada}`);
  };

  // --- BOARDING / VALIDATION LOGIC ---
  const handleProcesarValidacion = () => {
    const code = inputCodigoScan.trim();
    if (!code) return;

    if (!activeViaje) {
      setScanResult({
        type: "error",
        title: "Sin viaje activo",
        subtitle: 'Primero inicia un viaje en la pestaña "Gestión de Viaje"',
        badges: [],
      });
      playErrorBeep();
      return;
    }

    // Check duplicate
    const yaAbordo = pasajeros.some(
      (p) =>
        p.viajeId === activeViaje.id &&
        p.codigo.toLowerCase() === code.toLowerCase()
    );
    if (yaAbordo) {
      setScanResult({
        type: "duplicate",
        title: "Ya está registrado a bordo",
        subtitle: `El código ${code} ya abordó este viaje.`,
        badges: [code],
      });
      playErrorBeep();
      return;
    }

    // Lookup student in DB
    const student = estudiantes.find(
      (e) => e.codigo.toLowerCase() === code.toLowerCase()
    );

    if (student) {
      const hora = new Date().toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const nuevoPasajero: UniPasajero = {
        id: Date.now(),
        viajeId: activeViaje.id,
        horaAbordaje: hora,
        nombres: student.nombres,
        apellidos: student.apellidos,
        codigo: student.codigo,
        carrera: student.carrera,
        estado: "Abordó",
      };

      savePasajeros([nuevoPasajero, ...pasajeros]);
      setScanResult({
        type: "success",
        title: `${student.nombres} ${student.apellidos}`,
        subtitle: `Abordaje registrado a las ${hora}`,
        badges: [student.codigo, student.carrera, student.lugar || "UNT"],
      });
      playSuccessBeep();
      setInputCodigoScan("");
      setShowQuickRegister(false);
    } else {
      setScanResult({
        type: "error",
        title: "Estudiante no encontrado",
        subtitle: `El código ${code} no está en la base de datos. Complétalo abajo para registrarlo.`,
        badges: [code],
      });
      playErrorBeep();
      setShowQuickRegister(true);
      setQrNombres("");
      setQrApellidos("");
      setQrCarrera("");
      setQrLugar("");
    }
  };

  const handleGuardarRegistroRapido = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCodigoScan.trim();
    if (!code || !qrNombres.trim() || !qrApellidos.trim() || !qrCarrera.trim())
      return;

    const nuevoEstudiante: UniEstudiante = {
      id: Date.now(),
      codigo: code,
      nombres: qrNombres.trim(),
      apellidos: qrApellidos.trim(),
      carrera: qrCarrera.trim(),
      lugar: qrLugar.trim() || "Filial",
    };
    const updatedEst = [...estudiantes, nuevoEstudiante];
    saveEstudiantes(updatedEst);

    if (activeViaje) {
      const hora = new Date().toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const nuevoPasajero: UniPasajero = {
        id: Date.now() + 1,
        viajeId: activeViaje.id,
        horaAbordaje: hora,
        nombres: nuevoEstudiante.nombres,
        apellidos: nuevoEstudiante.apellidos,
        codigo: nuevoEstudiante.codigo,
        carrera: nuevoEstudiante.carrera,
        estado: "Abordó",
      };
      savePasajeros([nuevoPasajero, ...pasajeros]);
    }

    setScanResult({
      type: "success",
      title: `${nuevoEstudiante.nombres} ${nuevoEstudiante.apellidos}`,
      subtitle: "Guardado en padrón y registrado en el viaje",
      badges: [nuevoEstudiante.codigo, nuevoEstudiante.carrera],
    });
    playSuccessBeep();
    setShowQuickRegister(false);
    setInputCodigoScan("");
  };

  // --- PASSENGER MANAGEMENT ---
  const handleEliminarPasajero = (id: number) => {
    if (!confirm("¿Deseas anular este abordaje?")) return;
    savePasajeros(pasajeros.filter((p) => p.id !== id));
  };

  // --- STUDENT MANAGEMENT ---
  const handleGuardarEstudiante = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estCodigo.trim() || !estNombres.trim() || !estApellidos.trim()) return;

    if (editingStudentId) {
      const updated = estudiantes.map((s) =>
        s.id === editingStudentId
          ? {
              ...s,
              codigo: estCodigo.trim(),
              carrera: estCarrera.trim(),
              nombres: estNombres.trim(),
              apellidos: estApellidos.trim(),
              lugar: estLugar.trim(),
            }
          : s
      );
      saveEstudiantes(updated);
      handleCancelarEdicion();
    } else {
      if (
        estudiantes.some(
          (s) => s.codigo.toLowerCase() === estCodigo.trim().toLowerCase()
        )
      ) {
        alert("Ya existe un estudiante con este código universitario");
        return;
      }
      const nuevo: UniEstudiante = {
        id: Date.now(),
        codigo: estCodigo.trim(),
        carrera: estCarrera.trim(),
        nombres: estNombres.trim(),
        apellidos: estApellidos.trim(),
        lugar: estLugar.trim(),
      };
      saveEstudiantes([...estudiantes, nuevo]);
      handleCancelarEdicion();
    }
  };

  const handleEditarEstudiante = (s: UniEstudiante) => {
    setEditingStudentId(s.id);
    setEstCodigo(s.codigo);
    setEstCarrera(s.carrera);
    setEstNombres(s.nombres);
    setEstApellidos(s.apellidos);
    setEstLugar(s.lugar || "");
  };

  const handleCancelarEdicion = () => {
    setEditingStudentId(null);
    setEstCodigo("");
    setEstCarrera("");
    setEstNombres("");
    setEstApellidos("");
    setEstLugar("");
  };

  const handleEliminarEstudiante = (id: number) => {
    if (!confirm("¿Deseas eliminar este estudiante del padrón?")) return;
    saveEstudiantes(estudiantes.filter((s) => s.id !== id));
  };

  // --- HISTORY MANAGEMENT ---
  const handleEliminarViaje = (viajeId: number) => {
    if (
      !confirm(
        "¿Deseas eliminar este recorrido y todos sus registros de abordaje?"
      )
    )
      return;
    saveViajes(viajes.filter((v) => v.id !== viajeId));
    savePasajeros(pasajeros.filter((p) => p.viajeId !== viajeId));
    if (activeViajeId === viajeId) {
      saveActiveViajeId(null);
    }
  };

  // --- CAMERA CONTROL ---
  const handleToggleCamera = async () => {
    if (isCameraRunning) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraRunning(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraRunning(true);
      } catch (err) {
        alert("No se pudo acceder a la cámara: " + String(err));
      }
    }
  };

  // --- EXPORT TRIGGERS ---
  const handleExportPDF = () => {
    if (!activeViaje) {
      alert("No hay un viaje activo para exportar.");
      return;
    }
    exportarPDFViaje(activeViaje, activePasajeros);
  };

  const handleExportExcel = () => {
    if (!activeViaje) {
      alert(
        "No hay un viaje activo para exportar. Puedes exportar viajes pasados desde la pestaña Historial."
      );
      return;
    }
    exportarExcelViaje(activeViaje, activePasajeros);
  };

  // Titles for tabs
  const tabTitles: Record<ActiveTab, { title: string; subtitle: string }> = {
    "tab-viaje": {
      title: "Gestión de Viaje",
      subtitle: "Configura el chofer, ruta y capacidad de la unidad",
    },
    "tab-abordaje": {
      title: "Control de Abordaje",
      subtitle: "Escanea el carnet o digita el código de matrícula",
    },
    "tab-pasajeros": {
      title: "Lista de Pasajeros",
      subtitle: "Estudiantes confirmados a bordo del bus actual",
    },
    "tab-estudiantes": {
      title: "Padrón de Estudiantes",
      subtitle: "Base de datos universitaria local",
    },
    "tab-historial": {
      title: "Historial de Recorridos",
      subtitle: "Registro consolidado de todos los viajes",
    },
  };

  // Filtered lists
  const filteredPasajeros = activePasajeros.filter((p) => {
    if (!searchPasajeros.trim()) return true;
    const q = searchPasajeros.toLowerCase();
    return (
      p.nombres.toLowerCase().includes(q) ||
      p.apellidos.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.carrera.toLowerCase().includes(q)
    );
  });

  const filteredEstudiantes = estudiantes
    .filter((e) => {
      if (!searchEstudiantes.trim()) return true;
      const q = searchEstudiantes.toLowerCase();
      return (
        e.nombres.toLowerCase().includes(q) ||
        e.apellidos.toLowerCase().includes(q) ||
        e.codigo.toLowerCase().includes(q) ||
        e.carrera.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos));

  const filteredViajes = viajes.filter((v) => {
    if (!filterFechaHistorial) return true;
    return v.fecha === filterFechaHistorial;
  });

  return (
    <div className="app-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="sidebar">
        <div className="brand">
          <div className="logo-box">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div className="brand-text">
            <h1>UniControl</h1>
            <span>UNT FILIAL JEQUETEPEQUE</span>
          </div>
        </div>

        {/* Quick Status Pill */}
        <div
          className={`active-trip-pill ${!activeViaje ? "inactive" : ""}`}
          id="sidebarTripStatus"
        >
          <div className={`pill-dot ${activeViaje ? "blink" : ""}`} />
          <div className="pill-info">
            <small>Viaje Activo</small>
            <strong>{activeViaje ? activeViaje.ruta : "Sin viaje activo"}</strong>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === "tab-viaje" ? "active" : ""}`}
            onClick={() => setActiveTab("tab-viaje")}
          >
            <Compass className="w-5 h-5" />
            <span>Gestión de Viaje</span>
          </button>

          {(currentRole === "admin" || currentRole === "operador") && (
            <button
              className={`nav-item ${
                activeTab === "tab-abordaje" ? "active" : ""
              }`}
              onClick={() => setActiveTab("tab-abordaje")}
            >
              <QrCode className="w-5 h-5" />
              <span>Abordaje / Escáner</span>
            </button>
          )}

          <button
            className={`nav-item ${
              activeTab === "tab-pasajeros" ? "active" : ""
            }`}
            onClick={() => setActiveTab("tab-pasajeros")}
          >
            <Users className="w-5 h-5" />
            <span>Lista de Pasajeros</span>
            <span className="badge">{activePasajeros.length}</span>
          </button>

          {currentRole === "admin" && (
            <button
              className={`nav-item ${
                activeTab === "tab-estudiantes" ? "active" : ""
              }`}
              onClick={() => setActiveTab("tab-estudiantes")}
            >
              <GraduationCap className="w-5 h-5" />
              <span>Estudiantes (BD)</span>
              <span className="badge">{estudiantes.length}</span>
            </button>
          )}

          {currentRole === "admin" && (
            <button
              className={`nav-item ${
                activeTab === "tab-historial" ? "active" : ""
              }`}
              onClick={() => setActiveTab("tab-historial")}
            >
              <History className="w-5 h-5" />
              <span>Historial de Viajes</span>
            </button>
          )}

          <button
            className="nav-item"
            onClick={() => setIsRoleModalOpen(true)}
            style={{
              border: "1px dashed rgba(56, 189, 248, 0.4)",
              marginTop: "10px",
              color: "#38bdf8",
            }}
          >
            <UserCheck className="w-5 h-5" />
            <span>Cambiar de Rol</span>
          </button>

          {onLogout && (
            <button
              className="nav-item"
              onClick={onLogout}
              style={{
                border: "1px dashed rgba(239, 68, 68, 0.4)",
                marginTop: "6px",
                color: "#f87171",
              }}
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="system-time">{systemTime}</div>
          <div className="offline-badge">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Offline (SQLite Local)
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <h2>{tabTitles[activeTab].title}</h2>
            <p>{tabTitles[activeTab].subtitle}</p>
          </div>
          <div className="topbar-right">
            {/* User Role Badge */}
            <div
              className="user-role-badge"
              onClick={() => setIsRoleModalOpen(true)}
              title="Cambiar rol"
            >
              <div
                className="role-avatar"
                style={{
                  background:
                    currentRole === "admin"
                      ? "linear-gradient(135deg, #0284c7, #0369a1)"
                      : currentRole === "operador"
                      ? "linear-gradient(135deg, #059669, #047857)"
                      : "linear-gradient(135deg, #d97706, #b45309)",
                }}
              >
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="role-text">
                <strong>
                  {currentUser?.name
                    ? currentUser.name
                    : currentRole === "admin"
                    ? "Administrador / Supervisor"
                    : currentRole === "operador"
                    ? "Operador / Conductor"
                    : "Estudiante (Consulta)"}
                </strong>
                <small>
                  {currentRole === "admin"
                    ? "Administrador"
                    : currentRole === "operador"
                    ? "Operador / Conductor"
                    : "Estudiante"} &bull; Clic para cambiar &darr;
                </small>
              </div>
            </div>

            {/* Action Buttons */}
            {currentRole === "admin" && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportPDF}
                  title="Exportar PDF Oficial UNT"
                >
                  <FileText className="w-4 h-4 text-red-400" /> Reporte PDF
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleExportExcel}
                  title="Exportar a Excel"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel
                </button>
              </>
            )}

            {(currentRole === "admin" || currentRole === "operador") && (
              <button
                className="btn btn-primary"
                onClick={() => setActiveTab("tab-abordaje")}
              >
                <Scan className="w-4 h-4" /> Escanear Carnet
              </button>
            )}

            {onLogout && (
              <button
                className="btn btn-outline"
                onClick={onLogout}
                style={{
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  color: "#f87171",
                  background: "rgba(239, 68, 68, 0.08)",
                }}
                title="Cerrar sesión y volver al login"
              >
                <LogOut className="w-4 h-4" /> Salir
              </button>
            )}
          </div>
        </header>

        {/* Tab Contents */}
        <div className="tab-contents">
          {/* ================= TAB 1: GESTIÓN DE VIAJE ================= */}
          {activeTab === "tab-viaje" && (
            <section className="tab-pane active">
              <div className="grid-2col">
                {/* Active Trip Dashboard Card */}
                <div className="card glass">
                  <div className="card-header">
                    <div className="icon-title">
                      <Compass className="w-5 h-5 text-sky-400" />
                      <h3>Estado del Viaje Actual</h3>
                    </div>
                    <span
                      className={`status-tag ${
                        activeViaje ? "active" : "closed"
                      }`}
                    >
                      {activeViaje ? "En Curso" : "Inactivo"}
                    </span>
                  </div>
                  <div className="card-body">
                    {!activeViaje ? (
                      <div className="empty-state">
                        <Bus className="w-14 h-14 text-slate-500/50 mb-3" />
                        <h4>No hay viaje iniciado</h4>
                        <p>
                          Inicia un nuevo recorrido para registrar el abordaje de
                          estudiantes.
                        </p>
                      </div>
                    ) : (
                      <div className="trip-dashboard-box">
                        <div className="trip-stat-grid">
                          <div className="stat-box">
                            <span className="label">Ruta</span>
                            <strong className="value highlight">
                              {activeViaje.ruta}
                            </strong>
                          </div>
                          <div className="stat-box">
                            <span className="label">Turno</span>
                            <strong className="value">
                              {activeViaje.turno}
                            </strong>
                          </div>
                          <div className="stat-box">
                            <span className="label">Chofer</span>
                            <strong className="value">
                              {activeViaje.chofer}
                            </strong>
                          </div>
                          <div className="stat-box">
                            <span className="label">Placa</span>
                            <strong className="value">
                              {activeViaje.placa || "Sin placa"}
                            </strong>
                          </div>
                          <div className="stat-box">
                            <span className="label">Recorrido</span>
                            <strong className="value">
                              {activeViaje.origen} &rarr; {activeViaje.destino}
                            </strong>
                          </div>
                          <div className="stat-box">
                            <span className="label">Salida</span>
                            <strong className="value">
                              {activeViaje.horaSalida || "No marcada"}
                            </strong>
                          </div>
                        </div>

                        {/* Capacity Tracker */}
                        <div className="capacity-tracker">
                          <div className="capacity-labels">
                            <span>Capacidad de Pasajeros</span>
                            <strong>
                              {activePasajeros.length} /{" "}
                              {activeViaje.totalAsientos} (
                              {Math.round(
                                (activePasajeros.length /
                                  activeViaje.totalAsientos) *
                                  100
                              )}
                              %)
                            </strong>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round(
                                    (activePasajeros.length /
                                      activeViaje.totalAsientos) *
                                      100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        {currentRole !== "estudiante" && (
                          <div className="trip-actions">
                            <button
                              className="btn btn-outline"
                              onClick={handleMarcarHoraSalida}
                            >
                              <Clock className="w-4 h-4" /> Marcar Hora Salida
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={handleCerrarViaje}
                            >
                              <Check className="w-4 h-4" /> Finalizar y Cerrar
                              Viaje
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Nuevo Recorrido (Hidden for students) */}
                {currentRole !== "estudiante" ? (
                  <div className="card glass">
                    <div className="card-header">
                      <div className="icon-title">
                        <PlusCircle className="w-5 h-5 text-sky-400" />
                        <h3>Nuevo Recorrido</h3>
                      </div>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleCrearViaje} className="form-grid">
                        <div className="form-group">
                          <label>Chofer Encargado *</label>
                          <input
                            type="text"
                            placeholder="Ej: Carlos Mendoza"
                            value={viajeChofer}
                            onChange={(e) => setViajeChofer(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Placa del Vehículo</label>
                          <input
                            type="text"
                            placeholder="Ej: T2B-964"
                            style={{ textTransform: "uppercase" }}
                            value={viajePlaca}
                            onChange={(e) => setViajePlaca(e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>Origen *</label>
                          <input
                            type="text"
                            value={viajeOrigen}
                            onChange={(e) => setViajeOrigen(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Destino *</label>
                          <input
                            type="text"
                            value={viajeDestino}
                            onChange={(e) => setViajeDestino(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Ruta (Código / Letra)</label>
                          <select
                            value={viajeRuta}
                            onChange={(e) => setViajeRuta(e.target.value)}
                          >
                            <option value="Ruta A - Chepén">
                              Ruta A - Chepén
                            </option>
                            <option value="Ruta B - Guadalupe">
                              Ruta B - Guadalupe
                            </option>
                            <option value="Ruta C - Pacasmayo">
                              Ruta C - Pacasmayo
                            </option>
                            <option value="Ruta Directa">Ruta Directa</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Turno</label>
                          <select
                            value={viajeTurno}
                            onChange={(e) => setViajeTurno(e.target.value)}
                          >
                            <option value="Mañana">Mañana</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noche">Noche</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Total Asientos Disponibles</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={viajeAsientos}
                            onChange={(e) =>
                              setViajeAsientos(parseInt(e.target.value) || 48)
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Fecha</label>
                          <input
                            type="date"
                            value={viajeFecha}
                            onChange={(e) => setViajeFecha(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-full">
                          <button
                            type="submit"
                            className="btn btn-primary btn-block"
                          >
                            <Play className="w-4 h-4 fill-white" /> Iniciar Este
                            Recorrido
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="card glass flex items-center justify-center p-8 text-center text-slate-400">
                    <p>
                      Como estudiante, tienes acceso en modo consulta para ver el
                      estado del bus y la lista de pasajeros en tiempo real.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= TAB 2: ABORDAJE / ESCANER ================= */}
          {activeTab === "tab-abordaje" && (
            <section className="tab-pane active">
              <div className="grid-2col">
                {/* Camera / Scanner Column */}
                <div className="card glass">
                  <div className="card-header">
                    <div className="icon-title">
                      <Camera className="w-5 h-5 text-sky-400" />
                      <h3>Cámara / Escáner de Carnet</h3>
                    </div>
                    <div className="camera-controls">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={handleToggleCamera}
                      >
                        {isCameraRunning ? (
                          <>
                            <CameraOff className="w-3.5 h-3.5 text-red-400" />{" "}
                            Detener Cámara
                          </>
                        ) : (
                          <>
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />{" "}
                            Iniciar Cámara
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="scanner-viewport-wrapper">
                      <video
                        ref={videoRef}
                        playsInline
                        id="scannerVideo"
                        style={{ display: isCameraRunning ? "block" : "none" }}
                      />
                      {isCameraRunning && (
                        <div className="scanner-reticle">
                          <div className="reticle-line" />
                          <span>Alinea el código de barras o carnet</span>
                        </div>
                      )}
                      {!isCameraRunning && (
                        <div className="cam-fallback">
                          <CameraOff className="w-12 h-12 text-slate-500 mb-2" />
                          <p>Cámara apagada</p>
                          <small>
                            Presiona &ldquo;Iniciar Cámara&rdquo; o ingresa el código
                            manualmente
                          </small>
                        </div>
                      )}
                    </div>

                    <div className="scanner-ocr-bar">
                      <label
                        className="btn btn-secondary btn-sm"
                        style={{ cursor: "pointer" }}
                      >
                        <Upload className="w-3.5 h-3.5" /> Subir foto de Carnet
                        (OCR)
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setOcrStatusMsg("Foto recibida. Procesando...");
                              setTimeout(() => {
                                setOcrStatusMsg("Listo para escanear");
                              }, 1500);
                            }
                          }}
                        />
                      </label>
                      <span className="ocr-status-text">{ocrStatusMsg}</span>
                    </div>
                  </div>
                </div>

                {/* Validation & Manual Input */}
                <div className="card glass">
                  <div className="card-header">
                    <div className="icon-title">
                      <QrCode className="w-5 h-5 text-sky-400" />
                      <h3>Validación de Ingreso</h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="lookup-box">
                      <label className="text-xs font-semibold text-slate-400 block mb-1">
                        Escanear o Digitar Código de Matrícula:
                      </label>
                      <div className="search-input-group">
                        <input
                          type="text"
                          placeholder="Ej: 1052100122..."
                          value={inputCodigoScan}
                          onChange={(e) => setInputCodigoScan(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleProcesarValidacion();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          className="btn btn-primary"
                          onClick={handleProcesarValidacion}
                        >
                          <Check className="w-4 h-4" /> Registrar
                        </button>
                      </div>
                      <small className="helper-text">
                        💡 Puedes disparar con pistola lectora de código de
                        barras USB/Bluetooth o teclear y pulsar ENTER.
                      </small>
                    </div>

                    {/* Result Feedback Card */}
                    <div className={`scan-result-card ${scanResult.type}`}>
                      <div className="scan-result-icon">
                        {scanResult.type === "success" && (
                          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        )}
                        {scanResult.type === "duplicate" && (
                          <AlertTriangle className="w-8 h-8 text-amber-400" />
                        )}
                        {scanResult.type === "error" && (
                          <XCircle className="w-8 h-8 text-red-400" />
                        )}
                        {scanResult.type === "neutral" && (
                          <Scan className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <div className="scan-result-content">
                        <h4>{scanResult.title}</h4>
                        <p>{scanResult.subtitle}</p>
                        {scanResult.badges.length > 0 && (
                          <div className="scan-badges">
                            {scanResult.badges.map((b, i) => (
                              <span key={i} className="scan-badge">
                                {b}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Register Fold if Unknown Student */}
                    {showQuickRegister && (
                      <div className="quick-register-fold">
                        <div className="fold-header">
                          <PlusCircle className="w-4 h-4" /> Estudiante no
                          registrado. ¿Deseas agregarlo?
                        </div>
                        <form
                          onSubmit={handleGuardarRegistroRapido}
                          className="form-grid"
                        >
                          <div className="form-group">
                            <label>Nombres</label>
                            <input
                              type="text"
                              required
                              value={qrNombres}
                              onChange={(e) => setQrNombres(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label>Apellidos</label>
                            <input
                              type="text"
                              required
                              value={qrApellidos}
                              onChange={(e) => setQrApellidos(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label>Carrera</label>
                            <input
                              type="text"
                              placeholder="Ej: Ing. Sistemas"
                              required
                              value={qrCarrera}
                              onChange={(e) => setQrCarrera(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label>Lugar / Paradero</label>
                            <input
                              type="text"
                              placeholder="Ej: Chepén"
                              value={qrLugar}
                              onChange={(e) => setQrLugar(e.target.value)}
                            />
                          </div>
                          <div className="form-full">
                            <button
                              type="submit"
                              className="btn btn-success btn-block"
                            >
                              <Check className="w-4 h-4" /> Guardar y Abordar
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================= TAB 3: LISTA DE PASAJEROS ================= */}
          {activeTab === "tab-pasajeros" && (
            <section className="tab-pane active">
              <div className="card glass">
                <div className="card-header">
                  <div className="icon-title">
                    <Users className="w-5 h-5 text-sky-400" />
                    <h3>Pasajeros a Bordo (Viaje en Curso)</h3>
                  </div>
                  <div className="table-search">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar por nombre, código o carrera..."
                      value={searchPasajeros}
                      onChange={(e) => setSearchPasajeros(e.target.value)}
                    />
                  </div>
                </div>
                <div className="card-body no-padding">
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Hora Abordaje</th>
                          <th>Código</th>
                          <th>Estudiante</th>
                          <th>Carrera</th>
                          <th>Estado</th>
                          {currentRole !== "estudiante" && <th>Acción</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {!activeViaje ? (
                          <tr>
                            <td
                              colSpan={currentRole !== "estudiante" ? 7 : 6}
                              className="empty-state"
                            >
                              No hay viaje activo en curso
                            </td>
                          </tr>
                        ) : filteredPasajeros.length === 0 ? (
                          <tr>
                            <td
                              colSpan={currentRole !== "estudiante" ? 7 : 6}
                              className="empty-state"
                            >
                              No hay pasajeros a bordo registrados aún
                            </td>
                          </tr>
                        ) : (
                          filteredPasajeros.map((p, idx) => (
                            <tr key={p.id}>
                              <td>
                                <strong>{idx + 1}</strong>
                              </td>
                              <td className="font-mono text-slate-300">
                                {p.horaAbordaje}
                              </td>
                              <td className="font-mono font-bold text-sky-400">
                                {p.codigo}
                              </td>
                              <td>
                                <strong>
                                  {p.apellidos}, {p.nombres}
                                </strong>
                              </td>
                              <td className="text-slate-300">{p.carrera}</td>
                              <td>
                                <span className="status-tag active">
                                  {p.estado}
                                </span>
                              </td>
                              {currentRole !== "estudiante" && (
                                <td>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleEliminarPasajero(p.id)}
                                    title="Anular abordaje"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================= TAB 4: ESTUDIANTES (BD) ================= */}
          {activeTab === "tab-estudiantes" && (
            <section className="tab-pane active">
              <div className="grid-2col-reverse">
                {/* Table of Registered Students */}
                <div className="card glass">
                  <div className="card-header">
                    <div className="icon-title">
                      <GraduationCap className="w-5 h-5 text-sky-400" />
                      <h3>Padrón de Estudiantes Registrados</h3>
                    </div>
                    <div className="table-search">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar estudiante..."
                        value={searchEstudiantes}
                        onChange={(e) => setSearchEstudiantes(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="card-body no-padding">
                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Nombres y Apellidos</th>
                            <th>Carrera</th>
                            <th>Lugar</th>
                            <th>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEstudiantes.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="empty-state">
                                No se encontraron estudiantes
                              </td>
                            </tr>
                          ) : (
                            filteredEstudiantes.map((s) => (
                              <tr key={s.id}>
                                <td className="font-mono font-bold text-sky-400">
                                  {s.codigo}
                                </td>
                                <td>
                                  <strong>
                                    {s.apellidos}, {s.nombres}
                                  </strong>
                                </td>
                                <td className="text-slate-300">{s.carrera}</td>
                                <td className="text-slate-400">
                                  {s.lugar || "—"}
                                </td>
                                <td>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      className="btn btn-sm btn-secondary"
                                      onClick={() => handleEditarEstudiante(s)}
                                      title="Modificar"
                                    >
                                      <Pencil className="w-3 h-3 text-sky-400" />
                                    </button>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() =>
                                        handleEliminarEstudiante(s.id)
                                      }
                                      title="Eliminar del padrón"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Form Agregar / Editar Estudiante */}
                <div className="card glass">
                  <div className="card-header">
                    <div className="icon-title">
                      <PlusCircle className="w-5 h-5 text-sky-400" />
                      <h3>
                        {editingStudentId
                          ? "Modificar Estudiante"
                          : "Agregar Estudiante"}
                      </h3>
                    </div>
                  </div>
                  <div className="card-body">
                    <form
                      onSubmit={handleGuardarEstudiante}
                      className="form-grid"
                    >
                      <div className="form-group">
                        <label>Código Universitario *</label>
                        <input
                          type="text"
                          placeholder="Ej: 1052100122"
                          value={estCodigo}
                          onChange={(e) => setEstCodigo(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Carrera / Escuela *</label>
                        <input
                          type="text"
                          placeholder="Ej: Ingeniería de Sistemas"
                          value={estCarrera}
                          onChange={(e) => setEstCarrera(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Nombres *</label>
                        <input
                          type="text"
                          placeholder="Ej: Jhon Robinson"
                          value={estNombres}
                          onChange={(e) => setEstNombres(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Apellidos *</label>
                        <input
                          type="text"
                          placeholder="Ej: Llique Chávarry"
                          value={estApellidos}
                          onChange={(e) => setEstApellidos(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-full form-group">
                        <label>Lugar / Paradero Habitual</label>
                        <input
                          type="text"
                          placeholder="Ej: Pacasmayo"
                          value={estLugar}
                          onChange={(e) => setEstLugar(e.target.value)}
                        />
                      </div>
                      <div className="form-full flex-actions">
                        <button type="submit" className="btn btn-primary">
                          <Check className="w-4 h-4" />{" "}
                          {editingStudentId
                            ? "Actualizar"
                            : "Guardar Estudiante"}
                        </button>
                        {editingStudentId && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleCancelarEdicion}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================= TAB 5: HISTORIAL DE VIAJES ================= */}
          {activeTab === "tab-historial" && (
            <section className="tab-pane active">
              <div className="card glass">
                <div className="card-header">
                  <div className="icon-title">
                    <History className="w-5 h-5 text-sky-400" />
                    <h3>Historial de Recorridos y Viajes Realizados</h3>
                  </div>
                  <div className="table-search">
                    <input
                      type="date"
                      value={filterFechaHistorial}
                      onChange={(e) => setFilterFechaHistorial(e.target.value)}
                    />
                  </div>
                </div>
                <div className="card-body no-padding">
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Fecha</th>
                          <th>Ruta</th>
                          <th>Turno</th>
                          <th>Chofer / Placa</th>
                          <th>Salida / Llegada</th>
                          <th>Pasajeros</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredViajes.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="empty-state">
                              No se registraron viajes en esta fecha
                            </td>
                          </tr>
                        ) : (
                          filteredViajes.map((v) => {
                            const count = pasajeros.filter(
                              (p) => p.viajeId === v.id
                            ).length;
                            return (
                              <tr key={v.id}>
                                <td className="font-mono text-slate-400">
                                  #{v.id.toString().slice(-4)}
                                </td>
                                <td>{v.fecha}</td>
                                <td>
                                  <strong>{v.ruta}</strong>
                                </td>
                                <td>{v.turno}</td>
                                <td>
                                  {v.chofer}{" "}
                                  {v.placa && (
                                    <span className="text-slate-400">
                                      ({v.placa})
                                    </span>
                                  )}
                                </td>
                                <td className="font-mono text-xs">
                                  {v.horaSalida || "—"} /{" "}
                                  {v.horaLlegada || "En curso"}
                                </td>
                                <td>
                                  <span className="badge">
                                    {count} / {v.totalAsientos}
                                  </span>
                                </td>
                                <td>
                                  <span
                                    className={`status-tag ${
                                      v.cerrado ? "closed" : "active"
                                    }`}
                                  >
                                    {v.cerrado ? "Cerrado" : "En Curso"}
                                  </span>
                                </td>
                                <td>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      className="btn btn-sm btn-secondary"
                                      onClick={() => setSelectedViajeDetail(v)}
                                      title="Ver Detalle"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Ver
                                    </button>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => handleEliminarViaje(v.id)}
                                      title="Eliminar Viaje"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ================= MODAL: DETALLES DEL VIAJE ================= */}
      {selectedViajeDetail && (
        <div className="modal-overlay open">
          <div className="modal-card">
            <div className="modal-header">
              <h3>
                {selectedViajeDetail.ruta} &mdash; {selectedViajeDetail.fecha}
              </h3>
              <button
                className="btn-close"
                onClick={() => setSelectedViajeDetail(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <div className="trip-stat-grid">
                <div className="stat-box">
                  <span className="label">Chofer</span>
                  <strong className="value">
                    {selectedViajeDetail.chofer}
                  </strong>
                </div>
                <div className="stat-box">
                  <span className="label">Placa</span>
                  <strong className="value">
                    {selectedViajeDetail.placa || "—"}
                  </strong>
                </div>
                <div className="stat-box">
                  <span className="label">Turno</span>
                  <strong className="value">{selectedViajeDetail.turno}</strong>
                </div>
                <div className="stat-box">
                  <span className="label">Salida</span>
                  <strong className="value">
                    {selectedViajeDetail.horaSalida || "—"}
                  </strong>
                </div>
                <div className="stat-box">
                  <span className="label">Llegada</span>
                  <strong className="value">
                    {selectedViajeDetail.horaLlegada || "En curso"}
                  </strong>
                </div>
                <div className="stat-box">
                  <span className="label">Pasajeros</span>
                  <strong className="value highlight">
                    {
                      pasajeros.filter(
                        (p) => p.viajeId === selectedViajeDetail.id
                      ).length
                    }{" "}
                    / {selectedViajeDetail.totalAsientos}
                  </strong>
                </div>
              </div>

              <h4 className="text-sm font-bold text-slate-200 mt-4 mb-2">
                Estudiantes a bordo:
              </h4>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Hora</th>
                      <th>Código</th>
                      <th>Nombre Completo</th>
                      <th>Carrera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pasajeros
                      .filter((p) => p.viajeId === selectedViajeDetail.id)
                      .map((p, idx) => (
                        <tr key={p.id}>
                          <td>{idx + 1}</td>
                          <td className="font-mono">{p.horaAbordaje}</td>
                          <td className="font-mono font-bold text-sky-400">
                            {p.codigo}
                          </td>
                          <td>
                            {p.apellidos}, {p.nombres}
                          </td>
                          <td className="text-slate-400">{p.carrera}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex gap-2.5 justify-end">
                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    exportarPDFViaje(
                      selectedViajeDetail,
                      pasajeros.filter(
                        (p) => p.viajeId === selectedViajeDetail.id
                      )
                    )
                  }
                >
                  <FileText className="w-4 h-4 text-red-400" /> Descargar PDF
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    exportarExcelViaje(
                      selectedViajeDetail,
                      pasajeros.filter(
                        (p) => p.viajeId === selectedViajeDetail.id
                      )
                    )
                  }
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />{" "}
                  Descargar Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SELECCIONAR ROL ================= */}
      {isRoleModalOpen && (
        <div className="modal-overlay open">
          <div className="modal-card modal-roles-card">
            <div className="modal-header">
              <div className="icon-title">
                <Users className="w-5 h-5 text-sky-400" />
                <h3>Seleccionar Rol de Acceso</h3>
              </div>
              <button
                className="btn-close"
                onClick={() => setIsRoleModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="modal-body">
              <p
                style={{
                  color: "var(--text-secondary)",
                  marginBottom: "20px",
                  fontSize: "0.9rem",
                }}
              >
                Elige con qué perfil deseas ingresar al sistema para ver sus
                funciones y restricciones correspondientes:
              </p>

              <div className="roles-selection-grid">
                {/* Rol 1: Admin */}
                <div
                  className="role-card-opt"
                  onClick={() => {
                    setCurrentRole("admin");
                    localStorage.setItem("unicontrol_user_role", "admin");
                    setIsRoleModalOpen(false);
                  }}
                >
                  <div className="role-icon admin">
                    <ShieldCheck className="w-7 h-7 text-sky-400" />
                  </div>
                  <div className="role-info">
                    <h4>Administrador / Supervisor</h4>
                    <p>
                      Acceso total: gestión de viajes, padrón de estudiantes,
                      reportes Excel/PDF, auditoría e historial.
                    </p>
                    <span className="role-badge-tag tag-admin">
                      Acceso Completo
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                </div>

                {/* Rol 2: Operador / Chofer */}
                <div
                  className="role-card-opt"
                  onClick={() => {
                    setCurrentRole("operador");
                    localStorage.setItem("unicontrol_user_role", "operador");
                    setActiveTab("tab-viaje");
                    setIsRoleModalOpen(false);
                  }}
                >
                  <div className="role-icon operador">
                    <Bus className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div className="role-info">
                    <h4>Operador / Conductor</h4>
                    <p>
                      Control en ruta: iniciar viajes, escanear carnets
                      universitarios, registrar abordajes y aforo de 48 asientos.
                    </p>
                    <span className="role-badge-tag tag-operador">
                      Operaciones en Ruta
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                </div>

                {/* Rol 3: Estudiante */}
                <div
                  className="role-card-opt"
                  onClick={() => {
                    setCurrentRole("estudiante");
                    localStorage.setItem("unicontrol_user_role", "estudiante");
                    setActiveTab("tab-viaje");
                    setIsRoleModalOpen(false);
                  }}
                >
                  <div className="role-icon estudiante">
                    <GraduationCap className="w-7 h-7 text-amber-400" />
                  </div>
                  <div className="role-info">
                    <h4>Estudiante Universitario</h4>
                    <p>
                      Consulta de viajes en tiempo real: ver recorridos activos,
                      estado del bus, ruta, conductor y disponibilidad de
                      asientos.
                    </p>
                    <span className="role-badge-tag tag-estudiante">
                      Modo Consulta
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

