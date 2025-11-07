/**
 * Individual Session API Routes
 * 
 * Handles operations for a specific session (get, update, delete).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/sessions/[sessionId]
 * Get details of a specific session
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { sessionId } = params;

    const codeSession = await prisma.codeSession.findUnique({
      where: { id: sessionId },
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
            leftAt: null,
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
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 100, // Last 100 messages
        },
      },
    });

    if (!codeSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (!codeSession.isPublic && codeSession.ownerId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({ session: codeSession });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sessions/[sessionId]
 * Delete a session (owner only)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { sessionId } = params;

    // Check if user is the owner
    const codeSession = await prisma.codeSession.findUnique({
      where: { id: sessionId },
      select: { ownerId: true },
    });

    if (!codeSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (codeSession.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the owner can delete this session' },
        { status: 403 }
      );
    }

    // Delete the session (cascades to participants and messages)
    await prisma.codeSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
