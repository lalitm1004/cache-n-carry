// src/routes/api/incident/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        const incident = await prisma.incident.findUnique({
            where: { id },
            include: {
                mattressInvolved: true,
                foundByStudent: true,
                belongsToStudent: true
            }
        });

        if (!incident) {
            return json({ error: 'not found' }, { status: 404 });
        }

        return json(incident);
    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
