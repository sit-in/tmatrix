import { createClient } from '@supabase/supabase-js'

// ============= 环境变量验证 =============
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('❌ Missing env: NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('❌ Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// 验证URL格式
try {
  new URL(supabaseUrl)
} catch {
  throw new Error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL format')
}

// ============= 创建Supabase客户端 =============
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 单用户MVP不需要session
  }
})

// ============= 测试连接 =============
export async function testConnection() {
  try {
    const { data, error } = await supabase.from('drafts').select('count')
    if (error) {
      console.error('❌ Supabase connection failed:', error)
      return { success: false, error: error.message }
    }
    console.log('✅ Supabase connected successfully')
    return { success: true, data }
  } catch (error) {
    console.error('❌ Supabase connection error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}