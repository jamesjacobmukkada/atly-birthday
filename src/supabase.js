import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wjvqwiibrqqhbrcvuwld.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdnF3aWlicnFxaGJyY3Z1d2xkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NDY3ODEsImV4cCI6MjA5NjQyMjc4MX0.LYv85LOoADXgiijDNw355hZIBWrAlRyMumD1_nsimSo'

export const supabase = createClient(supabaseUrl, supabaseKey)
