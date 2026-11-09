# 🚌 UNT Bus Boarding & Student Mobility System (PWA)
### Sistema de Control de Abordaje y Movilidad Estudiantil — Universidad Nacional de Trujillo (UNT)

Aplicación Web Progresiva (PWA) diseñada para optimizar el proceso de embarque de estudiantes en las unidades de transporte de la **Universidad Nacional de Trujillo**, permitiendo un registro de abordaje seguro y verificado en **menos de 5 segundos por persona**.

---

## ⚡ Características Principales

1. **Abordaje Ultrarrápido (< 5 segundos):**
   - **Autocompletado en tiempo real:** Al ingresar o escanear el código de matrícula UNT (ej. `1020304021`), se completan inmediatamente los datos del alumno (Apellidos y Nombres, Carrera / Escuela Profesional, Celular de WhatsApp).
   - **Escáner de Carné Universitario:** Lector integrado de código de barras y códigos QR mediante la cámara de tablets o smartphones de los asistentes de abordaje.

2. **Firma Digital Táctil (HTML5 Canvas):**
   - Lienzo responsivo táctil optimizado para dedos o punteros capacitivos.
   - Exportación instantánea a Base64 PNG.
   - Prevención de envíos vacíos y botón de borrado rápido.

3. **Generación de Manifiesto Oficial en PDF (`jspdf` + `jspdf-autotable`):**
   - Encabezado institucional con identidad gráfica UNT (Azul Marino UNT y Dorado).
   - Metadatos de la unidad: Número de Bus (ej. Bus #01), Placa (`EGB-123`), Conductor, Ruta y Fecha/Hora.
   - Padrón detallado con código, nombre, carrera, teléfono de contacto y la **firma digital incrustada en cada celda del PDF**.
   - Espacios formales para firma del conductor y sello de Bienestar Universitario.

4. **Monitoreo de Aforo en Tiempo Real:**
   - Barra de ocupación visual con semáforo inteligente:
     - 🟢 Normal (< 80%)
     - 🟡 Advertencia (80% - 99%)
     - 🔴 Capacidad Máxima (Aforo completo)

5. **PWA (Progressive Web App):**
   - Listo para instalar en dispositivos móviles y tablets de los conductores y asistentes.
   - Diseño Mobile-First con Tailwind CSS y retroalimentación sonora/háptica con Web Audio API.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 14+ (App Router, Server Actions, TypeScript)
- **Estilos:** Tailwind CSS con paleta institucional UNT + Lucide React
- **Base de Datos & ORM:** PostgreSQL con Prisma ORM (Esquema oficial en `prisma/schema.prisma`)
- **Firma Digital:** Canvas API nativo con captura de eventos táctiles (`PointerEvents`)
- **Reportes:** `jspdf` y `jspdf-autotable`
- **Formularios:** React Hook Form + Zod Validation

---

## 🗄️ Esquema de Base de Datos (Prisma)

El modelo de datos implementado en `prisma/schema.prisma` consta de:
- `User`: Estudiantes, conductores y administradores con código UNT único.
- `Bus`: Unidades vehiculares UNT (Placa, número de unidad, capacidad, conductor).
- `Route`: Rutas universitarias (Origen, destino, paraderos).
- `Trip`: Viajes programados y en curso vinculando bus y ruta.
- `Boarding`: Registros individuales de abordaje con `studentCode`, datos personales y firma en formato `Text` (Base64).

---

## 🚀 Puesta en Marcha

### 1. Requisitos
- Node.js 18+ o superior
- Base de datos PostgreSQL (local, Neon, Supabase o Docker)

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a `.env`:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/unt_bus_db?schema=public"
```

### 3. Migrar y Generar Cliente Prisma
```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Sincronizar el esquema con tu base de datos
npm run prisma:push

# Poblar con datos iniciales de prueba de la UNT
npm run seed
```

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador o tablet.

---

## 📋 Códigos UNT de Prueba para Demostración

| Código UNT | Estudiante | Escuela Profesional | Celular |
| :--- | :--- | :--- | :--- |
| `1020304021` | Mendoza Silva, Carlos Eduardo | Ingeniería de Sistemas | 948123456 |
| `1020304022` | Ramírez Vega, Ana Lucía | Administración | 951789456 |
| `1020304023` | Alva Flores, Jhonatan David | Informática | 944561234 |
| `1020304024` | Benites Castillo, Valeria Sofía | Ingeniería Industrial | 978120345 |
| `1020304025` | Chávez Quiroz, Piero André | Ingeniería Mecánica | 963258741 |
| `1020304026` | Paredes Ruiz, María Fernanda | Agronomía | 987654321 |
| `1020304027` | Gutiérrez Sánchez, Luis Alberto | Enfermería | 949112233 |
| `1020304028` | Romero Díaz, Camila Nicole | Contabilidad | 955443322 |
| `1020304029` | Torres Morales, Diego Sebastián | Ingeniería Agroindustrial | 991827364 |
| `1020304030` | Ramos Chávez, Jimena Ross | Trabajo Social | 982345678 |

---

## 🏛️ Universidad Nacional de Trujillo (UNT)
*Oficina General de Bienestar Universitario — Área de Transporte y Movilidad Estudiantil*
