import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

type GeneratedLayer = {
  kind: 'text' | 'rect' | 'circle' | 'line'
  name: string
  x: number
  y: number
  w: number
  h: number
  fill: string
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  align?: 'start' | 'middle' | 'end'
  opacity?: number
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    if (!token) return NextResponse.json({ error: 'Please sign in again to use AI design.' }, { status: 401 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Authentication is not configured on this deployment.' }, { status: 503 })
    }
    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || user?.email !== 'info@tenoo.in') {
      return NextResponse.json({ error: 'AI design is available only to the authorized Tenoo admin.' }, { status: 403 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI design is not connected yet. Add OPENAI_API_KEY to the Vercel environment for this deployment (Preview or Production), then redeploy. The template generator still works.' }, { status: 503 })
    }

    const brief = await request.json()
    const width = Math.min(1000, Math.max(30, Number(brief.width) || 130))
    const height = Math.min(1500, Math.max(30, Number(brief.height) || 210))
    const userFacts = {
      productName: String(brief.productName || '').slice(0, 160),
      brand: String(brief.brand || 'Tenoo').slice(0, 80),
      category: String(brief.category || '').slice(0, 100),
      descriptor: String(brief.descriptor || '').slice(0, 200),
      packageFormat: String(brief.pack || 'pouch').slice(0, 60),
      widthMm: width,
      heightMm: height,
      visualStyle: String(brief.style || 'premium natural').slice(0, 80),
      palette: String(brief.palette || 'green').slice(0, 50),
      netWeight: String(brief.weight || '').slice(0, 60),
      mrp: String(brief.mrp || '').slice(0, 40),
      ingredients: String(brief.ingredients || '').slice(0, 1800),
      nutritionFacts: String(brief.nutrition || '').slice(0, 1800),
    }

    const systemPrompt = `You are an expert packaging layout designer. Return ONLY valid JSON: {"layers":[...]} for an editable flat 2D vector label layout in millimetres. Create an attractive, print-conscious composition with a background rectangle, brand header/accent shapes, strong readable product title, descriptor, category, net-weight line, and include MRP/ingredients/nutrition text only when the user provided those facts. Do not invent ingredients, nutrition, health claims, certifications, FSSAI numbers, barcodes, origin claims, or prices. The allowed layer fields are kind (text|rect|circle|line), name, x,y,w,h,fill,text,fontSize,fontFamily,fontWeight,align,opacity. Use only simple hex fill colors. Keep all positions within widthMm/heightMm, with a 4mm safe margin where possible. Text layers should fit their assigned boxes; use short display text and avoid dense ingredient/nutrition blocks in the front panel. Return 8-16 layers. All coordinates and font sizes are millimetres. For text use fontSize in mm, fontFamily Georgia or Arial, fontWeight 400 or 700, align start/middle/end. The result is a design draft, not legal compliance advice.`

    const aiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_PACKAGING_MODEL || 'gpt-4.1-mini',
        temperature: 0.7,
        text: { format: { type: 'json_object' } },
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
          { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(userFacts) }] },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    })
    if (!aiResponse.ok) {
      const detail = await aiResponse.text().catch(() => '')
      let providerMessage = ''
      let providerCode = ''
      try {
        const parsedError = JSON.parse(detail)
        providerMessage = String(parsedError?.error?.message || '')
        providerCode = String(parsedError?.error?.code || parsedError?.error?.type || '')
      } catch {}
      // Keep provider diagnostics in server logs only. Never return secrets to the browser.
      console.error('Packaging AI provider error', {
        status: aiResponse.status,
        code: providerCode.slice(0, 100),
        message: providerMessage.slice(0, 400),
      })
      let message = 'The AI provider could not generate a design. Please retry in a moment.'
      if (aiResponse.status === 401) message = 'The OpenAI API key was rejected. Check the OPENAI_API_KEY value in Vercel and redeploy.'
      else if (aiResponse.status === 403) message = 'The OpenAI API project does not have permission to use this model. Check API project permissions.'
      else if (aiResponse.status === 404) message = 'The configured AI model was not found. Check OPENAI_PACKAGING_MODEL or use gpt-4.1-mini.'
      else if (aiResponse.status === 429 && /quota|billing|credit/i.test(providerMessage + ' ' + providerCode)) message = 'OpenAI API quota or billing limit reached. Check API billing and usage limits.'
      else if (aiResponse.status === 429) message = 'The AI service is receiving too many requests. Wait a moment and retry.'
      else if (aiResponse.status >= 500) message = 'The AI provider is temporarily unavailable. Please retry shortly.'
      else if (providerMessage) message = 'OpenAI API error: ' + providerMessage.slice(0, 220)
      return NextResponse.json({ error: message }, { status: 502 })
    }

    const payload = await aiResponse.json()
    const raw = typeof payload.output_text === 'string'
      ? payload.output_text
      : payload.output?.flatMap((item: any) => item.content || [])
          .find((item: any) => item.type === 'output_text')?.text
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : null
    if (!parsed || !Array.isArray(parsed.layers)) throw new Error('AI response did not contain layers')
    const palette = new Set(['#ffffff','#000000','#263f35','#a8bd75','#f5f0df','#6d4936','#c5a477','#f3e7d2','#742e48','#d99eae','#fff0f1','#24486a','#83b5c5','#edf6f7','#263238','#66736f','#8fbd24','#f8f6ee'])
    const layers: GeneratedLayer[] = parsed.layers.slice(0, 18).filter((layer: any) =>
      layer && ['text','rect','circle','line'].includes(layer.kind) &&
      Number.isFinite(Number(layer.x)) && Number.isFinite(Number(layer.y)) &&
      Number.isFinite(Number(layer.w)) && Number.isFinite(Number(layer.h))
    ).map((layer: any) => ({
      kind: layer.kind,
      name: String(layer.name || layer.kind).slice(0, 80),
      x: Math.max(0, Math.min(width, Number(layer.x))),
      y: Math.max(0, Math.min(height, Number(layer.y))),
      w: Math.max(0.5, Math.min(width, Number(layer.w))),
      h: Math.max(0, Math.min(height, Number(layer.h))),
      fill: typeof layer.fill === 'string' && /^#[0-9a-fA-F]{6}$/.test(layer.fill) ? layer.fill : '#263f35',
      ...(layer.kind === 'text' ? {
        text: String(layer.text || '').slice(0, 220),
        fontSize: Math.max(1, Math.min(18, Number(layer.fontSize) || 4)),
        fontFamily: layer.fontFamily === 'Georgia' ? 'Georgia' : 'Arial',
        fontWeight: layer.fontWeight === '700' ? '700' : '400',
        align: ['start','middle','end'].includes(layer.align) ? layer.align : 'start',
      } : {}),
      opacity: Math.max(0.2, Math.min(1, Number(layer.opacity) || 1)),
    }))
    if (layers.length < 4) throw new Error('AI generated too few usable layers')
    return NextResponse.json({ layers, width, height, name: userFacts.productName || 'AI packaging draft' })
  } catch (error) {
    console.error('Packaging AI generation failed', error)
    return NextResponse.json({ error: 'Could not create the AI layout. Please retry or use the template generator.' }, { status: 500 })
  }
}
