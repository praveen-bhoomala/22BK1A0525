import { useRef, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import './App.css'
import { FiPenTool, FiScissors, FiMinus, FiSquare, FiCircle, FiType, FiRotateCcw, FiRotateCw, FiTrash2, FiDownload } from 'react-icons/fi'

export type Tool = 'pen' | 'eraser' | 'line' | 'rect' | 'ellipse' | 'text'

function Toolbar(props: {
  currentTool: Tool
  onToolChange: (t: Tool) => void
  strokeColor: string
  onStrokeColorChange: (c: string) => void
  strokeWidth: number
  onStrokeWidthChange: (w: number) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onExport: () => void
}) {
  const ToolButton = ({
    tool,
    icon,
    label,
  }: { tool: Tool; icon: ReactNode; label: string }) => (
    <button
      aria-label={label}
      onClick={() => props.onToolChange(tool)}
      className={`p-2 rounded-md border text-gray-700 hover:bg-gray-100 active:scale-[0.98] ${
        props.currentTool === tool ? 'bg-white shadow-sm border-blue-500 text-blue-600' : 'bg-white border-gray-200'
      }`}
    >
      {icon}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-white/80 backdrop-blur sticky top-0 border-b">
      <div className="flex items-center gap-2">
        <ToolButton tool="pen" icon={<FiPenTool />} label="Pen" />
        <ToolButton tool="eraser" icon={<FiScissors />} label="Eraser" />
        <ToolButton tool="line" icon={<FiMinus />} label="Line" />
        <ToolButton tool="rect" icon={<FiSquare />} label="Rectangle" />
        <ToolButton tool="ellipse" icon={<FiCircle />} label="Ellipse" />
        <ToolButton tool="text" icon={<FiType />} label="Text" />
      </div>

      <div className="h-6 w-px bg-gray-200 mx-1" />

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={props.strokeColor}
          onChange={(e) => props.onStrokeColorChange(e.target.value)}
          className="h-9 w-9 rounded-md border p-1"
          title="Stroke color"
        />
        <input
          type="range"
          min={1}
          max={30}
          value={props.strokeWidth}
          onChange={(e) => props.onStrokeWidthChange(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-sm text-gray-600 w-10">{props.strokeWidth}px</span>
      </div>

      <div className="h-6 w-px bg-gray-200 mx-1" />

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={props.onUndo}
          disabled={!props.canUndo}
          className="p-2 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Undo"
        >
          <FiRotateCcw />
        </button>
        <button
          onClick={props.onRedo}
          disabled={!props.canRedo}
          className="p-2 rounded-md border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Redo"
        >
          <FiRotateCw />
        </button>
        <button
          onClick={props.onClear}
          className="p-2 rounded-md border bg-white hover:bg-gray-100"
          aria-label="Clear"
        >
          <FiTrash2 />
        </button>
        <button
          onClick={props.onExport}
          className="p-2 rounded-md border bg-blue-600 text-white hover:bg-blue-700"
          aria-label="Export"
        >
          <FiDownload />
        </button>
      </div>
    </div>
  )
}

function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const [currentTool, setCurrentTool] = useState<Tool>('pen')
  const [strokeColor, setStrokeColor] = useState<string>('#111827')
  const [strokeWidth, setStrokeWidth] = useState<number>(4)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [history, setHistory] = useState<ImageData[]>([])
  const [future, setFuture] = useState<ImageData[]>([])

  useEffect(() => {
    const canvas = canvasRef.current!
    const overlay = overlayRef.current!
    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const bounds = canvas.parentElement!.getBoundingClientRect()

      for (const c of [canvas, overlay]) {
        c.width = Math.floor(bounds.width * dpr)
        c.height = Math.floor(bounds.height * dpr)
        c.style.width = bounds.width + 'px'
        c.style.height = bounds.height + 'px'
        const ctx = c.getContext('2d')!
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const pushHistory = () => {
    const ctx = canvasRef.current!.getContext('2d')!
    const snapshot = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    setHistory((h) => [...h, snapshot])
    setFuture([])
  }

  const beginDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e)
    setIsDrawing(true)
    setStartPoint(pos)

    if (currentTool === 'pen' || currentTool === 'eraser') {
      pushHistory()
      const ctx = canvasRef.current!.getContext('2d')!
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = strokeWidth
      ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : strokeColor
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const pos = getPos(e)

    if (currentTool === 'pen' || currentTool === 'eraser') {
      const ctx = canvasRef.current!.getContext('2d')!
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      return
    }

    if (!startPoint) return

    // For shape preview, draw on overlay
    const overlayCtx = overlayRef.current!.getContext('2d')!
    overlayCtx.clearRect(0, 0, overlayRef.current!.width, overlayRef.current!.height)
    overlayCtx.lineWidth = strokeWidth
    overlayCtx.strokeStyle = strokeColor

    const w = pos.x - startPoint.x
    const h = pos.y - startPoint.y

    if (currentTool === 'line') {
      overlayCtx.beginPath()
      overlayCtx.moveTo(startPoint.x, startPoint.y)
      overlayCtx.lineTo(pos.x, pos.y)
      overlayCtx.stroke()
    }
    if (currentTool === 'rect') {
      overlayCtx.strokeRect(startPoint.x, startPoint.y, w, h)
    }
    if (currentTool === 'ellipse') {
      overlayCtx.beginPath()
      overlayCtx.ellipse(
        startPoint.x + w / 2,
        startPoint.y + h / 2,
        Math.abs(w) / 2,
        Math.abs(h) / 2,
        0,
        0,
        Math.PI * 2
      )
      overlayCtx.stroke()
    }
  }

  const endDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (currentTool === 'pen' || currentTool === 'eraser') {
      const ctx = canvasRef.current!.getContext('2d')!
      ctx.closePath()
      return
    }

    if (!startPoint) return

    pushHistory()

    const pos = getPos(e)
    const ctx = canvasRef.current!.getContext('2d')!
    const overlayCtx = overlayRef.current!.getContext('2d')!
    overlayCtx.clearRect(0, 0, overlayRef.current!.width, overlayRef.current!.height)

    ctx.lineWidth = strokeWidth
    ctx.strokeStyle = strokeColor

    const w = pos.x - startPoint.x
    const h = pos.y - startPoint.y

    if (currentTool === 'line') {
      ctx.beginPath()
      ctx.moveTo(startPoint.x, startPoint.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    if (currentTool === 'rect') {
      ctx.strokeRect(startPoint.x, startPoint.y, w, h)
    }
    if (currentTool === 'ellipse') {
      ctx.beginPath()
      ctx.ellipse(
        startPoint.x + w / 2,
        startPoint.y + h / 2,
        Math.abs(w) / 2,
        Math.abs(h) / 2,
        0,
        0,
        Math.PI * 2
      )
      ctx.stroke()
    }

    if (currentTool === 'text') {
      const text = prompt('Enter text')
      if (text && text.trim()) {
        ctx.fillStyle = strokeColor
        ctx.font = `${Math.max(12, strokeWidth * 6)}px ui-sans-serif, system-ui, -apple-system`
        ctx.fillText(text, pos.x, pos.y)
      }
    }

    setStartPoint(null)
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const ctx = canvasRef.current!.getContext('2d')!
    const current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setFuture((f) => [...f, current])
    ctx.putImageData(prev, 0, 0)
  }

  const handleRedo = () => {
    if (future.length === 0) return
    const ctx = canvasRef.current!.getContext('2d')!
    const current = ctx.getImageData(0, 0, canvasRef.current!.width, canvasRef.current!.height)
    const next = future[future.length - 1]
    setFuture((f) => f.slice(0, -1))
    setHistory((h) => [...h, current])
    ctx.putImageData(next, 0, 0)
  }

  const handleClear = () => {
    pushHistory()
    const ctx = canvasRef.current!.getContext('2d')!
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
  }

  const handleExport = () => {
    const dataUrl = canvasRef.current!.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `whiteboard-${Date.now()}.png`
    a.click()
  }

  return (
    <div className="h-full flex flex-col">
      <Toolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        strokeColor={strokeColor}
        onStrokeColorChange={setStrokeColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
      />

      <div className="flex-1 p-4">
        <div className="h-full rounded-lg border bg-white shadow-sm relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 touch-none"
            onMouseDown={beginDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
          />
          <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none" />
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Whiteboard />
    </div>
  )
}
