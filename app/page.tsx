'use client'

import { useState, useEffect } from 'react'

const ROUTINES = [
  { id: 'water', label: '따뜻한 물 마시기', emoji: '🫖' },
  { id: 'stretch', label: '손가락 스트레칭 5분', emoji: '🤲' },
  { id: 'walk', label: '아침 산책 20분', emoji: '🚶‍♀️' },
  { id: 'shower', label: '따뜻한 샤워', emoji: '🚿' },
]

const MOODS = [
  { value: 1, emoji: '😔', label: '많이 힘듦' },
  { value: 2, emoji: '😕', label: '힘듦' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '🙂', label: '괜찮음' },
  { value: 5, emoji: '😊', label: '좋음' },
]

const STIFFNESS = [
  { value: 1, label: '심함' },
  { value: 2, label: '있음' },
  { value: 3, label: '조금' },
  { value: 4, label: '거의없음' },
  { value: 5, label: '없음' },
]

const PAIN = [
  { value: 0, label: '없음' },
  { value: 1, label: '약함' },
  { value: 2, label: '보통' },
  { value: 3, label: '강함' },
]

type DayLog = {
  mood?: number
  stiffness?: number
  pain?: number
  routines?: Record<string, boolean>
  water?: number
  note?: string
}

type Logs = Record<string, DayLog>

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getWeekDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

function getMonthDays() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().slice(0, 10)
  })
}

function avg(arr: number[]) {
  if (!arr.length) return null
  return (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
}

export default function Home() {
  const [tab, setTab] = useState<'today' | 'week' | 'month'>('today')
  const [logs, setLogs] = useState<Logs>({})
  const [toast, setToast] = useState(false)
  const today = getTodayKey()
  const todayLog = logs[today] || {}

  useEffect(() => {
    fetch('/api/log')
      .then(r => r.json())
      .then(data => setLogs(data))
      .catch(() => {})
  }, [])

  function updateToday(field: keyof DayLog, value: unknown) {
    setLogs(prev => ({ ...prev, [today]: { ...prev[today], [field]: value } }))
  }

  function toggleRoutine(id: string) {
    const current = todayLog.routines || {}
    updateToday('routines', { ...current, [id]: !current[id] })
  }

  async function save() {
    try {
      await fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today, log: todayLog }),
      })
      setToast(true)
      setTimeout(() => setToast(false), 2000)
    } catch {}
  }

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'long',
  })

  return (
    <div style={{ maxWidth: 430, margin: '0 auto', minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ padding: '32px 24px 16px' }}>
        <h1 style={{ fontFamily: "'Nanum Myeongjo', serif", fontSize: 22 }}>🌿 민주의 건강일지</h1>
        <p style={{ fontSize: 13, color: '#9a8070', marginTop: 4 }}>{dateStr}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '0 24px 16px' }}>
        {(['today', 'week', 'month'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px', border: 'none', borderRadius: 20,
            fontFamily: "'Gowun Dodum', sans-serif", fontSize: 13, cursor: 'pointer',
            background: tab === t ? '#c8956c' : '#f0e8df',
            color: tab === t ? 'white' : '#9a8070',
            transition: 'all 0.2s',
          }}>
            {t === 'today' ? '오늘 기록' : t === 'week' ? '주간' : '한달'}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <>
          <Section title="오늘의 기분 💭">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {MOODS.map(m => (
                <button key={m.value} onClick={() => updateToday('mood', m.value)} style={{
                  flex: 1, border: 'none', cursor: 'pointer', padding: '8px 4px',
                  borderRadius: 12, background: todayLog.mood === m.value ? '#f0e8df' : 'transparent',
                  transition: 'all 0.15s', textAlign: 'center',
                }}>
                  <span style={{ fontSize: 24, display: 'block' }}>{m.emoji}</span>
                  <span style={{ fontSize: 10, color: '#9a8070' }}>{m.label}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="몸 상태 🤝">
            <p style={{ fontSize: 13, marginBottom: 8 }}>아침 강직</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {STIFFNESS.map(s => (
                <ScaleBtn key={s.value} label={s.label} selected={todayLog.stiffness === s.value}
                  onClick={() => updateToday('stiffness', s.value)} />
              ))}
            </div>
            <p style={{ fontSize: 13, marginBottom: 8 }}>통증 정도</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PAIN.map(p => (
                <ScaleBtn key={p.value} label={p.label} selected={todayLog.pain === p.value}
                  onClick={() => updateToday('pain', p.value)} />
              ))}
            </div>
          </Section>

          <Section title="오늘의 루틴 ✨">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ROUTINES.map(r => {
                const done = !!(todayLog.routines || {})[r.id]
                return (
                  <div key={r.id} onClick={() => toggleRoutine(r.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: 12, borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
                    background: done ? '#eef6f1' : '#faf7f4',
                    border: `1.5px solid ${done ? '#7eb89a' : 'transparent'}`,
                  }}>
                    <span style={{ fontSize: 20 }}>{r.emoji}</span>
                    <span style={{ flex: 1, fontSize: 14 }}>{r.label}</span>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: 12,
                      background: done ? '#7eb89a' : 'transparent',
                      border: `2px solid ${done ? '#7eb89a' : '#e8c4a0'}`,
                      color: 'white', transition: 'all 0.15s',
                    }}>{done ? '✓' : ''}</div>
                  </div>
                )
              })}
            </div>
          </Section>

          <Section title={`수분 섭취 💧 (${todayLog.water || 0}잔)`}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[1,2,3,4,5,6,7,8].map(n => (
                <button key={n} onClick={() => updateToday('water', n === todayLog.water ? n - 1 : n)} style={{
                  width: 36, height: 36, borderRadius: '50%', border: '2px solid',
                  borderColor: (todayLog.water || 0) >= n ? '#7ab3d4' : '#e8c4a0',
                  background: (todayLog.water || 0) >= n ? '#ddeef8' : 'white',
                  fontSize: 16, cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>💧</button>
              ))}
            </div>
          </Section>

          <Section title="오늘의 메모 📝">
            <textarea value={todayLog.note || ''} onChange={e => updateToday('note', e.target.value)}
              placeholder="오늘 어떤 하루였나요? 자유롭게 적어보세요."
              style={{
                width: '100%', border: '1.5px solid #f0e8df', borderRadius: 14,
                padding: 12, fontFamily: "'Gowun Dodum', sans-serif", fontSize: 14,
                color: '#3d2e22', background: '#faf7f4', resize: 'none',
                outline: 'none', minHeight: 80,
              }} />
          </Section>

          <button onClick={save} style={{
            width: 'calc(100% - 32px)', margin: '0 16px', padding: 16,
            background: '#c8956c', color: 'white', border: 'none', borderRadius: 20,
            fontFamily: "'Gowun Dodum', sans-serif", fontSize: 15, cursor: 'pointer',
          }}>저장하기</button>
        </>
      )}

      {tab === 'week' && <WeekView logs={logs} />}
      {tab === 'month' && <MonthView logs={logs} />}

      {/* Toast */}
      <div style={{
        position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
        background: '#3d2e22', color: 'white', padding: '10px 24px', borderRadius: 20,
        fontSize: 13, opacity: toast ? 1 : 0, transition: 'opacity 0.3s', pointerEvents: 'none',
      }}>저장되었어요 ✓</div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', borderRadius: 20, margin: '0 16px 16px',
      padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      <p style={{ fontSize: 13, color: '#9a8070', marginBottom: 14, letterSpacing: '0.05em' }}>{title}</p>
      {children}
    </div>
  )
}

function ScaleBtn({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, minWidth: 56, padding: '8px 4px',
      border: `1.5px solid ${selected ? '#c8956c' : '#f0e8df'}`,
      background: selected ? '#f0e8df' : 'white', borderRadius: 12,
      fontFamily: "'Gowun Dodum', sans-serif", fontSize: 12,
      color: selected ? '#3d2e22' : '#9a8070', cursor: 'pointer',
      fontWeight: selected ? 'bold' : 'normal', transition: 'all 0.15s',
    }}>{label}</button>
  )
}

function WeekView({ logs }: { logs: Logs }) {
  const days = getWeekDays()
  const entries = days.map(d => ({ date: d, log: logs[d] || null }))
  const moodVals = entries.filter(e => e.log?.mood).map(e => e.log!.mood!)
  const stiffVals = entries.filter(e => e.log?.stiffness).map(e => e.log!.stiffness!)
  const waterVals = entries.filter(e => e.log?.water).map(e => e.log!.water!)

  const routineRate = (id: string) =>
    Math.round((entries.filter(e => e.log?.routines?.[id]).length / 7) * 100)

  const shortDay = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('ko-KR', { weekday: 'short' })

  const getMoodBg = (val?: number) => {
    if (!val) return '#f0e8df'
    if (val >= 4) return '#eef6f1'
    if (val >= 3) return '#fdf6ee'
    return '#fdecea'
  }

  const insights: string[] = []
  if (moodVals.length) {
    const a = parseFloat(avg(moodVals)!)
    if (a >= 4) insights.push('이번 주 기분이 전반적으로 좋았어요 😊')
    else if (a <= 2.5) insights.push('이번 주 많이 힘들었죠. 잘 버텼어요 💙')
    else insights.push('이번 주 기분은 보통 정도였어요.')
  }
  if (stiffVals.length) {
    const a = parseFloat(avg(stiffVals)!)
    if (a >= 4) insights.push('강직이 많이 나아지고 있는 추세예요! 🌿')
    else if (a <= 2.5) insights.push('강직이 아직 심한 편이에요. 따뜻하게 챙겨요.')
  }
  const waterAvg = avg(waterVals)
  if (waterAvg) {
    if (parseFloat(waterAvg) >= 6) insights.push('수분 섭취 잘 하고 있어요 💧')
    else insights.push('물을 조금 더 챙겨 마시면 좋을 것 같아요 💧')
  }

  return (
    <div>
      <Section title="이번 주 기분 흐름">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {entries.map(({ date, log }) => (
            <div key={date} style={{
              aspectRatio: '1', borderRadius: 8, background: getMoodBg(log?.mood),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 1,
            }}>
              <span style={{ fontSize: 14 }}>{log?.mood ? MOODS.find(m => m.value === log.mood)?.emoji : '·'}</span>
              <span style={{ fontSize: 9, color: '#9a8070' }}>{shortDay(date)}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="주간 평균">
        <div style={{ display: 'flex', gap: 10 }}>
          {[['평균 기분', avg(moodVals)], ['강직 개선도', avg(stiffVals)], ['평균 수분', waterAvg ? waterAvg + '잔' : null]].map(([label, val]) => (
            <div key={label as string} style={{
              flex: 1, background: '#f0e8df', borderRadius: 12, padding: '8px 14px',
            }}>
              <p style={{ fontSize: 11, color: '#9a8070' }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 'bold', color: '#c8956c' }}>{val ?? '-'}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="루틴 실천률">
        {ROUTINES.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, width: 100, color: '#3d2e22' }}>{r.emoji} {r.label.slice(0, 7)}</span>
            <div style={{ flex: 1, height: 8, background: '#f0e8df', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${routineRate(r.id)}%`, height: '100%', background: '#7eb89a', borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 11, color: '#9a8070', width: 32, textAlign: 'right' }}>{routineRate(r.id)}%</span>
          </div>
        ))}
      </Section>

      {insights.length > 0 && (
        <Section title="이번 주 인사이트 ✨">
          <div style={{ background: '#f0e8df', borderRadius: 14, padding: 14, fontSize: 13, lineHeight: 1.7 }}>
            {insights.map((ins, i) => <div key={i} style={{ marginBottom: i < insights.length - 1 ? 8 : 0 }}>• {ins}</div>)}
          </div>
        </Section>
      )}
    </div>
  )
}

function MonthView({ logs }: { logs: Logs }) {
  const days = getMonthDays()
  const entries = days.map(d => ({ date: d, log: logs[d] || null }))
  const moodVals = entries.filter(e => e.log?.mood).map(e => e.log!.mood!)
  const stiffVals = entries.filter(e => e.log?.stiffness).map(e => e.log!.stiffness!)
  const waterVals = entries.filter(e => e.log?.water).map(e => e.log!.water!)
  const recordedDays = entries.filter(e => e.log).length

  const getHeatColor = (log: DayLog | null) => {
    if (!log?.mood) return '#f0e8df'
    const m = log.mood
    if (m >= 5) return '#7eb89a'
    if (m >= 4) return '#a8d4be'
    if (m >= 3) return '#e8c4a0'
    if (m >= 2) return '#e8a090'
    return '#d4756a'
  }

  const weeks = Array.from({ length: 4 }, (_, i) => {
    const slice = entries.slice(i * 7, (i + 1) * 7)
    const moods = slice.filter(e => e.log?.mood).map(e => e.log!.mood!)
    return { label: `${i + 1}주`, avg: avg(moods) }
  })

  const routineRate = (id: string) =>
    Math.round((entries.filter(e => e.log?.routines?.[id]).length / 30) * 100)

  const insights: string[] = []
  const recentMoods = entries.slice(-7).filter(e => e.log?.mood).map(e => e.log!.mood!)
  const recentAvg = avg(recentMoods)
  const totalAvg = avg(moodVals)
  if (recentAvg && totalAvg && parseFloat(recentAvg) > parseFloat(totalAvg)) {
    insights.push('최근 일주일 기분이 한달 평균보다 나아지고 있어요 📈')
  }
  const recentStiff = entries.slice(-7).filter(e => e.log?.stiffness).map(e => e.log!.stiffness!)
  const ra = avg(recentStiff); const ta = avg(stiffVals)
  if (ra && ta && parseFloat(ra) > parseFloat(ta)) {
    insights.push('강직이 한달 전보다 개선되는 추세예요 🌱')
  }
  insights.push(`한달 중 ${recordedDays}일 기록했어요. 꾸준히 기록하고 있는 자신을 칭찬해요 ✨`)

  return (
    <div>
      <Section title="30일 기분 히트맵">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 3 }}>
          {entries.map(({ date, log }) => (
            <div key={date} style={{ aspectRatio: '1', borderRadius: 4, background: getHeatColor(log) }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
          {[['#7eb89a','매우좋음'],['#a8d4be','좋음'],['#e8c4a0','보통'],['#e8a090','힘듦'],['#d4756a','많이힘듦'],['#f0e8df','기록없음']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9a8070' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
              {l}
            </div>
          ))}
        </div>
      </Section>

      <Section title="주차별 기분 흐름">
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
          {weeks.map(w => {
            const h = w.avg ? Math.round((parseFloat(w.avg) / 5) * 60) : 0
            return (
              <div key={w.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 11, color: '#c8956c' }}>{w.avg ?? '-'}</span>
                <div style={{ width: '100%', background: '#f0e8df', borderRadius: '6px 6px 0 0', height: 60, display: 'flex', alignItems: 'flex-end' }}>
                  <div style={{ width: '100%', background: '#c8956c', borderRadius: '6px 6px 0 0', height: h, transition: 'height 0.5s' }} />
                </div>
                <span style={{ fontSize: 11, color: '#9a8070' }}>{w.label}</span>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="한달 평균">
        <div style={{ display: 'flex', gap: 10 }}>
          {[['평균 기분', avg(moodVals)], ['강직 평균', avg(stiffVals)], ['평균 수분', avg(waterVals) ? avg(waterVals) + '잔' : null]].map(([label, val]) => (
            <div key={label as string} style={{ flex: 1, background: '#f0e8df', borderRadius: 12, padding: '8px 14px' }}>
              <p style={{ fontSize: 11, color: '#9a8070' }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 'bold', color: '#c8956c' }}>{val ?? '-'}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="루틴 한달 실천률">
        {ROUTINES.map(r => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, width: 100 }}>{r.emoji} {r.label.slice(0, 7)}</span>
            <div style={{ flex: 1, height: 8, background: '#f0e8df', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${routineRate(r.id)}%`, height: '100%', background: '#7eb89a', borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 11, color: '#9a8070', width: 32, textAlign: 'right' }}>{routineRate(r.id)}%</span>
          </div>
        ))}
      </Section>

      <Section title="한달 인사이트 🌿">
        <div style={{ background: '#f0e8df', borderRadius: 14, padding: 14, fontSize: 13, lineHeight: 1.7 }}>
          {insights.map((ins, i) => <div key={i} style={{ marginBottom: i < insights.length - 1 ? 8 : 0 }}>• {ins}</div>)}
        </div>
      </Section>
    </div>
  )
}
