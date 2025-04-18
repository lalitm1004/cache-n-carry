// src/routes/api/staff/[id]/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ params }) => {
    try {
        const { id } = params;

        const staff = await prisma.staff.findUnique({
            where: { id },
            include: {
                user: true,
                session: true,
            }
        });

        if (!staff) {
            return json({ error: 'not found' }, { status: 404 });
        }

        return json(staff);
    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 })
    }
}
