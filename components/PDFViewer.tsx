"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Minus, Plus, RotateCcw, RotateCw, Download as DownloadIcon } from "lucide-react"

type PDFViewerProps = {
  variant?: "compact" | "full"
  title?: string
  src?: string
}

export function PDFViewer({
  variant = "full",
  title = "Carbon Credit Documentation",
  src = "/BlueLog-1.pdf",
}: PDFViewerProps) {
  // Dynamically import react-pdf and its CSS only on the client to avoid
  // server-side evaluation of DOM APIs (DOMMatrix) which causes runtime
  // errors when node tries to require pdfjs-dist.
  const [ReactPdf, setReactPdf] = useState<{
    Document?: any
    Page?: any
    pdfjs?: any
  } | null>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        // Dynamically import the library and styles only in the browser
        const mod = await import('react-pdf')
        await import('react-pdf/dist/Page/AnnotationLayer.css')
        await import('react-pdf/dist/Page/TextLayer.css')

        if (!mounted) return

        // Configure the worker using the pdfjs export from react-pdf
        try {
          mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`
        } catch (err) {
          // ignore worker configuration failures
        }

        setReactPdf({ Document: mod.Document, Page: mod.Page, pdfjs: mod.pdfjs })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to dynamically load react-pdf:', err)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const [numPages, setNumPages] = useState<number>(0)
  const [scale, setScale] = useState<number>(variant === "full" ? 1.5 : 1.0)
  const [rotation, setRotation] = useState<number>(0)
  const [isPresenting, setIsPresenting] = useState<boolean>(false)

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        document.documentElement.requestFullscreen()
      } else if (e.key === 'Escape' && isPresenting) {
        setIsPresenting(false)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPresenting])

  const containerClasses = useMemo(
    () =>
      variant === "full"
        ? "max-w-none w-full"
        : "w-full max-w-7xl mx-auto",
    [variant]
  )

  const frameHeightClass = variant === "full" ? "h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]" : "h-[32rem]"

  const Controls = (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
      <div className="pointer-events-auto z-30 flex items-center gap-2 rounded-full border border-border bg-background/90 px-2.5 py-1.5 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-muted-foreground">{numPages} pages</span>
        <div className="mx-1 h-5 w-px bg-border" />
        {/* Zoom controls */}
        <Button variant="ghost" size="sm" onClick={() => setScale((s) => Math.min(s + 0.1, 3))}>
          <Plus className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setScale((s) => Math.max(s - 0.1, 0.5))}>
          <Minus className="size-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        {/* Rotation controls */}
        <Button variant="ghost" size="sm" onClick={() => setRotation((r) => (r + 90) % 360)}>
          <RotateCw className="size-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setRotation((r) => (r + 270) % 360)}>
          <RotateCcw className="size-4" />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        {/* Presentation mode & Download */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setIsPresenting(true)
            document.documentElement.requestFullscreen()
          }}
        >
          Present
        </Button>
        <Button asChild variant="outline" size="sm" className="border-blue-200 dark:border-blue-900">
          <a href={src} download>
            <DownloadIcon className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  )

  const pdfContent = (
    <div className={`relative ${frameHeightClass} group`}>
      {/* Scrollable area */}
      <div className="absolute inset-0 overflow-auto">
        {!ReactPdf ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading PDF…</div>
        ) : (
          <ReactPdf.Document
            file={src}
            onLoadSuccess={({ numPages: n }: { numPages: number }) => {
              setNumPages(n)
            }}
            onLoadError={(err: any) => {
              // eslint-disable-next-line no-console
              console.error('PDF load error:', err)
            }}
            loading={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading PDF…</div>}
            error={<div className="flex h-full items-center justify-center text-sm text-destructive">Failed to load PDF</div>}
            options={{}}
          >
            <div className="flex flex-col items-center gap-6 py-6">
              {Array.from({ length: numPages }).map((_, pageIndex) => (
                <ReactPdf.Page
                  key={`page_${pageIndex + 1}`}
                  pageNumber={pageIndex + 1}
                  scale={scale}
                  rotate={rotation}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              ))}
            </div>
          </ReactPdf.Document>
        )}
      </div>
      {/* Floating controls overlay (outside scroll area) */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {Controls}
      </div>
    </div>
  )

  if (variant === "full") {
    // Borderless, seamless full-viewport experience
    return (
      <div className={`${containerClasses}`}>
        {pdfContent}
      </div>
    )
  }

  // Compact variant with subtle title, borderless content
  return (
    <Card className={containerClasses}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            {title}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm" className="hover:scale-105">
              <a href={src} target="_blank" rel="noreferrer">Open</a>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-blue-200 dark:border-blue-900">
              <a href={src} download>Download</a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`w-full overflow-hidden rounded-lg bg-transparent`}>{pdfContent}</div>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Interactive PDF viewer - Learn about carbon credit processes and regulations
        </p>
      </CardContent>
    </Card>
  )
}
