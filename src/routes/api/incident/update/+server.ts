// src/routes/api/incident/update/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface IncidentUpdateBody {
    id: string;
    resolved: boolean;
}

export const PUT: RequestHandler = async ({ request }) => {
    try {
        const { id, resolved }: IncidentUpdateBody = await request.json();

        const incidentExists = await prisma.incident.findUnique({
            where: { id },
        });

        if (!incidentExists) {
            return json({ error: 'not found' }, { status: 404 });
        }

        const updatedIncident = await prisma.incident.update({
            where: { id },
            data: {
                resolved
            }
        });

        return json({
            updatedIncident
        }, { status: 200 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
