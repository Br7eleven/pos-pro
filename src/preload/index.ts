import { contextBridge, ipcRenderer } from 'electron'

const api = {
  invoke: (channel: string, payload?: unknown) => ipcRenderer.invoke(channel, payload),
  products: {
    list: (filters?: object) => ipcRenderer.invoke('db:products:list', filters),
    get: (id: number) => ipcRenderer.invoke('db:products:get', { id }),
    getByBarcode: (barcode: string) => ipcRenderer.invoke('db:products:getByBarcode', { barcode }),
    create: (input: object) => ipcRenderer.invoke('db:products:create', input),
    update: (id: number, input: object) => ipcRenderer.invoke('db:products:update', { id, ...input }),
    adjustStock: (id: number, delta: number, reason: string, userId?: number, userName?: string) => ipcRenderer.invoke('db:products:adjustStock', { id, delta, reason, userId, userName }),
    stockMovements: (productId?: number) => ipcRenderer.invoke('db:stock:movements', { productId })
  },
  categories: {
    list: () => ipcRenderer.invoke('db:categories:list'),
    create: (name: string, color: string) => ipcRenderer.invoke('db:categories:create', { name, color })
  },
  dialog: {
    selectImage: () => ipcRenderer.invoke('dialog:selectImage')
  },
  transactions: {
    create: (input: object) => ipcRenderer.invoke('db:transactions:create', input),
    get: (id: number) => ipcRenderer.invoke('db:transactions:get', { id }),
    list: (filters?: object) => ipcRenderer.invoke('db:transactions:list', filters),
    void: (id: number, reason: string) => ipcRenderer.invoke('db:transactions:void', { id, reason })
  },
  customers: {
    list: (search?: string) => ipcRenderer.invoke('db:customers:list', { search }),
    get: (id: number) => ipcRenderer.invoke('db:customers:get', { id }),
    getByPhone: (phone: string) => ipcRenderer.invoke('db:customers:getByPhone', { phone }),
    create: (data: object) => ipcRenderer.invoke('db:customers:create', data),
    update: (id: number, data: object) => ipcRenderer.invoke('db:customers:update', { id, ...data }),
    addPoints: (id: number, points: number) => ipcRenderer.invoke('db:customers:addPoints', { id, points })
  },
  staff: {
    authenticate: (pin: string) => ipcRenderer.invoke('staff:authenticate', { pin }),
    list: () => ipcRenderer.invoke('staff:list'),
    create: (name: string, pin: string, role: string) => ipcRenderer.invoke('staff:create', { name, pin, role }),
    update: (id: number, data: object) => ipcRenderer.invoke('staff:update', { id, ...data })
  },
  reports: {
    daily: (date: number) => ipcRenderer.invoke('reports:daily', { date }),
    range: (from: number, to: number) => ipcRenderer.invoke('reports:range', { from, to })
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    set: (key: string, value: string) => ipcRenderer.invoke('settings:set', { key, value }),
    setMany: (data: object) => ipcRenderer.invoke('settings:setMany', data)
  },
  print: {
    getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
    receipt: (html: string, printerName?: string) => ipcRenderer.invoke('print:receipt', { html, printerName })
  },
  audit: {
    list: (filters?: object) => ipcRenderer.invoke('audit:list', filters)
  },
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    list: () => ipcRenderer.invoke('backup:list'),
    selectFile: () => ipcRenderer.invoke('backup:selectFile'),
    restore: (backupPath: string) => ipcRenderer.invoke('backup:restore', { backupPath })
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
