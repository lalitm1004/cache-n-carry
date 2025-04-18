// src/routes/api/mattress/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        const mattress = await prisma.mattress.findUnique({
            where: { id },
            include: {
                belonging: {
                    include: {
                        student: true,
                        warehouse: true,
                    }
                },
                incident: {
                    include: {
                        foundByStudent: true,
                        belongsToStudent: true
                    }
                }
            }
        });

        if (!mattress) {
            return json({ error: 'not found' }, { status: 404 });
        }

        return json(mattress);
    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
