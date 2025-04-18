// src/routes/api/staff/create/+server.ts
import { json, type RequestHandler } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StaffCreateBody {
    name: string;
    email: string;
}

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { name, email }: StaffCreateBody = await request.json();

        const user = await prisma.user.create({
            data: {
                name,
                email,
            }
        });

        const staff = await prisma.staff.create({
            data: {
                id: user.id,
            }
        });

        return json({
            staff,
            user
        }, { status: 201 });

    } catch (error) {
        console.error('error handling request:', error);
        return json({ error: 'failed to process request' }, { status: 500 });
    }
};
