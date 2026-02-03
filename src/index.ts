import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'

const app = new Hono()

// 정적 파일 서빙
app.use('/*', serveStatic({ root: './public' }))

// 어제 날씨 API
app.get('/api/yesterday', async (c) => {
  const lat = c.req.query('lat')
  const lon = c.req.query('lon')

  if (!lat || !lon) {
    return c.json({ error: 'lat, lon required' }, 400)
  }

  // 어제 날짜 계산
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]

  try {
    // Open-Meteo Archive API
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_mean,weathercode&timezone=auto`

    const res = await fetch(url)
    const data = await res.json()

    if (!data.daily) {
      return c.json({ error: 'No data available' }, 404)
    }

    const tempC = Math.round(data.daily.temperature_2m_mean[0])
    const tempF = Math.round(tempC * 9/5 + 32)
    const weatherCode = data.daily.weathercode[0]
    const weatherType = getWeatherType(weatherCode)

    return c.json({
      date: dateStr,
      tempC,
      tempF,
      weatherType,
      weatherCode,
      timezone: data.timezone
    })
  } catch (err) {
    return c.json({ error: 'Failed to fetch weather data' }, 500)
  }
})

// WMO Weather Code → 날씨 타입 매핑
function getWeatherType(code: number): string {
  if (code === 0) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code <= 49) return 'fog'
  if (code <= 69) return 'rain'
  if (code <= 79) return 'snow'
  if (code <= 99) return 'storm'
  return 'cloudy'
}

export default {
  port: 3000,
  fetch: app.fetch
}
