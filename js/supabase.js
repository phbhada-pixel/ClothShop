// js/supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// तुमच्या Supabase Project मधून URL आणि Key येथे टाका
const SUPABASE_URL = 'https://kwxnitdtvlhxjscfgdas.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DMOylfGMBGwHn8smrC1-3w_yOS-s3gL';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
