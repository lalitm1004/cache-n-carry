// src/routes/api/incident/create/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IncidentCreateBody {
    foundBy: string;
    belongsTo: string;
    mattressId: string;
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { foundBy, belongsTo, mattressId }: IncidentCreateBody = await request.json();

        const incident = await prisma.incident.create({
            data: {
                foundBy,
                belongsTo,
                mattressId,
                resolved: false,
            }
        });

        return json({ incident }, { status: 201 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
