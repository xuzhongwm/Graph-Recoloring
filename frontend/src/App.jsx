import { useState, useCallback, useEffect } from 'react'
import Board from './components/Board'
import SideBar from './components/SideBar'
import { COLORS } from './colors'
import './index.css'

let nodeIdCounter = 1
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

function colorName(hex) {
  if (!hex) return 'Uncolored'
  return COLORS.find(c => c.value === hex)?.name ?? hex
}

export default function App() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [mode, setMode] = useState('addNode')
  const [edgeStart, setEdgeStart] = useState(null)
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
  const [log, setLog] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [sessionStart, setSessionStart] = useState(null)
  const [sessionEndTime, setSessionEndTime] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const handleSetMode = useCallback(newMode => {
    setMode(newMode)
    setEdgeStart(null)
  }, [])

  const addNode = useCallback((x, y) => {
    const id = nodeIdCounter++
    setNodes(prev => [...prev, { id, x, y, color: null }])
  }, [])

  const addEdge = useCallback((fromId, toId) => {
    if (fromId === toId) return
    const id = edgeIdCounter++
    setEdges(prev => {
      const dup = prev.some(
        e => (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
      )
      return dup ? prev : [...prev, { id, from: fromId, to: toId }]
    })
  }, [])

  const colorNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || node.color === selectedColor) return
    const oldColor = node.color
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, color: selectedColor } : n)
    const { valid, reason } = checkProperColoring(newNodes, edges)
    setNodes(newNodes)
    if (isRecording) {
      setLog(prev => [...prev, {
        step: prev.length + 1,
        nodeId,
        fromColor: oldColor,
        toColor: selectedColor,
        isValid: valid,
        reason,
      }])
    }
  }, [nodes, edges, selectedColor, isRecording])

  const moveNode = useCallback((nodeId, x, y) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x, y } : n))
  }, [])

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
    setIsRecording(false)
    setSessionStart(null)
    setSessionEndTime(null)
    setEdgeStart(null)
    nodeIdCounter = 1
    edgeIdCounter = 0
  }, [])

  const clearLog = useCallback(() => setLog([]), [])

  const startRecording = useCallback(() => {
    const status = checkProperColoring(nodes, edges)
    if (!status.valid) return
    setLog([])
    setSessionEndTime(null)
    setSessionStart({
      time: new Date(),
      colorDesc: status.reason,
      nodes: nodes.map(n => ({ id: n.id, color: n.color })),
      edges: edges.map(e => ({ from: e.from, to: e.to })),
    })
    setIsRecording(true)
  }, [nodes, edges])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    setSessionEndTime(new Date())
  }, [])

  const saveLog = useCallback(() => {
    if (!sessionStart) return
    const endTime = sessionEndTime ?? new Date()

    const pad = n => String(n).padStart(2, '0')
    const fmtTime = d =>
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    const fmtDate = d =>
      d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

    const DIV = '═'.repeat(52)
    const HR  = '─'.repeat(52)

    const finalStatus = checkProperColoring(nodes, edges)
    const validCount   = log.filter(e => e.isValid).length
    const invalidCount = log.length - validCount

    const lines = [
      DIV,
      '  Graph Recoloring Session',
      `  ${fmtDate(sessionStart.time)}`,
      DIV,
      '',
      'INITIAL STATE',
      HR,
      `Time     : ${fmtTime(sessionStart.time)}`,
      `Coloring : ${sessionStart.colorDesc}`,
      `Nodes    : ${sessionStart.nodes.map(n => `v${n.id}(${colorName(n.color)})`).join('  ')}`,
      `Edges    : ${sessionStart.edges.length > 0
        ? sessionStart.edges.map(e => `v${e.from}–v${e.to}`).join('  ')
        : '(none)'}`,
      '',
      'RECOLORING SEQUENCE',
      HR,
    ]

    if (log.length === 0) {
      lines.push('  (no color changes recorded)')
    } else {
      log.forEach(e => {
        const from = colorName(e.fromColor).padEnd(10)
        const to   = colorName(e.toColor).padEnd(10)
        const mark = e.isValid ? '✓ Valid  ' : '✗ Invalid'
        const note = e.isValid ? e.reason : `  ← ${e.reason}`
        lines.push(`  #${String(e.step).padStart(2)}  v${e.nodeId}  ${from}→ ${to} ${mark}${note}`)
      })
    }

    lines.push(
      '',
      'FINAL STATE',
      HR,
      `Time     : ${fmtTime(endTime)}`,
      `Coloring : ${finalStatus.reason}`,
      `Nodes    : ${nodes.map(n => `v${n.id}(${colorName(n.color)})`).join('  ')}`,
      '',
      `Total steps: ${log.length}  |  Valid: ${validCount}  |  Invalid: ${invalidCount}`,
      DIV,
    )

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recoloring-${sessionStart.time.toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [sessionStart, sessionEndTime, log, nodes, edges])

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
        isValid={coloringStatus.valid}
        validityReason={coloringStatus.reason}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        colorCount={new Set(nodes.map(n => n.color).filter(Boolean)).size}
        clearGraph={clearGraph}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        saveLog={saveLog}
        theme={theme}
        toggleTheme={toggleTheme}
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
        moveNode={moveNode}
        theme={theme}
      />
    </div>
  )
}
