import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UNT_STUDENTS = [
  {
    code: "1020304021",
    name: "Carlos Eduardo",
    lastName: "Mendoza Silva",
    career: "Ingeniería de Sistemas",
    phone: "948123456",
    email: "cmendozas@unitru.edu.pe",
    role: "STUDENT",
  },
  {
    code: "1020304022",
    name: "Ana Lucía",
    lastName: "Ramírez Vega",
    career: "Medicina Humana",
    phone: "951789456",
    email: "aramirezv@unitru.edu.pe",
    role: "STUDENT",
  },
  {
    code: "1020304023",
    name: "Jhonatan David",
    lastName: "Alva Flores",
    career: "Derecho y Ciencias Políticas",
    phone: "944561234",
    email: "jalvaf@unitru.edu.pe",
    role: "STUDENT",
  },
  {
    code: "1020304024",
    name: "Valeria Sofía",
    lastName: "Benites Castillo",
    career: "Ingeniería Industrial",
    phone: "978120345",
    email: "vbenitesc@unitru.edu.pe",
    role: "STUDENT",
  },
  {
    code: "1020304025",
    name: "Piero André",
    lastName: "Chávez Quiroz",
    career: "Ciencias de la Comunicación",
    phone: "963258741",
    email: "pchavezq@unitru.edu.pe",
    role: "STUDENT",
  },
];

async function main() {
  console.log("🌱 Iniciando seed de datos UNT...");

  // 1. Seed Students
  for (const student of UNT_STUDENTS) {
    await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        code: student.code,
        name: student.name,
        lastName: student.lastName,
        career: student.career,
        phone: student.phone,
        email: student.email,
        role: "STUDENT",
      },
    });
  }
  console.log("✅ Estudiantes UNT registrados");

  // 2. Seed Bus
  const bus = await prisma.bus.upsert({
    where: { plateNumber: "EGB-123" },
    update: {},
    create: {
      plateNumber: "EGB-123",
      unitNumber: "Bus UNT #01",
      capacity: 40,
      driverName: "Manuel Morales Cerna",
    },
  });
  console.log("✅ Bus UNT #01 registrado:", bus.unitNumber);

  // 3. Seed Route
  const route = await prisma.route.create({
    data: {
      name: "Ciudad Universitaria -> Local Central -> Huanchaco",
      origin: "Ciudad Universitaria (Av. Juan Pablo II)",
      destination: "Balneario de Huanchaco",
    },
  });
  console.log("✅ Ruta creada:", route.name);

  // 4. Seed Trip
  const trip = await prisma.trip.create({
    data: {
      busId: bus.id,
      routeId: route.id,
      status: "IN_PROGRESS",
    },
  });
  console.log("✅ Viaje inicial en curso creado con ID:", trip.id);

  console.log("🚀 Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
