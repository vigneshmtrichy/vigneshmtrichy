import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: process.env.SHIPROCKET_API_EMAIL,
          password: process.env.SHIPROCKET_API_PASSWORD,
        }),
      },
    )

    const data = await response.json()

    if (!response.ok || !data?.token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Shiprocket authentication failed',
          details: data,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Shiprocket API connection successful',
    })
  } catch (error) {
    console.error('Shiprocket API error:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to Shiprocket',
      },
      { status: 500 },
    )
  }
}