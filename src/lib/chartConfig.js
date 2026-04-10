/** ECharts default color cycle */
const PALETTE = ['#4f5fd7', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']

function pickColor(i) {
  return PALETTE[i % PALETTE.length]
}

function baseGrid() {
  return {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: 72,
    containLabel: true,
  }
}

/**
 * @param {{ data: object[], meta: { fields?: string[] } }} parsed
 * @param {{ type: string, xAxis: string, yAxis: string, extraSeries: string[] }} opts
 * @returns {object | null} ECharts option
 */
export function buildEChartsOption(parsed, opts) {
  const { type, xAxis, yAxis, extraSeries } = opts
  const data = parsed.data
  const headers = parsed.meta.fields || Object.keys(data[0] || {})
  if (!data.length || !headers.length) return null

  const selectedSeries = extraSeries.filter(Boolean)

  const titleText = (t) => ({
    text: t,
    left: 'center',
    top: 8,
    textStyle: { fontSize: 14, fontWeight: 600, color: '#1a1d26' },
  })

  if (type === 'pie' || type === 'doughnut') {
    const labels = data.map((row) => String(row[xAxis] || ''))
    const values = data.map((row) => parseFloat(row[yAxis]) || 0)
    const pieData = labels.map((name, i) => ({ name, value: values[i] }))
    const isRing = type === 'doughnut'
    return {
      color: PALETTE,
      title: titleText(`${yAxis} by ${xAxis}`),
      tooltip: { trigger: 'item' },
      legend: { type: 'scroll', orient: 'vertical', right: 8, top: 'middle' },
      series: [
        {
          name: yAxis,
          type: 'pie',
          radius: isRing ? ['42%', '68%'] : '65%',
          center: ['40%', '55%'],
          data: pieData,
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.2)' },
          },
        },
      ],
    }
  }

  if (type === 'scatter') {
    const pts = data.map((row) => [parseFloat(row[xAxis]) || 0, parseFloat(row[yAxis]) || 0])
    return {
      color: PALETTE,
      title: titleText(`${yAxis} vs ${xAxis}`),
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          const [xv, yv] = p.value
          return `${xAxis}: ${xv}<br/>${yAxis}: ${yv}`
        },
      },
      grid: baseGrid(),
      xAxis: { type: 'value', name: xAxis, nameLocation: 'middle', nameGap: 28, splitLine: { lineStyle: { type: 'dashed' } } },
      yAxis: { type: 'value', name: yAxis, nameLocation: 'middle', nameGap: 36, splitLine: { lineStyle: { type: 'dashed' } } },
      series: [
        {
          name: `${yAxis} vs ${xAxis}`,
          type: 'scatter',
          symbolSize: 10,
          data: pts,
        },
      ],
    }
  }

  if (type === 'radar') {
    const labels = [...new Set(data.map((row) => String(row[xAxis] || '')))]
    const mainValues = labels.map((label) => {
      const matching = data.filter((row) => String(row[xAxis] || '') === label)
      return matching.reduce((sum, row) => sum + (parseFloat(row[yAxis]) || 0), 0) / matching.length
    })
    const seriesData = [{ value: mainValues, name: yAxis }]

    selectedSeries.forEach((series) => {
      const seriesValues = labels.map((label) => {
        const matching = data.filter((row) => String(row[xAxis] || '') === label)
        return matching.reduce((sum, row) => sum + (parseFloat(row[series]) || 0), 0) / matching.length
      })
      seriesData.push({ value: seriesValues, name: series })
    })

    const maxPerIdx = labels.map((_, j) => {
      const m = Math.max(...seriesData.map((s) => s.value[j] || 0), 1)
      return Math.ceil(m * 1.15)
    })

    return {
      color: PALETTE,
      title: titleText(`Radar: ${xAxis}`),
      tooltip: {},
      legend: { bottom: 4, data: seriesData.map((s) => s.name) },
      radar: {
        indicator: labels.map((name, i) => ({ name, max: maxPerIdx[i] })),
        center: ['50%', '52%'],
        radius: '58%',
      },
      series: [
        {
          type: 'radar',
          data: seriesData.map((s, idx) => {
            const c = pickColor(idx)
            return {
              value: s.value,
              name: s.name,
              lineStyle: { width: 2, color: c },
              areaStyle: { opacity: 0.12, color: c },
            }
          }),
        },
      ],
    }
  }

  const labels = [...new Set(data.map((row) => String(row[xAxis] || '')))]
  const series = []

  const mainValues = labels.map((label) => {
    const matching = data.filter((row) => String(row[xAxis] || '') === label)
    return matching.reduce((sum, row) => sum + (parseFloat(row[yAxis]) || 0), 0)
  })
  series.push({
    name: yAxis,
    type: type === 'bar' ? 'bar' : 'line',
    data: mainValues,
    smooth: type === 'line',
    lineStyle: { width: 2.5, color: pickColor(0) },
    itemStyle: { color: pickColor(0) },
    areaStyle: type === 'line' ? { opacity: 0.08, color: pickColor(0) } : undefined,
    barMaxWidth: 36,
  })

  selectedSeries.forEach((ser, idx) => {
    const seriesValues = labels.map((label) => {
      const matching = data.filter((row) => String(row[xAxis] || '') === label)
      return matching.reduce((sum, row) => sum + (parseFloat(row[ser]) || 0), 0)
    })
    const c = pickColor(idx + 1)
    series.push({
      name: ser,
      type: type === 'bar' ? 'bar' : 'line',
      data: seriesValues,
      smooth: type === 'line',
      lineStyle: { width: 2.5, color: c },
      itemStyle: { color: c },
      areaStyle: type === 'line' ? { opacity: 0.06, color: c } : undefined,
      barMaxWidth: 36,
    })
  })

  return {
    color: PALETTE,
    title: titleText(`${yAxis} by ${xAxis}`),
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: series.map((s) => s.name), top: 36, type: 'scroll' },
    grid: baseGrid(),
    xAxis: {
      type: 'category',
      data: labels,
      name: xAxis,
      nameLocation: 'middle',
      nameGap: 28,
      axisLabel: { interval: 0, rotate: labels.length > 12 ? 35 : 0 },
    },
    yAxis: {
      type: 'value',
      name: 'Value',
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.6 } },
    },
    series,
  }
}
