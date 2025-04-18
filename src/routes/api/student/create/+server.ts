// src/routes/api/student/create/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StudentCreateBody {
    name: string;
    email: string;
    currentRoomId: string;
    nextRoomId: string;
}


export const POST: RequestHandler = async ({ request }) => {
    try {
        const { name, email, currentRoomId, nextRoomId }: StudentCreateBody = await request.json();

        const user = await prisma.user.create({
            data: {
                name,
                email,
            }
        });

        const student = await prisma.student.create({
            data: {
                id: user.id,
                currentRoomId,
                nextRoomId
            }
        });

        return json({
            student,
            user
        }, { status: 201 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
