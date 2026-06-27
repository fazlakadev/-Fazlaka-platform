// app/api/playlists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaylists, createPlaylist } from '@/services/playlists';
import { getUserIdFromRequest } from '@/lib/auth-helper';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const playlists = await fetchPlaylists(language, userId ?? undefined);
    
    return NextResponse.json({ playlists }, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  } catch (error) {
    console.error('Error in playlists API:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playlistData = await request.json();
    
    if (!playlistData.title) {
       return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newPlaylist = await createPlaylist(userId, {
        title: playlistData.title,
        titleEn: playlistData.titleEn || playlistData.title,
        description: playlistData.description,
        descriptionEn: playlistData.descriptionEn,
        imageUrl: playlistData.imageUrl,
        isPublic: playlistData.isPublic ?? false,
        episodes: playlistData.episodes,
        articles: playlistData.articles
    });
    
    if (!newPlaylist) {
      return NextResponse.json({ error: 'Failed to create playlist' }, { status: 400 });
    }
    
    return NextResponse.json({ playlist: newPlaylist }, { status: 201 });
  } catch (error) {
    console.error('Error in playlists API:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}