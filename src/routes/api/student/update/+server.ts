// src/routes/api/student/update/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StudentUpdateBody {
    id: string;
    currentRoomId: string;
    nextRoomId: string;
}

export const PUT: RequestHandler = async ({ request }) => {
    try {
        const { id, currentRoomId, nextRoomId }: StudentUpdateBody = await request.json();

        const student = await prisma.student.findUnique({
            where: { id }
        });

        if (!student) {
            return json({ error: 'not found' }, { status: 404 });
        }

        const updatedStudent = await prisma.student.update({
            where: { id },
            data: {
                currentRoomId,
                nextRoomId
            }
        });

        return json({
            updatedStudent
        }, { status: 200 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
