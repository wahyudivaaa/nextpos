import { createClient } from '@supabase/supabase-js'

// Validasi environment variables untuk admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Hanya tampilkan warning di server environment (bukan di browser)
if (typeof window === 'undefined' && (!supabaseUrl || !supabaseServiceKey)) {
  console.warn('Supabase Admin client tidak tersedia: Service Role Key tidak dikonfigurasi')
}

// Admin client dengan service role key untuk operasi admin
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Fungsi helper untuk update user email dengan multiple fallback options
export const updateUserEmail = async (userId: string, newEmail: string) => {
  console.log('Attempting to update email for user:', userId, 'to:', newEmail)
  
  // OPSI 1: Gunakan API route server-side (RECOMMENDED)
  try {
    console.log('Using server-side API route')
    const response = await fetch('/api/admin/update-user-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        newEmail
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      throw new Error(result.error || 'API request failed')
    }
    
    console.log('API route update successful:', result)
    return { error: null, data: result }
    
  } catch (apiError) {
    console.error('API route error:', apiError)
    
    // OPSI 2: Fallback ke RPC function
    console.log('Falling back to RPC function')
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data, error } = await supabase.rpc('update_user_email_admin', {
      target_user_id: userId,
      new_email: newEmail
    })
    
    if (error) {
      console.error('RPC error:', error)
      
      // Berikan error message yang informatif
      if (error.message.includes('function update_user_email_admin')) {
        return { 
          error: { 
            message: 'Kedua metode gagal. Pastikan:\n1. API route berfungsi\n2. RPC function sudah disetup (jalankan setup-update-email-rpc.sql)' 
          } 
        }
      }
      
      return { error }
    } else {
      console.log('RPC update successful:', data)
      return { error: null, data }
    }
  }
}