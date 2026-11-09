export type Role = "STUDENT" | "DRIVER" | "ADMIN";

export type TripStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface Student {
  id: string;
  code: string;
  name: string;
  lastName: string;
  career: string;
  phone: string;
  email: string;
  role: Role;
}

export interface Bus {
  id: string;
  plateNumber: string;
  unitNumber: string;
  capacity: number;
  driverName: string;
}

export interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
}

export interface Boarding {
  id: string;
  tripId: string;
  studentCode: string;
  fullName: string;
  career: string;
  phone: string;
  signatureData: string; // Base64
  boardedAt: string | Date;
}

export interface Trip {
  id: string;
  busId: string;
  routeId: string;
  departureTime: string | Date;
  status: TripStatus;
  bus?: Bus;
  route?: Route;
  boardings: Boarding[];
  createdAt: string | Date;
}
