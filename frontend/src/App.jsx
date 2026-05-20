import { useState, useCallback, useEffect } from 'react'
import Board from './components/Board'
import SideBar from './components/SideBar'
import { COLORS } from './colors'
import './index.css'

let nodeIdCounter = 0
let edgeIdCounter = 0

function checkProperColoring(nodes, edges) {
  if (nodes.length === 0) return { valid: false, reason: 'No nodes' }
  for (const node of nodes) {
    if (!node.color) return { valid: false, reason: 'Uncolored nodes exist' }
  }
  for (const edge of edges) {
    const a = nodes.find(n => n.id === edge.from)
    const b = nodes.find(n => n.id === edge.to)
    if (a && b && a.color === b.color) {
      return { valid: false, reason: `v${a.id} and v${b.id} share a color` }
    }
  }
  const k = new Set(nodes.map(n => n.color)).size
  return { valid: true, reason: `Valid proper ${k}-coloring` }
}

export default function App() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [mode, setMode] = useState('addNode')
  const [edgeStart, setEdgeStart] = useState(null)
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
  const [log, setLog] = useState([])

  // Reset edge-in-progress whenever the active tool changes
  const handleSetMode = useCallback(newMode => {
    setMode(newMode)
    setEdgeStart(null)
  }, [])

  const addNode = useCallback((x, y) => {
    setNodes(prev => [...prev, { id: nodeIdCounter++, x, y, color: null }])
  }, [])

  const addEdge = useCallback((fromId, toId) => {
    if (fromId === toId) return
    setEdges(prev => {
      const dup = prev.some(
        e => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
      )
      return dup ? prev : [...prev, { id: edgeIdCounter++, from: fromId, to: toId }]
    })
  }, [])

  const colorNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || node.color === selectedColor) return
    const oldColor = node.color
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, color: selectedColor } : n)
    const { valid } = checkProperColoring(newNodes, edges)
    setNodes(newNodes)
    setLog(prev => [...prev, {
      type: 'change',
      step: prev.filter(e => e.type === 'change').length + 1,
      nodeId,
      fromColor: oldColor,
      toColor: selectedColor,
      isValid: valid,
    }])
  }, [nodes, edges, selectedColor])

  const deleteNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId))
  }, [])

  const deleteEdge = useCallback((edgeId) => {
    setEdges(prev => prev.filter(e => e.id !== edgeId))
  }, [])

  const clearGraph = useCallback(() => {
    setNodes([])
    setEdges([])
    setLog([])
    setEdgeStart(null)
    nodeIdCounter = 0
    edgeIdCounter = 0
  }, [])

  const clearLog = useCallback(() => setLog([]), [])

  const saveCheckpoint = useCallback(() => {
    const { valid, reason } = checkProperColoring(nodes, edges)
    setLog(prev => [...prev, {
      type: 'checkpoint',
      valid,
      reason,
    }])
  }, [nodes, edges])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const map = { a: 'addNode', e: 'addEdge', c: 'colorNode', d: 'delete' }
      if (map[e.key.toLowerCase()]) handleSetMode(map[e.key.toLowerCase()])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSetMode])

  const coloringStatus = checkProperColoring(nodes, edges)

  return (
    <div id="app">
      <SideBar
        mode={mode}
        setMode={handleSetMode}
        selectedColor={selectedColor}
        setSelectedColor={setSelectedColor}
        log={log}
        clearLog={clearLog}
        saveCheckpoint={saveCheckpoint}
        isValid={coloringStatus.valid}
        validityReason={coloringStatus.reason}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        colorCount={new Set(nodes.map(n => n.color).filter(Boolean)).size}
        clearGraph={clearGraph}
      />
      <Board
        nodes={nodes}
        edges={edges}
        mode={mode}
        edgeStart={edgeStart}
        setEdgeStart={setEdgeStart}
        selectedColor={selectedColor}
        addNode={addNode}
        addEdge={addEdge}
        colorNode={colorNode}
        deleteNode={deleteNode}
        deleteEdge={deleteEdge}
      />
    </div>
  )
}
