import { createClient } from '@supabase/supabase-js'

// Ganti dengan URL dan API Key Supabase Anda
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDk0NTkyMDAsImV4cCI6MTkyNTAzNTIwMH0.placeholder'

console.log('🔧 Supabase Config:')
console.log('   URL:', supabaseUrl)
console.log('   Key:', supabaseAnonKey ? '***' + supabaseAnonKey.slice(-20) : 'NOT SET')

// Warning jika belum setup
if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('⚠️ SUPABASE BELUM DIKONFIGURASI! Buat file .env dengan URL dan Key dari Supabase Anda.')
} else {
  console.log('✅ Supabase credentials loaded from .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
