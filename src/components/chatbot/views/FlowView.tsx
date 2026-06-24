'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { api, API } from '../api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useApp } from '../store'
import {
  Workflow,
  Plus,
  Play,
  Flag,
  MessageSquare,
  ListOrdered,
  HelpCircle,
  GitBranch,
  ShoppingCart,
  CheckCircle2,
  Save,
  Trash2,
  X,
  Loader2,
  MousePointer2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NODE_TYPES = [
  { type: 'start', label: 'Start', icon: Flag, color: '#16a34a', desc: 'Entry point of the flow' },
  { type: 'message', label: 'Message', icon: MessageSquare, color: '#0891b2', desc: 'Send a text message' },
  { type: 'menu', label: 'Menu', icon: ListOrdered, color: '#d97706', desc: 'Show products from menu' },
  { type: 'question', label: 'Question', icon: HelpCircle, color: '#7c3aed', desc: 'Ask with multiple-choice options' },
  { type: 'collect', label: 'Collect Input', icon: MessageSquare, color: '#dc2626', desc: 'Collect free text input' },
  { type: 'branch', label: 'Branch', icon: GitBranch, color: '#0d9488', desc: 'Route based on a variable' },
  { type: 'place_order', label: 'Place Order', icon: ShoppingCart, color: '#db2777', desc: 'Create order from cart' },
  { type: 'end', label: 'End', icon: CheckCircle2, color: '#475569', desc: 'End conversation' },
]

const NODE_WIDTH = 220
const NODE_HEIGHT = 100

export function FlowView() {
  const [nodes, setNodes] = useState<any[]>([])
  const [edges, setEdges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<any>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<{ from: string; mouseX: number; mouseY: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const { refreshKey } = useApp()
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    const [f] = await Promise.all([api(API.flow)])
    setNodes(f.nodes)
    setEdges(f.edges)
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (cancelled) return
      await load()
    })()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  // Mouse handlers
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvas === 'true') {
      setSelectedNode(null)
      setIsPanning(true)
    }
  }

  useEffect(() => {
    if (!isPanning && !draggingNode && !connecting) return

    const onMove = (e: MouseEvent) => {
      if (isPanning) {
        setPan((p) => ({ x: p.x + e.movementX, y: p.y + e.movementY }))
      } else if (draggingNode) {
        setNodes((ns) =>
          ns.map((n) =>
            n.id === draggingNode
              ? {
                  ...n,
                  positionX: Math.max(0, n.positionX + e.movementX / zoom),
                  positionY: Math.max(0, n.positionY + e.movementY / zoom),
                }
              : n
          )
        )
      } else if (connecting) {
        const rect = canvasRef.current?.getBoundingClientRect()
        if (rect) {
          setConnecting({
            from: connecting.from,
            mouseX: (e.clientX - rect.left - pan.x) / zoom - NODE_WIDTH / 2,
            mouseY: (e.clientY - rect.top - pan.y) / zoom - 10,
          })
        }
      }
    }

    const onUp = async () => {
      if (draggingNode) {
        // Save position
        const n = nodes.find((x) => x.id === draggingNode)
        if (n) {
          await api(API.flow, {
            method: 'PATCH',
            body: JSON.stringify({
              id: n.id,
              positionX: n.positionX,
              positionY: n.positionY,
            }),
          }).catch(() => {})
        }
      }
      setIsPanning(false)
      setDraggingNode(null)
      setConnecting(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isPanning, draggingNode, connecting, zoom, pan, nodes])

  const onNodeMouseDown = (e: React.MouseEvent, node: any) => {
    e.stopPropagation()
    setSelectedNode(node.id)
    setDraggingNode(node.id)
  }

  const onNodeDoubleClick = (node: any) => {
    setSelectedNode(node.id)
    setEditOpen(true)
  }

  const onOutputHandleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setConnecting({ from: nodeId, mouseX: 0, mouseY: 0 })
  }

  const onNodeMouseUp = async (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation()
    if (connecting && connecting.from !== targetNodeId) {
      // Create edge
      const existing = edges.find(
        (ed) => ed.sourceNodeId === connecting.from && ed.targetNodeId === targetNodeId
      )
      if (!existing) {
        try {
          const { edge } = await api(API.flowEdges, {
            method: 'POST',
            body: JSON.stringify({
              sourceNodeId: connecting.from,
              targetNodeId,
            }),
          })
          setEdges((es) => [...es, edge])
          toast({ title: 'Connected', description: 'Steps linked together' })
        } catch (e: any) {
          toast({ title: 'Failed to connect', description: e.message, variant: 'destructive' })
        }
      }
    }
  }

  const handleAddNode = async (type: string) => {
    const meta = NODE_TYPES.find((t) => t.type === type)!
    const rect = canvasRef.current?.getBoundingClientRect()
    const x = rect ? (rect.width / 2 - pan.x) / zoom - NODE_WIDTH / 2 : 200
    const y = rect ? (rect.height / 2 - pan.y) / zoom - NODE_HEIGHT / 2 : 100
    try {
      const { node } = await api(API.flow, {
        method: 'POST',
        body: JSON.stringify({
          type,
          title: meta.label,
          data: defaultDataFor(type),
          positionX: x,
          positionY: y,
          isStart: false,
        }),
      })
      setNodes((ns) => [...ns, node])
      toast({ title: `${meta.label} step added` })
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Delete this step and its connections?')) return
    try {
      await api(`${API.flow}?id=${id}`, { method: 'DELETE' })
      setNodes((ns) => ns.filter((n) => n.id !== id))
      setEdges((es) => es.filter((e) => e.sourceNodeId !== id && e.targetNodeId !== id))
      setSelectedNode(null)
      toast({ title: 'Step deleted' })
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleDeleteEdge = async (id: string) => {
    try {
      await api(`${API.flowEdges}?id=${id}`, { method: 'DELETE' })
      setEdges((es) => es.filter((e) => e.id !== id))
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleSetStart = async (id: string) => {
    try {
      await api(API.flow, {
        method: 'PATCH',
        body: JSON.stringify({ id, isStart: true }),
      })
      setNodes((ns) => ns.map((n) => ({ ...n, isStart: n.id === id })))
      toast({ title: 'Set as starting step' })
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleSaveNode = async (data: any) => {
    if (!selectedNode) return
    try {
      const { node } = await api(API.flow, {
        method: 'PATCH',
        body: JSON.stringify({ id: selectedNode, ...data }),
      })
      setNodes((ns) => ns.map((n) => (n.id === selectedNode ? node : n)))
      toast({ title: 'Step saved' })
      setEditOpen(false)
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="border-b bg-background px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Workflow className="h-5 w-5 text-emerald-600" />
              Flow Builder
            </h1>
            <p className="text-xs text-muted-foreground">
              Drag steps to arrange · Click ▢ on a step to connect · Double-click to edit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                useApp.getState().setView('inbox')
              }}
              className="gap-1.5"
            >
              <Play className="h-3.5 w-3.5" />
              Test Flow
            </Button>
            <div className="flex items-center gap-1 border rounded-md px-1.5 py-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}>
                <span className="text-sm">−</span>
              </Button>
              <span className="text-xs w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}>
                <span className="text-sm">+</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Node palette */}
        <aside className="w-44 shrink-0 border-r bg-background p-3 overflow-y-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Add Step
          </p>
          <div className="space-y-1">
            {NODE_TYPES.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.type}
                  onClick={() => handleAddNode(t.type)}
                  className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted/70 text-left transition-colors"
                >
                  <div
                    className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 text-white"
                    style={{ background: t.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{t.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-muted/30">
          <div
            ref={canvasRef}
            data-canvas="true"
            onMouseDown={onCanvasMouseDown}
            className={cn('absolute inset-0', isPanning ? 'cursor-grabbing' : 'cursor-grab')}
            style={{
              backgroundImage:
                'radial-gradient(circle, #d4d4d4 1px, transparent 1px)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          >
            <div
              data-canvas="true"
              className="absolute top-0 left-0 origin-top-left"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              {/* Edges */}
              <svg
                className="absolute pointer-events-none"
                style={{ overflow: 'visible', top: 0, left: 0, width: '100%', height: '100%' }}
              >
                {edges.map((e) => {
                  const src = nodes.find((n) => n.id === e.sourceNodeId)
                  const tgt = nodes.find((n) => n.id === e.targetNodeId)
                  if (!src || !tgt) return null
                  const x1 = src.positionX + NODE_WIDTH
                  const y1 = src.positionY + NODE_HEIGHT - 20
                  const x2 = tgt.positionX
                  const y2 = tgt.positionY + NODE_HEIGHT / 2
                  const dx = Math.abs(x2 - x1) * 0.5 + 40
                  const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
                  return (
                    <g key={e.id} className="pointer-events-auto">
                      <path
                        d={path}
                        stroke="#94a3b8"
                        strokeWidth={2}
                        fill="none"
                        className="hover:stroke-rose-500 cursor-pointer"
                        onClick={() => handleDeleteEdge(e.id)}
                      />
                      <circle cx={x2} cy={y2} r={4} fill="#94a3b8" />
                      {(e.label || e.condition) && (
                        <g>
                          <rect
                            x={(x1 + x2) / 2 - 30}
                            y={(y1 + y2) / 2 - 10}
                            width={60}
                            height={20}
                            rx={4}
                            fill="white"
                            stroke="#e2e8f0"
                          />
                          <text
                            x={(x1 + x2) / 2}
                            y={(y1 + y2) / 2 + 4}
                            textAnchor="middle"
                            className="text-[10px] fill-slate-600"
                          >
                            {e.label || e.condition}
                          </text>
                        </g>
                      )}
                    </g>
                  )
                })}
                {connecting && (() => {
                  const src = nodes.find((n) => n.id === connecting.from)
                  if (!src) return null
                  const x1 = src.positionX + NODE_WIDTH
                  const y1 = src.positionY + NODE_HEIGHT - 20
                  const x2 = connecting.mouseX + NODE_WIDTH / 2
                  const y2 = connecting.mouseY + 10
                  const dx = Math.abs(x2 - x1) * 0.5 + 40
                  return (
                    <path
                      d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
                      stroke="#16a34a"
                      strokeWidth={2}
                      strokeDasharray="5,3"
                      fill="none"
                    />
                  )
                })()}
              </svg>

              {/* Nodes */}
              {nodes.map((n) => (
                <FlowNode
                  key={n.id}
                  node={n}
                  selected={selectedNode === n.id}
                  onMouseDown={(e) => onNodeMouseDown(e, n)}
                  onDoubleClick={() => onNodeDoubleClick(n)}
                  onOutputHandleMouseDown={(e) => onOutputHandleMouseDown(e, n.id)}
                  onMouseUp={(e) => onNodeMouseUp(e, n.id)}
                  onDelete={() => handleDeleteNode(n.id)}
                  onSetStart={() => handleSetStart(n.id)}
                />
              ))}
            </div>
          </div>

          {/* Empty state */}
          {!loading && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-muted-foreground">
                <MousePointer2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Click a step on the left to start building</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        {selectedNode && (
          <NodeEditDialog
            node={nodes.find((n) => n.id === selectedNode)}
            onSave={handleSaveNode}
          />
        )}
      </Dialog>
    </div>
  )
}

function FlowNode({
  node,
  selected,
  onMouseDown,
  onDoubleClick,
  onOutputHandleMouseDown,
  onMouseUp,
  onDelete,
  onSetStart,
}: any) {
  const meta = NODE_TYPES.find((t) => t.type === node.type)!
  const Icon = meta.icon
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onDoubleClick={onDoubleClick}
      className={cn(
        'absolute bg-white rounded-lg shadow-md border-2 cursor-grab active:cursor-grabbing transition-shadow',
        selected ? 'border-emerald-500 shadow-lg' : 'border-slate-200 hover:shadow-md'
      )}
      style={{
        left: node.positionX,
        top: node.positionY,
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
      }}
    >
      {/* Input handle */}
      {node.type !== 'start' && (
        <div
          className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-white border-2 border-slate-300 hover:border-emerald-500 hover:scale-110 transition-all"
          title="Drop a connection here"
        />
      )}

      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="h-6 w-6 rounded-md flex items-center justify-center text-white shrink-0"
            style={{ background: meta.color }}
          >
            <Icon className="h-3 w-3" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{node.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{meta.label}</p>
          </div>
          {node.isStart && (
            <Badge className="text-[9px] py-0 px-1 h-4 bg-emerald-100 text-emerald-700 border-emerald-200">
              START
            </Badge>
          )}
        </div>
        <NodePreview node={node} />
      </div>

      {/* Output handle */}
      {node.type !== 'end' && (
        <div
          onMouseDown={onOutputHandleMouseDown}
          className="absolute -right-2 bottom-3 h-4 w-4 rounded-full bg-slate-600 border-2 border-white hover:bg-emerald-500 hover:scale-110 transition-all cursor-crosshair"
          title="Drag to connect to next step"
        />
      )}

      {/* Selected toolbar */}
      {selected && (
        <div className="absolute -top-9 left-0 flex items-center gap-1 bg-white rounded-md border shadow-md px-1 py-1">
          {!node.isStart && node.type !== 'start' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[10px] px-2 gap-1"
              onClick={(e) => {
                e.stopPropagation()
                onSetStart()
              }}
            >
              <Flag className="h-3 w-3" /> Set Start
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] px-2"
            onClick={(e) => {
              e.stopPropagation()
              onDoubleClick()
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] px-2 text-rose-600 hover:text-rose-700"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

function NodePreview({ node }: { node: any }) {
  const data = node.data || {}
  switch (node.type) {
    case 'start':
      return <p className="text-[10px] text-muted-foreground">Conversation entry point</p>
    case 'message':
      return <p className="text-[10px] text-slate-600 line-clamp-2">{data.message || '—'}</p>
    case 'menu':
      return (
        <p className="text-[10px] text-slate-600 line-clamp-2">
          {data.message || 'Show menu'} · {data.allowOrdering ? 'Allows ordering' : 'View only'}
        </p>
      )
    case 'question':
      return (
        <p className="text-[10px] text-slate-600 line-clamp-2">
          {data.prompt || node.title} · {data.options?.length || 0} options
        </p>
      )
    case 'collect':
      return (
        <p className="text-[10px] text-slate-600 line-clamp-2">
          {data.prompt || 'Collect input'} → {data.variable ? `{{${data.variable}}}` : 'no var'}
        </p>
      )
    case 'branch':
      return (
        <p className="text-[10px] text-slate-600 line-clamp-2">
          Branch on {data.variable ? `{{${data.variable}}}` : '—'}
        </p>
      )
    case 'place_order':
      return <p className="text-[10px] text-slate-600">Create order from cart</p>
    case 'end':
      return <p className="text-[10px] text-slate-600 line-clamp-2">{data.endMessage || 'End conversation'}</p>
    default:
      return null
  }
}

function defaultDataFor(type: string): any {
  switch (type) {
    case 'start':
      return {}
    case 'message':
      return { message: 'Type your message here. Use {{name}} for personalization.' }
    case 'menu':
      return { message: '🛒 Our Menu', showPrices: true, allowOrdering: true, categoryIds: [] }
    case 'question':
      return {
        prompt: 'Choose an option:',
        variable: 'choice',
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
        ],
      }
    case 'collect':
      return { prompt: 'Please enter your response:', variable: 'response' }
    case 'branch':
      return { variable: 'choice' }
    case 'place_order':
      return {}
    case 'end':
      return { endMessage: 'Thank you! 🙏' }
    default:
      return {}
  }
}

function NodeEditDialog({ node, onSave }: { node: any; onSave: (data: any) => void }) {
  const [title, setTitle] = useState(node.title)
  const [data, setData] = useState<any>(node.data || {})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      setTitle(node.title)
      setData(node.data || {})
    })
    return () => {
      cancelled = true
    }
  }, [node])

  const submit = async () => {
    setSaving(true)
    await onSave({ title, data })
    setSaving(false)
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit Step: {node.title}</DialogTitle>
        <DialogDescription>Configure how this step behaves</DialogDescription>
      </DialogHeader>
      <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-2">
        <div className="space-y-1.5">
          <Label>Step Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <NodeEditor node={node} data={data} setData={setData} />
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" /> Save Step
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function NodeEditor({ node, data, setData }: { node: any; data: any; setData: (d: any) => void }) {
  const update = (k: string, v: any) => setData({ ...data, [k]: v })

  switch (node.type) {
    case 'message':
      return (
        <div className="space-y-1.5">
          <Label>Message Text</Label>
          <Textarea
            value={data.message || ''}
            onChange={(e) => update('message', e.target.value)}
            rows={4}
            placeholder="Hi {{name}}! How can I help you today?"
          />
          <p className="text-xs text-muted-foreground">
            Use placeholders like {`{{name}}`}, {`{{phone}}`}, {`{{address}}`} to personalize.
          </p>
        </div>
      )

    case 'menu':
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Header Message</Label>
            <Input
              value={data.message || ''}
              onChange={(e) => update('message', e.target.value)}
              placeholder="🛒 Our Menu"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-prices"
              checked={data.showPrices !== false}
              onCheckedChange={(c) => update('showPrices', c)}
            />
            <Label htmlFor="show-prices" className="text-sm cursor-pointer">
              Show prices in menu
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="allow-order"
              checked={data.allowOrdering !== false}
              onCheckedChange={(c) => update('allowOrdering', c)}
            />
            <Label htmlFor="allow-order" className="text-sm cursor-pointer">
              Allow ordering from this menu
            </Label>
          </div>
        </div>
      )

    case 'question':
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Question / Prompt</Label>
            <Textarea
              value={data.prompt || ''}
              onChange={(e) => update('prompt', e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Save answer to variable</Label>
            <Input
              value={data.variable || ''}
              onChange={(e) => update('variable', e.target.value)}
              placeholder="e.g. mainChoice"
            />
            <p className="text-xs text-muted-foreground">
              Use this variable in branch nodes to route the conversation.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  update('options', [
                    ...(data.options || []),
                    { label: '', value: `opt_${(data.options || []).length + 1}` },
                  ])
                }
              >
                <Plus className="h-3 w-3" /> Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {(data.options || []).map((o: any, i: number) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    value={o.label}
                    onChange={(e) => {
                      const next = [...data.options]
                      next[i] = { ...o, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') }
                      update('options', next)
                    }}
                    placeholder={`Option ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-600"
                    onClick={() => update('options', data.options.filter((_: any, j: number) => j !== i))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: After saving, drag from the bottom-right of this step to connect each option to its next step. Then edit the connection to set the condition label.
            </p>
          </div>
        </div>
      )

    case 'collect':
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Prompt</Label>
            <Textarea
              value={data.prompt || ''}
              onChange={(e) => update('prompt', e.target.value)}
              rows={2}
              placeholder="📍 Please share your delivery address"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Save to variable</Label>
            <Input
              value={data.variable || ''}
              onChange={(e) => update('variable', e.target.value)}
              placeholder="e.g. address"
            />
          </div>
        </div>
      )

    case 'branch':
      return (
        <div className="space-y-1.5">
          <Label>Variable to check</Label>
          <Input
            value={data.variable || ''}
            onChange={(e) => update('variable', e.target.value)}
            placeholder="e.g. mainChoice"
          />
          <p className="text-xs text-muted-foreground">
            Connect each outgoing edge and set its condition to match the variable&apos;s value.
          </p>
        </div>
      )

    case 'end':
      return (
        <div className="space-y-1.5">
          <Label>Closing Message</Label>
          <Textarea
            value={data.endMessage || ''}
            onChange={(e) => update('endMessage', e.target.value)}
            rows={3}
            placeholder="Thank you! 🙏"
          />
        </div>
      )

    case 'place_order':
      return (
        <p className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-md">
          This step takes everything in the customer&apos;s cart and creates an order. Make sure
          customers have visited a Menu step with ordering enabled before this step.
        </p>
      )

    default:
      return null
  }
}
