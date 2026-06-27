// app/api/playlists/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaylistBySlug, updatePlaylist, deletePlaylist } from '@/services/playlists';
import { getUserIdFromRequest } from '@/lib/auth-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const userId = await getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const playlist = await fetchPlaylistBySlug(slug, language, userId ?? undefined);
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found or access denied' }, { status: 404 });
    }
    
    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const playlistData = await request.json();
    
    const updatedPlaylist = await updatePlaylist(userId, slug, playlistData);
    
    if (!updatedPlaylist) {
      return NextResponse.json({ error: 'Playlist not found or update failed' }, { status: 404 });
    }
    
    return NextResponse.json({ playlist: updatedPlaylist });
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const success = await deletePlaylist(userId, slug);
    
    if (!success) {
      return NextResponse.json({ error: 'Playlist not found or deletion failed' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}