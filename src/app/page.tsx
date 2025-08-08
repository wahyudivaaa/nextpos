import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect ke halaman dashboard sebagai halaman utama
  redirect('/dashboard')
}