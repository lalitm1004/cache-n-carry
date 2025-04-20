import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "../../belonging/$types";
import { PrismaClient, Prisma } from "@prisma/client";
import type { Prisma as PrismaType } from "@prisma/client";
import { ref } from "process";

interface SessionRequestBody {
    staffEmail: string;
    rollNumber: string;
}

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
    let requestData: SessionRequestBody;

    try {
        requestData = (await request.json()) as SessionRequestBody;
    } catch (e) {
        throw error(400, { message: "invalid json payload" });
    }

    const { staffEmail, rollNumber } = requestData;

    if (!staffEmail || !rollNumber) {
        throw error(400, {
            message:
                "missing required fields, make sure staffEmail and rollNumber are provided",
        });
    }

    try {
        const newSession = await prisma.$transaction(
            async (tx: PrismaType.TransactionClient) => {
                const student = await tx.student.findUnique({
                    where: { rollNumber: rollNumber.trim() },
                    select: { id: true },
                });

                if (!student) {
                    throw new Prisma.PrismClientKnownRequestError(
                        `student with roll number '${rollNumber}' not found`,
                        {
                            code: "P2025",
                            clientVersion: Prisma.prismaVersion.client,
                        },
                    );
                }

                const userWithStaffEmail = await tx.user.findUnique({
                    where: { email: staffEmail.toLowerCase().trim() },
                    select: { id: true },
                });

                if (!userWithStaffEmail) {
                    throw new Prisma.PrismaClientKnownRequestError(
                        `user with email ${staffEmail} not found`,
                        {
                            code: "P2025",
                            clientVersion: Prisma.prismaVersion.client,
                        },
                    );
                }

                const staff = await tx.staff.findUnique({
                    where: { id: userWithStaffEmail.id },
                    select: { id: true },
                });

                if (!staff) {
                    throw new Prisma.PrismaClientKnownRequestError(
                        `user with email ${staffEmail} exists but is not registered as staff`,
                        {
                            code: "P2025",
                            clientVersion: Prisma.prismaVersion.client,
                        },
                    );
                }

                const createdSession = await tx.session.create({
                    data: {
                        staff: {
                            connect: { id: staff.id },
                        },
                        student: {
                            connect: { id: student.id },
                        },
                    },
                });

                return createdSession;
            },
        );

        return json(newSession, { status: 201 });
    } catch (e: any) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2002") {
                const targetFields = e.meta?.target as string[];
                if (
                    targetFields?.includes("staffId") &&
                    targetFields?.includes("studentId")
                ) {
                    throw error(409, {
                        message: `Conflict: An active session already exists between this staff member and student.`,
                    });
                } else {
                    throw error(409, {
                        message: `Conflict: A unique constraint violation occurred.`,
                    });
                }
            }
            if (e.code === "P2025") {
                throw error(404, { message: e.message });
            }
            if (e.code === "P2003") {
                throw error(400, {
                    message: `Invalid Input: A data integrity constraint failed.`,
                });
            }
        }

        console.error(
            `API Error @ /api/session POST: ${e instanceof Error ? e.message : String(e)}`,
            e,
        );

        throw error(500, { message: "internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};
