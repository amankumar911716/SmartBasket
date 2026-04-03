import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { audio } = await req.json();

    if (!audio || typeof audio !== 'string') {
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Validate base64 format
    if (audio.length < 100) {
      return NextResponse.json(
        { error: 'Audio data too short. Please speak for at least 1 second.' },
        { status: 400 }
      );
    }

    // Use z-ai-web-dev-sdk for server-side ASR
    const ZAI = await import('z-ai-web-dev-sdk');
    const zai = await ZAI.default.create();

    // Strip data URL prefix if present (e.g., "data:audio/webm;base64,")
    const base64Audio = audio.includes(',')
      ? audio.split(',')[1]
      : audio;

    const response = await zai.audio.asr.create({
      file_base64: base64Audio,
    });

    const text = response.text?.trim() || '';

    if (!text) {
      return NextResponse.json(
        { error: 'Could not recognize speech. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      text,
    });
  } catch (error) {
    console.error('Voice search ASR error:', error);
    return NextResponse.json(
      { error: 'Speech recognition failed. Please try again.' },
      { status: 500 }
    );
  }
}
