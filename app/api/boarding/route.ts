import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) {
      return NextResponse.json(
        { error: "tripId query parameter is required" },
        { status: 400 }
      );
    }

    const boardings = await prisma.boarding.findMany({
      where: { tripId },
      orderBy: { boardedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: boardings });
  } catch (error: unknown) {
    console.error("Error retrieving boardings:", error);
    return NextResponse.json(
      { error: "Failed to fetch boardings from database", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, studentCode, fullName, career, phone, signatureData } = body;

    if (!tripId || !studentCode || !fullName || !career || !phone || !signatureData) {
      return NextResponse.json(
        { error: "Missing required boarding fields" },
        { status: 400 }
      );
    }

    const newBoarding = await prisma.boarding.create({
      data: {
        tripId,
        studentCode,
        fullName,
        career,
        phone,
        signatureData,
      },
    });

    return NextResponse.json({ success: true, data: newBoarding }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating boarding record:", error);
    return NextResponse.json(
      { error: "Failed to save boarding in database", details: String(error) },
      { status: 500 }
    );
  }
}
