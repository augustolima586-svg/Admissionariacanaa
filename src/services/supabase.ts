
import { createClient } from '@supabase/supabase-js';

// As chaves devem ser as do seu projeto no Supabase
// Substitua 'URL' e 'KEY' se necessário para as do seu painel real
const SUPABASE_URL = 'https://urnqahdumbnzhonnitsb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pGeNErZnmYMckM7aUTxuRw_5_Auyb8a';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
