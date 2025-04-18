// src/routes/api/session/update/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SessionUpdateBody {
    id: string;
    closeTime: Date;
    resolved: boolean;
}

export const PUT: RequestHandler = async ({ request }) => {
    try {
        const { id, closeTime, resolved }: SessionUpdateBody = await request.json();

        const closeDate = new Date(closeTime);

        const session = await prisma.session.findUnique({
            where: { id },
        });

        if (!session) {
            return json({ error: 'not found' }, { status: 404 });
        }

        const updatedSession = await prisma.session.update({
            where: { id },
            data: {
                closeTime: closeDate,
                resolved
            }
        });

        return json({
            updatedSession
        }, { status: 200 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
