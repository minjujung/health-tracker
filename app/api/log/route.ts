import { NextRequest, NextResponse } from 'next/server'

const SHEET_ID = process.env.GOOGLE_SHEET_ID!
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL!
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')

// JWT 토큰 생성 (googleapis 라이브러리 없이 직접 구현)
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const signingInput = `${encode(header)}.${encode(payload)}`

  // PEM key parsing
  const pemContents = PRIVATE_KEY
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

  const jwt = `${signingInput}.${sig}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json()
  return data.access_token as string
}

async function sheetsRequest(method: string, path: string, body?: object) {
  const token = await getAccessToken()
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  )
  return res.json()
}

// GET: 전체 로그 불러오기
export async function GET() {
  try {
    const data = await sheetsRequest('GET', '/values/Sheet1!A:Z')
    const rows: string[][] = data.values || []

    if (rows.length <= 1) return NextResponse.json({})

    const logs: Record<string, object> = {}
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      const date = row[0]
      if (!date) continue
      logs[date] = {
        mood: row[1] ? Number(row[1]) : undefined,
        stiffness: row[2] ? Number(row[2]) : undefined,
        pain: row[3] ? Number(row[3]) : undefined,
        water: row[4] ? Number(row[4]) : undefined,
        note: row[5] || undefined,
        routines: row[6] ? JSON.parse(row[6]) : undefined,
      }
    }
    return NextResponse.json(logs)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to read' }, { status: 500 })
  }
}

// POST: 오늘 로그 저장/업데이트
export async function POST(req: NextRequest) {
  try {
    const { date, log } = await req.json()

    // 헤더 확인
    const headerData = await sheetsRequest('GET', '/values/Sheet1!A1')
    if (!headerData.values) {
      await sheetsRequest('PUT', '/values/Sheet1!A1:G1?valueInputOption=RAW', {
        values: [['date', 'mood', 'stiffness', 'pain', 'water', 'note', 'routines']],
      })
    }

    // 기존 행 찾기
    const allData = await sheetsRequest('GET', '/values/Sheet1!A:A')
    const rows: string[][] = allData.values || []
    const rowIndex = rows.findIndex(r => r[0] === date)

    const rowData = [
      date,
      log.mood ?? '',
      log.stiffness ?? '',
      log.pain ?? '',
      log.water ?? '',
      log.note ?? '',
      log.routines ? JSON.stringify(log.routines) : '',
    ]

    if (rowIndex > 0) {
      // 업데이트
      await sheetsRequest('PUT', `/values/Sheet1!A${rowIndex + 1}:G${rowIndex + 1}?valueInputOption=RAW`, {
        values: [rowData],
      })
    } else {
      // 새 행 추가
      await sheetsRequest('POST', '/values/Sheet1!A:G:append?valueInputOption=RAW', {
        values: [rowData],
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
