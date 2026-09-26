import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email?.trim()) {
      return NextResponse.json({ exists: false })
    }

    const targetEmail = email.trim().toLowerCase()

    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const exists = data.users.some(
      (user) => user.email?.toLowerCase() === targetEmail
    )

    return NextResponse.json({ exists })
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
    )
  }
}