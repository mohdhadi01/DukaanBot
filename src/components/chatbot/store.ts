// Global app state with Zustand
'use client'

import { create } from 'zustand'

export type ViewName =
  | 'dashboard'
  | 'menu'
  | 'flow'
  | 'inbox'
  | 'orders'
  | 'customers'
  | 'settings'

interface AppState {
  view: ViewName
  setView: (v: ViewName) => void

  // Sidebar collapse
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // Selected conversation
  selectedConversationId: string | null
  setSelectedConversationId: (id: string | null) => void

  // Refresh trigger (bump to refetch)
  refreshKey: number
  triggerRefresh: () => void
}

export const useApp = create<AppState>((set) => ({
  view: 'dashboard',
  setView: (v) => set({ view: v }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  selectedConversationId: null,
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),

  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}))
