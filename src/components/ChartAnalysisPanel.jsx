import { useEffect, useRef } from 'react'
import { buildEChartsOption } from '@/lib/chartConfig.js'
import { useAppStore } from '@/store/useAppStore.js'

/**
 * @param {{
 *   hotRef: import('react').RefObject<import('handsontable').default | null>,
 *   chartDomRef: import('react').RefObject<HTMLDivElement | null>,
 *   chartInstanceRef: import('react').RefObject<import('echarts').ECharts | null>,
 * }} props
 */
export function ChartAnalysisPanel({ hotRef, chartDomRef, chartInstanceRef }) {
  const echartsRef = useRef(null)
  const parsedData = useAppStore((s) => s.parsedData)
  const chartOpen = useAppStore((s) => s.chartOpen)
  const setChartOpen = useAppStore((s) => s.setChartOpen)
  const chartType = useAppStore((s) => s.chartType)
  const setChartType = useAppStore((s) => s.setChartType)
  const xAxis = useAppStore((s) => s.xAxis)
  const setXAxis = useAppStore((s) => s.setXAxis)
  const yAxis = useAppStore((s) => s.yAxis)
  const setYAxis = useAppStore((s) => s.setYAxis)
  const extraSeries = useAppStore((s) => s.extraSeries)
  const chartGenerated = useAppStore((s) => s.chartGenerated)
  const setChartGenerated = useAppStore((s) => s.setChartGenerated)
  const addSeriesRow = useAppStore((s) => s.addSeriesRow)
  const removeSeriesRow = useAppStore((s) => s.removeSeriesRow)
  const setSeriesValue = useAppStore((s) => s.setSeriesValue)
  const resetChartFields = useAppStore((s) => s.resetChartFields)
  const showError = useAppStore((s) => s.showError)

  const headers = parsedData ? parsedData.meta.fields || Object.keys(parsedData.data[0] || {}) : []
  const multiSeriesVisible = chartType === 'line' || chartType === 'bar' || chartType === 'radar'

  const seriesOptionsForRow = (rowId, currentVal) => {
    const taken = new Set([yAxis, ...extraSeries.filter((s) => s.id !== rowId).map((s) => s.value)])
    return headers.filter((h) => !taken.has(h) || h === currentVal)
  }

  useEffect(() => {
    if (!chartGenerated || !chartOpen) return
    const el = chartDomRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      chartInstanceRef.current?.resize()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [chartGenerated, chartOpen, chartDomRef, chartInstanceRef])

  const handleGenerateChart = async () => {
    if (!parsedData || !hotRef.current) {
      showError('Please load a data file first.')
      return
    }
    if (!xAxis || !yAxis) {
      showError('Please select both X-axis and Y-axis columns.')
      return
    }
    const dom = chartDomRef.current
    if (!dom) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
      chartInstanceRef.current = null
    }

    const extra = extraSeries.map((s) => s.value).filter(Boolean)
    const option = buildEChartsOption(parsedData, {
      type: chartType,
      xAxis,
      yAxis,
      extraSeries: extra,
    })
    if (!option) return

    if (!echartsRef.current) {
      const echartsModule = await import('echarts')
      echartsRef.current = echartsModule
    }

    const chart = echartsRef.current.init(dom, null, { renderer: 'canvas' })
    chart.setOption(option, true)
    chartInstanceRef.current = chart
    setChartGenerated(true)
    requestAnimationFrame(() => chart.resize())
  }

  const handleClearChart = () => {
    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose()
      chartInstanceRef.current = null
    }
    resetChartFields()
  }

  return (
    <>
      {chartOpen ? (
        <button type="button" className="drawer-backdrop" aria-label="Close charts" onClick={() => setChartOpen(false)} />
      ) : null}
      <div
        id="chart-panel"
        className="chart-panel"
        style={{ display: chartOpen ? 'flex' : 'none' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-title"
      >
        <div className="chart-header">
          <h3 id="chart-title">Chart Analysis</h3>
          <button type="button" className="chart-close" aria-label="Close" onClick={() => setChartOpen(false)}>
            ×
          </button>
        </div>
        <div className="chart-controls">
          <div className="chart-control-group">
            <label htmlFor="chart-type">Chart Type:</label>
            <select
              id="chart-type"
              className="chart-select"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="line">Line Chart</option>
              <option value="bar">Bar Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
              <option value="scatter">Scatter Plot</option>
              <option value="radar">Radar Chart</option>
            </select>
          </div>
          <div className="chart-control-group">
            <label htmlFor="x-axis">X-Axis (Category):</label>
            <select id="x-axis" className="chart-select" value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
              <option value="">Select column...</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="chart-control-group">
            <label htmlFor="y-axis">Y-Axis (Value):</label>
            <select id="y-axis" className="chart-select" value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
              <option value="">Select column...</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="chart-control-group" id="multi-series-group" style={{ display: multiSeriesVisible ? 'block' : 'none' }}>
            <label>Additional Series (optional):</label>
            <div id="series-selectors">
              {extraSeries.map((s) => (
                <div key={s.id} className="series-selector">
                  <select className="chart-select" value={s.value} onChange={(e) => setSeriesValue(s.id, e.target.value)}>
                    <option value="">Select column...</option>
                    {seriesOptionsForRow(s.id, s.value).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <button type="button" className="remove-series-btn" aria-label="Remove series" onClick={() => removeSeriesRow(s.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" id="add-series" className="add-series-btn" onClick={addSeriesRow}>
              + Add Series
            </button>
          </div>
          <div className="chart-control-group">
            <button type="button" id="generate-chart" className="generate-chart-btn" onClick={handleGenerateChart}>
              Generate Chart
            </button>
            <button type="button" id="clear-chart" className="clear-chart-btn" onClick={handleClearChart}>
              Clear
            </button>
          </div>
        </div>
        <div className="chart-container-wrapper">
          {!chartGenerated ? (
            <div className="chart-placeholder">
              <p className="chart-placeholder-title">No chart yet</p>
              <p className="chart-placeholder-hint">Choose columns and click &quot;Generate Chart&quot; to visualize your data.</p>
            </div>
          ) : null}
          <div id="chart-echarts" ref={chartDomRef} className="chart-echarts" role="img" aria-label="Data chart" />
        </div>
      </div>
    </>
  )
}
