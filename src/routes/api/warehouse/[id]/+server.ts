// src/routes/api/warehouse/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        const warehouse = await prisma.warehouse.findUnique({
            where: { id },
            include: {
                belongings: {
                    include: {
                        student: true,
                        luggage: true,
                        mattress: {
                            include: {
                                incident: {
                                    include: {
                                        foundByStudent: true,
                                        belongsToStudent: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!warehouse) {
            return json({ error: 'warehouse not found' }, { status: 404 });
        }

        return json(warehouse);
    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
