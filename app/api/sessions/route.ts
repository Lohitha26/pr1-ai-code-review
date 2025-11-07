/**
 * Sessions API Routes
 * 
 * Handles CRUD operations for coding sessions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating a session
const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  language: z.string().default('javascript'),
  isPublic: z.boolean().default(true),
});

/**
 * GET /api/sessions
 * List all sessions (public + user's private sessions)
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Build query based on authentication
    const where = session?.user?.id
      ? {
          OR: [
            { isPublic: true },
            { ownerId: session.user.id },
          ],
        }
      : { isPublic: true };

    const sessions = await prisma.codeSession.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        participants: {
          where: {
            leftAt: null, // Only active participants
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50, // Limit results
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sessions
 * Create a new coding session
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const data = createSessionSchema.parse(body);

    // Create session in database
    const codeSession = await prisma.codeSession.create({
      data: {
        name: data.name,
        description: data.description,
        language: data.language,
        isPublic: data.isPublic,
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ session: codeSession }, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
