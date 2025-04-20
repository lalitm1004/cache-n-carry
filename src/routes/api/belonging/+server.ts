import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "../student/$types";
import { PrismaClient, Prisma } from "@prisma/client";
import type { Prisma as PrismaType } from "@prisma/client";

type BelongingType = "luggage" | "mattress";

interface BelongingRegistrationBody {
    rollNumber: string;
    type: BelongingType;
    description?: string;
}

const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request }) => {
    let requestData: BelongingRegistrationBody;

    try {
        requestData = (await request.json()) as BelongingRegistrationBody;
    } catch (e) {
        throw error(400, { message: "invalid json payload" });
    }

    const { rollNumber, type, description } = requestData;

    try {
        const newBelonging = await prisma.$transaction(
            async (tx: PrismaType.TransactionClient) => {
                const student = await tx.student.findUnique({
                    where: {
                        rollNumber: rollNumber.trim(),
                    },
                    select: { id: true },
                });

                if (!student) {
                    throw new Prisma.PrismaClientKnownRequestError(
                        `student with roll no. ${rollNumber} not found`,
                        {
                            code: "P2025",
                            clientVersion: Prisma.prismaVersion.client,
                        },
                    );
                }

                const createdBelonging = await tx.belonging.create({
                    data: {
                        description: description?.trim() || null,
                        student: {
                            connect: { id: student.id },
                        },
                        luggage:
                            type === "luggage" ? { create: {} } : undefined,
                        mattress:
                            type === "mattress" ? { create: {} } : undefined,
                    },

                    select: {
                        id: true,
                        description: true,
                        isCheckedIn: true,
                        studentId: true,
                        warehouseId: true,
                        checkedInAt: true,
                        checkedOutAt: true,
                        luggage: true,
                        mattress: true,
                        warehouse: {
                            select: {
                                location: true
                            }
                        }
                    },
                });

                return createdBelonging;
            },
        );

        return json(newBelonging, { status: 201 });
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            if (e.code === "P2025") {
                throw error(400, { message: e.message });
            }

            if (e.code === "P2003") {
                throw error(400, {
                    message: `invalid input: a foreign key constraint failed`,
                });
            }

            if (e.code === "P2002") {
                const target = e.meta?.target;
                let targetDesc = "a unique field";
                if (typeof target === "string") targetDesc = target;
                else if (Array.isArray(target)) targetDesc = target.join(", ");
                throw error(409, {
                    message: `belonging with this value for ${targetDesc} already exists`,
                });
            }
        }

        console.error(
            `api error @ /api/belonging POST: ${e instanceof Error ? e.message : String(e)}`,
            e,
        );

        throw error(500, { message: "internal server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const GET: RequestHandler = async ({ url }) => {
    const rollNumber = url.searchParams.get("rollNumber");

    if (!rollNumber) {
        throw error(400, {
            message: "missing required query param rollNumber",
        });
    }

    try {
        const student = await prisma.student.findUnique({
            where: {
                rollNumber: rollNumber.trim(),
            },
            select: { id: true },
        });

        if (!student) {
            throw error(404, {
                message: `student with roll number ${rollNumber} not found`,
            });
        }

        const belongings = await prisma.belonging.findMany({
            where: {
                studentId: student.id,
            },

            include: {
                luggage: true,
                mattress: true,
                warehouse: {
                    select: {
                        location: true
                    }
                }
            },

            orderBy: {
                checkedInAt: "asc",
            },
        });

        return json(belongings);
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
            console.error(
                `error @ api/belonging GET: Meta: ${JSON.stringify(e.meta)}`,
            );
            throw error(500, {
                message: `database error occurred while fetching belongings`,
            });
        } else if (
            e &&
            typeof e === "object" &&
            "status" in e &&
            e.status === 404
        ) {
            throw e;
        }

        console.error(
            `API Error @ /api/belonging GET: ${e instanceof Error ? e.message : String(e)}`,
            e,
        );

        throw error(500, { message: "internal server error" });
    } finally {
        prisma.$disconnect();
    }
};
