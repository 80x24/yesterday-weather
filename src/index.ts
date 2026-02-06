import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'

const app = new Hono()

// 정적 파일 서빙
app.use('/*', serveStatic({ root: './public' }))

// 어제 날씨 API (legacy, backward compatible)
app.get('/api/yesterday', async (c) => {
  const lat = c.req.query('lat')
  const lon = c.req.query('lon')

  if (!lat || !lon) {
    return c.json({ error: 'lat, lon required' }, 400)
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]

  try {
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

    return c.json({ date: dateStr, tempC, tempF, weatherType, weatherCode, timezone: data.timezone })
  } catch (err) {
    return c.json({ error: 'Failed to fetch weather data' }, 500)
  }
})

// 오늘 + 어제 날씨 API (새 엔드포인트)
app.get('/api/weather', async (c) => {
  const lat = c.req.query('lat')
  const lon = c.req.query('lon')

  if (!lat || !lon) {
    return c.json({ error: 'lat, lon required' }, 400)
  }

  try {
    // Forecast API with past_days=1: yesterday(actual) + today(forecast+current)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&past_days=1&forecast_days=1&timezone=auto&current_weather=true`
    const res = await fetch(url)
    const data = await res.json()

    if (!data.daily || !data.current_weather) {
      return c.json({ error: 'No data available' }, 404)
    }

    const daily = data.daily
    // weather_code or weathercode (API version compat)
    const codes = daily.weather_code || daily.weathercode || []

    // daily[0] = yesterday, daily[1] = today
    const yHigh = Math.round(daily.temperature_2m_max[0])
    const yLow = Math.round(daily.temperature_2m_min[0])
    const yMean = Math.round((yHigh + yLow) / 2)

    const tHigh = Math.round(daily.temperature_2m_max[1])
    const tLow = Math.round(daily.temperature_2m_min[1])
    const currentTemp = Math.round(data.current_weather.temperature)
    const currentCode = data.current_weather.weathercode ?? data.current_weather.weather_code ?? 0

    return c.json({
      today: {
        tempC: currentTemp,
        tempF: Math.round(currentTemp * 9/5 + 32),
        high: tHigh,
        highF: Math.round(tHigh * 9/5 + 32),
        low: tLow,
        lowF: Math.round(tLow * 9/5 + 32),
        weatherType: getWeatherType(currentCode),
        weatherCode: currentCode,
      },
      yesterday: {
        tempC: yMean,
        tempF: Math.round(yMean * 9/5 + 32),
        high: yHigh,
        highF: Math.round(yHigh * 9/5 + 32),
        low: yLow,
        lowF: Math.round(yLow * 9/5 + 32),
        weatherType: getWeatherType(codes[0] ?? 0),
        weatherCode: codes[0] ?? 0,
      },
      currentTime: data.current_weather.time,
      timezone: data.timezone,
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
