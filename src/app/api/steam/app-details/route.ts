import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;

    const response = await axios.get(url);
    
    return NextResponse.json(response.data);
  } catch (error: unknown) {
    const errorObj = error as { response?: { data?: unknown }; message?: string };
    console.error('Steam app details error:', errorObj.response?.data || errorObj.message);
    return NextResponse.json({ error: 'Failed to fetch app details' }, { status: 500 });
  }
} 