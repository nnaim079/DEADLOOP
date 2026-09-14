import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://srvrgiiwpczlyltsktde.supabase.co';
const supabaseAnonKey = 'sb_publishable_J-7Nx6RhgWdMh26vHPKT3g_pvx001A0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);