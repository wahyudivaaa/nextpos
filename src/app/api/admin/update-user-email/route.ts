import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Admin API untuk update email
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { userId, newEmail } = await request.json()

    if (!userId || !newEmail) {
      return NextResponse.json(
        { error: 'userId dan newEmail diperlukan' },
        { status: 400 }
      )
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    // Update email menggunakan Admin API
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true
    })

    if (authError) {
      console.error('Admin API error:', authError)
      return NextResponse.json(
        { error: `Gagal update email di auth: ${authError.message}` },
        { status: 500 }
      )
    }

    // Update email di profiles table juga
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        email: newEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Tidak return error karena auth sudah berhasil
    }

    return NextResponse.json({
      success: true,
      message: 'Email berhasil diupdate'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}