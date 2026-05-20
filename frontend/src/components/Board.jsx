import { useRef, useEffect, useState, useCallback } from 'react'

const NODE_RADIUS = 22
const EDGE_HIT = 8
const UNCOLORED = '#4a5568'

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

function drawScene(canvas, { nodes, edges, edgeStart, hoverNode, hoverEdge, mousePos, mode, selectedColor }) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  // Subtle dot grid
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  for (let x = 0; x < width; x += 32) {
    for (let y = 0; y < height; y += 32) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Edges
  for (const edge of edges) {
    const a = nodes.find(n => n.id === edge.from)
    const b = nodes.find(n => n.id === edge.to)
    if (!a || !b) continue
    const hov = hoverEdge?.id === edge.id
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.strokeStyle = hov ? '#ff6b6b' : 'rgba(255,255,255,0.28)'
    ctx.lineWidth = hov ? 3 : 2
    ctx.stroke()
  }

  // Edge preview while an edge is being drawn
  if (edgeStart !== null && mousePos) {
    const src = nodes.find(n => n.id === edgeStart)
    if (src) {
      ctx.setLineDash([6, 4])
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(src.x, src.y)
      ctx.lineTo(mousePos.x, mousePos.y)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  // Nodes
  for (const node of nodes) {
    const isEdgeStart = node.id === edgeStart
    const isHov = hoverNode?.id === node.id
    const fill = node.color || UNCOLORED

    if (isHov || isEdgeStart) {
      ctx.shadowColor = fill
      ctx.shadowBlur = isEdgeStart ? 20 : 12
    }

    ctx.beginPath()
    ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = isEdgeStart
      ? '#ffffff'
      : isHov ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'
    ctx.lineWidth = isEdgeStart ? 3 : isHov ? 2.5 : 1.5
    ctx.stroke()

    ctx.fillStyle = contrastColor(node.color)
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(node.id), node.x, node.y)
  }

  // Color dot cursor in colorNode mode over empty space
  if (mode === 'colorNode' && mousePos && !hoverNode) {
    ctx.beginPath()
    ctx.arc(mousePos.x, mousePos.y, 5, 0, Math.PI * 2)
    ctx.fillStyle = selectedColor
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

export default function Board({
  nodes, edges, mode, edgeStart, setEdgeStart, selectedColor,
  addNode, addEdge, colorNode, deleteNode, deleteEdge,
}) {
  const canvasRef = useRef(null)
  const [hoverNode, setHoverNode] = useState(null)
  const [hoverEdge, setHoverEdge] = useState(null)
  const [mousePos, setMousePos] = useState(null)
  const [canvasDims, setCanvasDims] = useState({ width: 0, height: 0 })

  // Sync canvas buffer size to element size
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

  // Redraw on any visual state change
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canvasDims.width) return
    drawScene(canvas, { nodes, edges, edgeStart, hoverNode, hoverEdge, mousePos, mode, selectedColor })
  }, [nodes, edges, edgeStart, hoverNode, hoverEdge, mousePos, mode, selectedColor, canvasDims])

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

  const handleClick = useCallback(e => {
    const pos = getPos(e)
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

  const handleMouseMove = useCallback(e => {
    const pos = getPos(e)
    setMousePos(pos)
    setHoverNode(getNodeAt(nodes, pos.x, pos.y) || null)
    setHoverEdge(nearestEdge(pos))
  }, [nodes, getPos, nearestEdge])

  const handleMouseLeave = useCallback(() => {
    setMousePos(null)
    setHoverNode(null)
    setHoverEdge(null)
  }, [])

  const cursor = (() => {
    if (mode === 'delete' && (hoverNode || hoverEdge)) return 'pointer'
    if ((mode === 'colorNode' || mode === 'addEdge') && hoverNode) return 'pointer'
    if (mode === 'addNode' && !hoverNode) return 'crosshair'
    return 'default'
  })()

  return (
    <canvas
      ref={canvasRef}
      className="board"
      style={{ cursor }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  )
}
