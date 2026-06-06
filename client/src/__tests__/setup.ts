import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock localStorage - 使用真实的 localStorage 实现，但可以 spy
const localStorageStore: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key]
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach(key => delete localStorageStore[key])
  }),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

// Mock EventSource
class MockEventSource {
  url: string
  readyState: number = 0
  onopen: ((this: EventSource, ev: Event) => any) | null = null
  onmessage: ((this: EventSource, ev: MessageEvent) => any) | null = null
  onerror: ((this: EventSource, ev: Event) => any) | null = null
  private listeners: Map<string, EventListener[]> = new Map()

  constructor(url: string) {
    this.url = url
    this.readyState = 0
    setTimeout(() => {
      this.readyState = 1
      this.onopen?.call(this as any, new Event('open'))
    }, 0)
  }

  addEventListener(type: string, listener: EventListener) {
    const existing = this.listeners.get(type) || []
    existing.push(listener)
    this.listeners.set(type, existing)
  }

  removeEventListener(type: string, listener: EventListener) {
    const existing = this.listeners.get(type) || []
    const index = existing.indexOf(listener)
    if (index > -1) {
      existing.splice(index, 1)
    }
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.listeners.get(event.type) || []
    listeners.forEach(listener => listener(event))
    return true
  }

  close() {
    this.readyState = 2
  }
}

Object.defineProperty(window, 'EventSource', {
  value: MockEventSource,
  writable: true,
})

// 清理每个测试之间的状态
beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(localStorageStore).forEach(key => delete localStorageStore[key])
})
