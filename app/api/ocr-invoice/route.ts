import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_PAGES = 50

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const file = form.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'No invoice file was provided.' },
        { status: 400 },
      )
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files can use PDF text extraction.' },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Invoice PDF must be 10 MB or smaller.' },
        { status: 413 },
      )
    }

    const buffer = await file.arrayBuffer()
    const pdf = await getDocumentProxy(new Uint8Array(buffer))

    if (pdf.numPages > MAX_PAGES) {
      return NextResponse.json(
        { error: `Invoice PDF must contain ${MAX_PAGES} pages or fewer.` },
        { status: 413 },
      )
    }

    const result = await extractText(pdf, { mergePages: true })
    const text = typeof result.text === 'string' ? result.text.trim() : ''

    return NextResponse.json({
      text,
      totalPages: result.totalPages,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to read the invoice PDF.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
