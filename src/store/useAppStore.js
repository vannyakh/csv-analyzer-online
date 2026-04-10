import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { suggestChartColumns } from '@/lib/suggestChartColumns.js'

const WORKSPACE_STORAGE_KEY = 'csv-analyzer-workspace'

const workspaceStorage = createJSONStorage(() => ({
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      /* quota exceeded or storage disabled */
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
}))

const initialChartState = () => ({
  chartType: 'line',
  xAxis: '',
  yAxis: '',
  extraSeries: [],
  chartGenerated: false,
})

export const useAppStore = create(
  persist(
    (set, get) => ({
  parsedData: null,
  currentFile: null,
  displayName: '',
  renaming: false,
  loading: false,
  errorMessage: '',
  searchQuery: '',
  urlModalOpen: false,
  urlInput: '',
  urlError: '',
  statsOpen: false,
  chartOpen: false,
  ...initialChartState(),
  copyDone: false,
  notice: null,

  showError: (message) => set({ errorMessage: message }),
  clearError: () => set({ errorMessage: '' }),

  setLoading: (loading) => set({ loading }),

  applyParsedDataSuccess: (file, data) => {
    const name = file ? file.name : 'Loaded from URL'
    set({
      parsedData: data,
      currentFile: file,
      displayName: name,
      renaming: false,
      searchQuery: '',
      errorMessage: '',
      loading: false,
      ...initialChartState(),
    })
  },

  setDisplayName: (displayName) => set({ displayName }),
  setRenaming: (renaming) => set({ renaming }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  openUrlModal: () => set({ urlModalOpen: true }),
  closeUrlModal: () => set({ urlModalOpen: false, urlInput: '', urlError: '' }),
  setUrlInput: (urlInput) => set({ urlInput: urlInput }),
  setUrlError: (urlError) => set({ urlError: urlError }),

  setStatsOpen: (statsOpen) => set({ statsOpen }),
  setChartOpen: (chartOpen) => set({ chartOpen }),

  setChartType: (chartType) =>
    set((s) => ({
      chartType,
      extraSeries:
        chartType === 'line' || chartType === 'bar' || chartType === 'radar'
          ? s.extraSeries
          : [],
    })),

  setXAxis: (xAxis) => set({ xAxis }),
  setYAxis: (yAxis) => set({ yAxis }),

  addSeriesRow: () =>
    set((s) => ({
      extraSeries: [...s.extraSeries, { id: crypto.randomUUID(), value: '' }],
    })),
  removeSeriesRow: (id) =>
    set((s) => ({ extraSeries: s.extraSeries.filter((x) => x.id !== id) })),
  setSeriesValue: (id, value) =>
    set((s) => ({
      extraSeries: s.extraSeries.map((x) => (x.id === id ? { ...x, value } : x)),
    })),

  setChartGenerated: (chartGenerated) => set({ chartGenerated }),

  resetChartFields: () => set({ ...initialChartState() }),

  setCopyDone: (copyDone) => set({ copyDone: copyDone }),
  flashCopyDone: () => {
    set({ copyDone: true })
    setTimeout(() => set({ copyDone: false }), 2000)
  },

  setNotice: (notice) => set({ notice }),

  commitDisplayName: () => {
    const { displayName, currentFile } = get()
    const raw = displayName.trim()
    if (raw.length > 0) {
      const finalName = raw.endsWith('.csv') ? raw : `${raw}.csv`
      if (currentFile) {
        try {
          Object.defineProperty(currentFile, 'name', { writable: true, value: finalName })
        } catch {
          /* ignore */
        }
      }
      set({ displayName: finalName, renaming: false })
    } else {
      set({
        displayName: currentFile ? currentFile.name : 'Loaded from URL',
        renaming: false,
      })
    }
  },

  cancelRename: () => {
    const { currentFile } = get()
    set({
      displayName: currentFile ? currentFile.name : 'Loaded from URL',
      renaming: false,
    })
  },

  clearWorkspaceState: () =>
    set({
      parsedData: null,
      currentFile: null,
      displayName: '',
      renaming: false,
      searchQuery: '',
      urlModalOpen: false,
      urlInput: '',
      urlError: '',
      statsOpen: false,
      chartOpen: false,
      ...initialChartState(),
      errorMessage: '',
      notice: null,
      loading: false,
    }),

  openChartPanel: () => {
    const parsedData = get().parsedData
    if (!parsedData) {
      get().showError('Please load a data file first.')
      return
    }
    const s = suggestChartColumns(parsedData)
    set((state) => ({
      chartOpen: true,
      xAxis: state.xAxis || s.x,
      yAxis: state.yAxis || s.y,
    }))
  },
}),
    {
      name: WORKSPACE_STORAGE_KEY,
      storage: workspaceStorage,
      partialize: (s) => ({
        parsedData: s.parsedData,
        displayName: s.displayName,
        searchQuery: s.searchQuery,
        statsOpen: s.statsOpen,
        chartOpen: s.chartOpen,
        chartType: s.chartType,
        xAxis: s.xAxis,
        yAxis: s.yAxis,
        extraSeries: s.extraSeries,
        chartGenerated: s.chartGenerated,
      }),
    },
  ),
)
