import { createClient } from '@supabase/supabase-js'

// 👇 这里填你刚才复制的 Project URL (https://...supabase.co)
const supabaseUrl = 'https://cmdtxjwhxegytsrkbnwa.supabase.co'

// 👇 这里填你刚才复制的 anon key (eyJ...)
const supabaseKey = 'sb_publishable_vnk6Lfh5noTL_A6j96o4MA_Axh_o-4a'

export const supabase = createClient(supabaseUrl, supabaseKey)