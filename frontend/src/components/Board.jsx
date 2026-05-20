import { useRef, useEffect, useState, useCallback } from 'react'

const NODE_RADIUS = 26
const EDGE_HIT = 8
const DRAG_THRESHOLD = 4
const UNCOLORED = '#4a5568'

const DRAW_THEME = {
  light: {
    dotGrid:         'rgba(0, 0, 0, 0.05)',
    edge:            'rgba(0, 0, 0, 0.22)',
    edgeHover:       '#e53e3e',
    edgeDash:        'rgba(0, 0, 0, 0.35)',
    nodeStroke:      'rgba(0, 0, 0, 0.18)',
    nodeStrokeHover: 'rgba(0, 0, 0, 0.55)',
    nodeStrokeStart: '#1a1a1a',
    cursorStroke:    'rgba(0, 0, 0, 0.3)',
  },
  dark: {
    dotGrid:         'rgba(255, 255, 255, 0.04)',
    edge:            'rgba(255, 255, 255, 0.28)',
    edgeHover:       '#ff6b6b',
    edgeDash:        'rgba(255, 255, 255, 0.45)',
    nodeStroke:      'rgba(255, 255, 255, 0.3)',
    nodeStrokeHover: 'rgba(255, 255, 255, 0.8)',
    nodeStrokeStart: '#ffffff',
    cursorStroke:    'rgba(255, 255, 255, 0.4)',
  },
}

function contrastColor(hex) {
  if (!hex) return '#e2e8f0'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1a1a1a' : '#ffffff'
}

function distToSegment(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

function getNodeAt(nodes, x, y) {
  return nodes.find(n => Math.hypot(n.x - x, n.y - y) <= NODE_RADIUS)
}

function drawScene(canvas, { nodes, edges, edgeStart, hoverNode, hoverEdge, mousePos, mode, selectedColor, theme }) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)
  const t = DRAW_THEME[theme] || DRAW_THEME.light

  ctx.fillStyle = t.dotGrid
  for (let x = 0; x < width; x += 32) {
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  for (const edge of edges) {
    const a = nodes.find(n => n.id === edge.from)
    const b = nodes.find(n => n.id === edge.to)
    if (!a || !b) continue
    const hov = hoverEdge?.id === edge.id
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.strokeStyle = hov ? t.edgeHover : t.edge
    ctx.lineWidth = hov ? 5 : 3
    ctx.stroke()
  }

  if (edgeStart !== null && mousePos) {
    const src = nodes.find(n => n.id === edgeStart)
    if (src) {
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = t.edgeDash
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(mousePos.x, mousePos.y)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  for (const node of nodes) {
    const isEdgeStart = node.id === edgeStart
    const isHov = hoverNode?.id === node.id
    const fill = node.color || UNCOLORED

    if (isHov || isEdgeStart) {
      ctx.shadowColor = fill
      ctx.shadowBlur = isEdgeStart ? 22 : 14
    }

    ctx.beginPath()
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = isEdgeStart
      ? t.nodeStrokeStart
      : isHov ? t.nodeStrokeHover : t.nodeStroke
    ctx.lineWidth = isEdgeStart ? 3.5 : isHov ? 3 : 1.5
    ctx.stroke()

    ctx.fillStyle = contrastColor(node.color)
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(node.id), node.x, node.y)
  }

  if (mode === 'colorNode' && mousePos && !hoverNode) {
    ctx.beginPath()
    ctx.arc(mousePos.x, mousePos.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = selectedColor
    ctx.fill()
    ctx.strokeStyle = t.cursorStroke
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

export default function Board({
  nodes, edges, mode, edgeStart, setEdgeStart, selectedColor, theme,
  addNode, addEdge, colorNode, deleteNode, deleteEdge, moveNode,
}) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const [hoverNode, setHoverNode] = useState(null)
  const [hoverEdge, setHoverEdge] = useState(null)
  const [mousePos, setMousePos] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [canvasDims, setCanvasDims] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      canvas.width = width
      canvas.height = height
      setCanvasDims({ width, height })
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvasDims.width) return
    drawScene(canvas, { nodes, edges, edgeStart, hoverNode, hoverEdge, mousePos, mode, selectedColor, theme })
  }, [nodes, edges, edgeStart, hoverNode, hoverEdge, mousePos, mode, selectedColor, canvasDims, theme])

  const getPos = useCallback(e => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const nearestEdge = useCallback((pos) => {
    if (mode !== 'delete') return null
    let best = null, bestDist = EDGE_HIT
    for (const edge of edges) {
      const a = nodes.find(n => n.id === edge.from)
      const b = nodes.find(n => n.id === edge.to)
      if (!a || !b) continue
      const d = distToSegment(pos, a, b)
      if (d < bestDist) { bestDist = d; best = edge }
    }
    return best
  }, [mode, nodes, edges])

  const handlePointerDown = useCallback(e => {
    if (e.button !== 0) return
    canvasRef.current.setPointerCapture(e.pointerId)
    const pos = getPos(e)
    const node = getNodeAt(nodes, pos.x, pos.y)
    dragRef.current = {
      nodeId: node != null ? node.id : null,
      startPos: pos,
      offsetX: node ? pos.x - node.x : 0,
      offsetY: node ? pos.y - node.y : 0,
      dragged: false,
    }
  }, [nodes, getPos])

  const handlePointerMove = useCallback(e => {
    const pos = getPos(e)
    setMousePos(pos)

    if (dragRef.current?.nodeId != null) {
      const d = Math.hypot(pos.x - dragRef.current.startPos.x, pos.y - dragRef.current.startPos.y)
      if (d > DRAG_THRESHOLD) {
        if (!dragRef.current.dragged) {
          dragRef.current.dragged = true
          setIsDragging(true)
        }
        moveNode(dragRef.current.nodeId, pos.x - dragRef.current.offsetX, pos.y - dragRef.current.offsetY)
        setHoverNode(null)
        setHoverEdge(null)
        return
      }
    }

    setHoverNode(getNodeAt(nodes, pos.x, pos.y) || null)
    setHoverEdge(nearestEdge(pos))
  }, [nodes, getPos, nearestEdge, moveNode])

  const handlePointerUp = useCallback(e => {
    if (!dragRef.current) return
    const drag = dragRef.current
    dragRef.current = null
    setIsDragging(false)

    const pos = getPos(e)
    setHoverNode(getNodeAt(nodes, pos.x, pos.y) || null)
    setHoverEdge(nearestEdge(pos))

    if (drag.dragged) return

    const clicked = getNodeAt(nodes, pos.x, pos.y)

    switch (mode) {
      case 'addNode':
        if (!clicked) addNode(pos.x, pos.y)
        break
      case 'addEdge':
        if (clicked) {
          if (edgeStart === null) {
            setEdgeStart(clicked.id)
          } else {
            addEdge(edgeStart, clicked.id)
            setEdgeStart(null)
          }
        } else {
          setEdgeStart(null)
        }
        break
      case 'colorNode':
        if (clicked) colorNode(clicked.id)
        break
      case 'delete':
        if (clicked) {
          deleteNode(clicked.id)
          setHoverNode(null)
        } else {
          const edge = nearestEdge(pos)
          if (edge) { deleteEdge(edge.id); setHoverEdge(null) }
        }
        break
    }
  }, [nodes, mode, edgeStart, setEdgeStart, addNode, addEdge, colorNode, deleteNode, deleteEdge, getPos, nearestEdge])

  const handlePointerCancel = useCallback(() => {
    dragRef.current = null
    setIsDragging(false)
    setHoverNode(null)
    setHoverEdge(null)
  }, [])

  const handlePointerLeave = useCallback(() => {
    if (!dragRef.current) {
      setMousePos(null)
      setHoverNode(null)
      setHoverEdge(null)
    }
  }, [])

  const cursor = (() => {
    if (isDragging) return 'grabbing'
    if (mode === 'delete' && (hoverNode || hoverEdge)) return 'pointer'
    if (hoverNode) return 'grab'
    if (mode === 'addNode') return 'crosshair'
    return 'default'
  })()

  return (
    <canvas
      ref={canvasRef}
      className="board"
      style={{ cursor }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
    />
  )
}
