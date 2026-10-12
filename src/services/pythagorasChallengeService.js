import { isSupabaseConfigured, requireSupabase } from '../lib/supabase.js'

function taipeiToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export async function loadPythagorasChallengeAccess({ guestMode = false } = {}, client = null) {
  if (guestMode || (!client && !isSupabaseConfigured)) {
    return { role: 'guest', group: 'B', canChooseGroup: true, displayName: '' }
  }

  const resolvedClient = client || requireSupabase()
  const { data: sessionData, error: sessionError } = await resolvedClient.auth.getSession()
  if (sessionError) throw sessionError
  const userId = sessionData.session?.user?.id
  if (!userId) return { role: 'guest', group: 'B', canChooseGroup: true, displayName: '' }

  const [profileResult, studentResult] = await Promise.all([
    resolvedClient
      .from('contact_book_profiles')
      .select('username,display_name,user_type')
      .eq('id', userId)
      .maybeSingle(),
    resolvedClient
      .from('students')
      .select('id,student_id_code,full_name')
      .eq('profile_id', userId)
      .eq('is_active', true)
      .maybeSingle(),
  ])
  if (profileResult.error) throw profileResult.error
  if (studentResult.error) throw studentResult.error

  const student = studentResult.data
  const profile = profileResult.data
  if (!student) {
    return {
      role: profile?.user_type || 'staff',
      group: 'B',
      canChooseGroup: true,
      displayName: profile?.display_name || profile?.username || '',
    }
  }

  const { data: groupData, error: groupError } = await resolvedClient.rpc('resolve_student_learning_group', {
    p_student_id: student.id,
    p_subject_code: 'math',
    p_reference_date: taipeiToday(),
  })
  if (groupError) throw new Error(`無法確認數學分組：${groupError.message}`)
  return {
    role: 'student',
    group: String(groupData || 'B').toUpperCase() === 'A' ? 'A' : 'B',
    canChooseGroup: false,
    displayName: student.full_name || student.student_id_code || '',
  }
}
