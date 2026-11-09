import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface ServerStore {
  activeViajeId: number | null;
  viajes: any[];
  pasajeros: any[];
  estudiantes: any[];
  lastUpdated: number;
}

const SEED_ESTUDIANTES = [
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
  {
    id: 5,
    codigo: "1052100455",
    nombres: "Diana Carolina",
    apellidos: "Vásquez Paredes",
    carrera: "Trabajo Social",
    lugar: "Pacasmayo",
  },
  {
    id: 6,
    codigo: "1052200612",
    nombres: "Luis Fernando",
    apellidos: "Quiroz Benites",
    carrera: "Ingeniería Mecánica",
    lugar: "Guadalupe",
  },
  {
    id: 7,
    codigo: "1052300789",
    nombres: "Jorge Anthony",
    apellidos: "Saldaña Cruz",
    carrera: "Ingeniería Agroindustrial",
    lugar: "Chepén",
  },
];

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "system_store.json");

function loadStore(): ServerStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return {
            activeViajeId: parsed.activeViajeId ?? null,
            viajes: Array.isArray(parsed.viajes) ? parsed.viajes : [],
            pasajeros: Array.isArray(parsed.pasajeros) ? parsed.pasajeros : [],
            estudiantes: Array.isArray(parsed.estudiantes) && parsed.estudiantes.length > 0
              ? parsed.estudiantes
              : SEED_ESTUDIANTES,
            lastUpdated: parsed.lastUpdated || Date.now(),
          };
        }
      }
    }
  } catch (err) {
    console.error("Error reading store from disk:", err);
  }

  // Fallback initial store
  const defaultStore: ServerStore = {
    activeViajeId: null,
    viajes: [],
    pasajeros: [],
    estudiantes: SEED_ESTUDIANTES,
    lastUpdated: Date.now(),
  };

  saveStore(defaultStore);
  return defaultStore;
}

function saveStore(store: ServerStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Error persisting store to disk:", err);
  }
}

const noCacheHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

// GET /api/sync -> Always reads freshest state from disk
export async function GET() {
  const store = loadStore();
  return NextResponse.json(
    {
      success: true,
      ...store,
    },
    { headers: noCacheHeaders }
  );
}

// POST /api/sync -> Mutates state and updates disk immediately
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const store = loadStore();

    store.lastUpdated = Date.now();

    switch (action) {
      case "START_TRIP": {
        // payload: UniViaje
        const trip = payload;
        store.viajes = [trip, ...store.viajes.filter((v: any) => v.id !== trip.id)];
        store.activeViajeId = trip.id;
        break;
      }

      case "CLOSE_TRIP": {
        // payload: { viajeId: number }
        const { viajeId } = payload;
        store.viajes = store.viajes.map((v: any) =>
          v.id === viajeId ? { ...v, cerrado: true } : v
        );
        if (store.activeViajeId === viajeId) {
          store.activeViajeId = null;
        }
        break;
      }

      case "UPDATE_DEPARTURE": {
        // payload: { viajeId: number, horaSalida: string }
        const { viajeId, horaSalida } = payload;
        store.viajes = store.viajes.map((v: any) =>
          v.id === viajeId ? { ...v, horaSalida } : v
        );
        break;
      }

      case "BOARD_PASSENGER": {
        // payload: { pasajero: UniPasajero, estudiante?: UniEstudiante }
        const { pasajero, estudiante } = payload;
        store.pasajeros = [pasajero, ...store.pasajeros.filter((p: any) => p.id !== pasajero.id)];

        if (estudiante) {
          const exists = store.estudiantes.some(
            (e: any) => e.codigo.toLowerCase() === estudiante.codigo.toLowerCase()
          );
          if (!exists) {
            store.estudiantes = [...store.estudiantes, estudiante];
          }
        }
        break;
      }

      case "CANCEL_PASSENGER": {
        // payload: { pasajeroId: number }
        const { pasajeroId } = payload;
        store.pasajeros = store.pasajeros.filter((p: any) => p.id !== pasajeroId);
        break;
      }

      case "REGISTER_STUDENT": {
        // payload: { estudiante: any }
        const { estudiante } = payload;
        if (estudiante && estudiante.codigo) {
          const exists = store.estudiantes.some(
            (e: any) => e.codigo.toLowerCase() === estudiante.codigo.toLowerCase()
          );
          if (!exists) {
            store.estudiantes = [estudiante, ...store.estudiantes];
          }
        }
        break;
      }

      case "SYNC_ALL": {
        // payload: Partial<ServerStore>
        if (payload.viajes !== undefined) store.viajes = payload.viajes;
        if (payload.activeViajeId !== undefined) store.activeViajeId = payload.activeViajeId;
        if (payload.pasajeros !== undefined) store.pasajeros = payload.pasajeros;
        if (payload.estudiantes !== undefined) store.estudiantes = payload.estudiantes;
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Acción no reconocida: ${action}` },
          { status: 400, headers: noCacheHeaders }
        );
    }

    saveStore(store);

    return NextResponse.json(
      {
        success: true,
        ...store,
      },
      { headers: noCacheHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: noCacheHeaders }
    );
  }
}
