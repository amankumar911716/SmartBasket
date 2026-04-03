import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

const GROCERY_PROMPT = `You are a grocery product identification assistant. Analyze this image and identify any grocery items, food products, fruits, vegetables, or household items visible.

Return ONLY a JSON object with this exact structure (no extra text, no markdown):
{
  "identified": true,
  "items": ["item name 1", "item name 2"],
  "keywords": ["search keyword 1", "search keyword 2", "search keyword 3"],
  "description": "Brief description of what's in the image"
}

If the image doesn't contain any grocery, food, or household items, return:
{
  "identified": false,
  "items": [],
  "keywords": [],
  "description": "No grocery items detected in this image"
}`;

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Analyze image with VLM
    const zai = await getZAI();

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: GROCERY_PROMPT },
            {
              type: 'image_url',
              image_url: { url: image },
            },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse VLM response
    let parsed;
    try {
      // Extract JSON from response (handle markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    if (!parsed || !parsed.identified) {
      return NextResponse.json({
        success: false,
        message: parsed?.description || 'No grocery items detected in this image. Try uploading a clearer photo of fruits, vegetables, or packaged food.',
        products: [],
        keywords: [],
      });
    }

    // Build search query from identified items and keywords
    const allTerms = [...(parsed.items || []), ...(parsed.keywords || [])].filter(Boolean);

    // Search products in database matching any of the terms
    const products = await db.product.findMany({
      where: {
        inStock: true,
        OR: allTerms.flatMap((term: string) => [
          { name: { contains: term, mode: 'insensitive' } },
          { brand: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ]),
      },
      include: { category: true },
      take: 20,
    });

    // Also search by category name
    const categoryProducts = await db.product.findMany({
      where: {
        inStock: true,
        category: {
          OR: allTerms.map((term: string) => ({
            name: { contains: term, mode: 'insensitive' },
          })),
        },
      },
      include: { category: true },
      take: 10,
    });

    // Merge and deduplicate
    const seen = new Set<string>();
    const allProducts = [...products, ...categoryProducts].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    return NextResponse.json({
      success: true,
      message: parsed.description,
      items: parsed.items,
      keywords: parsed.keywords,
      products: allProducts,
    });
  } catch (error: unknown) {
    console.error('Image search error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to analyze image. Please try again with a clearer photo.',
        products: [],
        keywords: [],
      },
      { status: 500 }
    );
  }
}
