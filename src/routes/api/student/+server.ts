import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "@sveltejs/kit";
import { PrismaClient, Prisma } from "@prisma/client";
import type {
  PrismaClient as PrismaClientType,
  Prisma as PrismaType,
} from "@prisma/client";
import bcrypt from "bcrypt";

export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface IStudent extends Omit<IUser, "password"> {
  type: "student";
  rollNumber: string;
  currentRoomId: string;
  nextRoomId: string | null;
}

type RegistrationRequestBody = Pick<IUser, "name" | "email" | "password"> &
  Pick<IStudent, "rollNumber"> & {
    hostelName: string;
    roomNumber: string;
  };

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const POST: RequestHandler = async ({ request }) => {
  let requestData;
  try {
    requestData = await request.json();
  } catch (e) {
    throw error(400, { message: "Invalid JSON body" });
  }

  const { name, email, password, rollNumber, hostelName, roomNumber } =
    requestData;
  if (
    !name ||
    !email ||
    !password ||
    !rollNumber ||
    !hostelName ||
    !roomNumber
  ) {
    throw error(400, {
      message:
        "missing required fields. Ensure name, email, password, rollNo, hostelName and roomNumber are provided",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result: IStudent = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const foundHostel = await tx.hostel.findFirst({
          where: { name: hostelName.trim() },
          select: { id: true },
        });

        if (!foundHostel) {
          throw new Prisma.PrismaClientKnownRequestError(
            `Hostel with name '${hostelName} not found.`,
            { code: "P2025", clientVersion: Prisma.prismaVersion.client },
          );
        }

        const foundRoom = await tx.room.findUnique({
          where: {
            hostelId_number: {
              hostelId: foundHostel.id,
              number: roomNumber.trim(),
            },
          },
          select: { id: true },
        });

        if (!foundRoom) {
          throw new Prisma.PrismaClientKnownRequestError(
            `Room with number '${roomNumber}' not found in hostel ${hostelName}`,
            { code: "P2025", clientVersion: Prisma.prismaVersion.client },
          );
        }

        const newUser = await tx.user.create({
          data: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        const newStudent = await tx.student.create({
          data: {
            user: {
              connect: {
                id: newUser.id,
              },
            },
            rollNumber: rollNumber.trim(),
            currentRoom: {
              connect: { id: foundRoom.id },
            },
          },
          select: {
            rollNumber: true,
            currentRoomId: true,
            nextRoomId: true,
          },
        });

        const responseData: IStudent = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          type: "student",
          rollNumber: newStudent.rollNumber,
          currentRoomId: newStudent.currentRoomId,
          nextRoomId: newStudent.nextRoomId,
        };

        return responseData;
      },
    );

    return json(result, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        throw error(400, { message: e.message });
      }
      if (e.code === "P2002") {
        const target = (e.meta?.target as string[])?.join(", ");
        let message = `Confict: Duplicate value for ${target}`;
        if (target?.includes("email"))
          message = "An account with this email address already exists.";
        else if (target?.includes("rollNumber"))
          message = "This roll number is already registered";
        throw error(409, { message });
      }
      if (e.code === "P2003") {
        throw error(400, { message: `a foreign key constraint is failing` });
      }
    }

    console.error(
      `api error @ /api/student POST: ${e instanceof Error ? e.message : String(e)}`,
      e,
    );
    throw error(500, {
      message: "an internal server error occurred during student registration",
    });
  } finally {
    await prisma.$disconnect();
  }
};
