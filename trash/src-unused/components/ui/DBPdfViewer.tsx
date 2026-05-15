import React, { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Menu,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCw,
  ExternalLink,
} from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export type StoredPdfDocument = {
  id: string;
  title: string;
  fileUrl: string;
  downloadedFileName?: string;
};

export type LoadDocumentById = (documentId: string) => Promise<StoredPdfDocument | null>;

type DBPdfViewerProps = {
  documentId: string;
  loadDocumentById: LoadDocumentById;
  className?: string;
  initialPage?: number;
  initialScale?: number;
  onBack?: () => void;
  headerActionNode?: React.ReactNode;
  variant?: "full" | "embedded";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatPercent(scale: number) {
  return `${Math.round(scale * 100)}%`;
}

export default function DBPdfViewer({
  documentId,
  loadDocumentById,
  className = "",
  initialPage = 1,
  initialScale = 1,
  onBack,
  headerActionNode,
  variant = "full"
}: DBPdfViewerProps) {
  const [docMeta, setDocMeta] = useState<StoredPdfDocument | null>(null);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [bootError, setBootError] = useState("");

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [scale, setScale] = useState(initialScale);
  const [rotation, setRotation] = useState(0);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mainWidth, setMainWidth] = useState(1000);
  const [mainHeight, setMainHeight] = useState(800);

  const mainViewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setIsBootLoading(true);
      setBootError("");
      setPdfError("");
      setIsPdfLoading(true);
      setNumPages(0);
      setPageNumber(initialPage);
      setPageInput(String(initialPage));

      try {
        const result = await loadDocumentById(documentId);
        if (cancelled) return;

        if (!result) {
          setBootError("문서를 찾을 수 없습니다.");
          setDocMeta(null);
        } else {
          setDocMeta(result);
        }
      } catch (error) {
        if (cancelled) return;
        setBootError(
          error instanceof Error ? error.message : "문서 정보를 불러오지 못했습니다."
        );
        setDocMeta(null);
      } finally {
        if (!cancelled) setIsBootLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [documentId, loadDocumentById, initialPage]);

  useEffect(() => {
    const element = mainViewportRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setMainWidth(Math.max(360, entry.contentRect.width - 48));
      setMainHeight(Math.max(400, entry.contentRect.height - 32));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!docMeta) return;

      if (event.key === "ArrowRight") {
        setPageNumber((prev) => clamp(prev + 1, 1, Math.max(1, numPages)));
      }

      if (event.key === "ArrowLeft") {
        setPageNumber((prev) => clamp(prev - 1, 1, Math.max(1, numPages)));
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "+") {
        event.preventDefault();
        setScale((prev) => clamp(prev + 0.1, 0.5, 3));
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "-") {
        event.preventDefault();
        setScale((prev) => clamp(prev - 0.1, 0.5, 3));
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [docMeta, numPages]);

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);

  const pageWidth = useMemo(() => {
    return Math.floor(Math.min(1200, Math.max(420, mainWidth * scale)));
  }, [mainWidth, scale]);

  const pageHeight = useMemo(() => {
    return Math.floor(Math.max(400, mainHeight * scale));
  }, [mainHeight, scale]);

  const goToPage = (nextPage: number) => {
    setPageNumber(clamp(nextPage, 1, Math.max(1, numPages)));
  };

  const commitPageInput = () => {
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed)) {
      setPageInput(String(pageNumber));
      return;
    }
    goToPage(parsed);
  };

  const handleDocumentLoadSuccess = ({ numPages: loadedPages }: { numPages: number }) => {
    setNumPages(loadedPages);
    setPageNumber((prev) => clamp(prev, 1, loadedPages));
    setPdfError("");
    setIsPdfLoading(false);
  };

  const handleDocumentLoadError = (error: Error) => {
    setPdfError(error.message || "PDF를 불러오지 못했습니다.");
    setIsPdfLoading(false);
  };

  const openOriginal = () => {
    if (!docMeta?.fileUrl) return;
    window.open(docMeta.fileUrl, "_blank", "noopener,noreferrer");
  };

  const downloadOriginal = () => {
    if (!docMeta?.fileUrl) return;

    const link = document.createElement("a");
    link.href = docMeta.fileUrl;
    link.download = docMeta.downloadedFileName || `${docMeta.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`w-full overflow-hidden bg-[#2f3439] z-50 font-sans ${variant === 'full' ? 'fixed inset-0 h-screen' : 'relative h-full'} ${className}`}>
      <div className="flex h-full w-full flex-col">
        {variant === "full" && (
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-black/20 bg-[#2f3439] px-4 text-white shadow-sm">
          <div className="flex min-w-0 items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="rounded-md p-2 transition hover:bg-white/10"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded-md p-2 transition hover:bg-white/10"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="truncate text-lg font-semibold pr-4 border-r border-white/10">
              {docMeta?.title || "PDF Viewer"}
            </div>
            
            {headerActionNode}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={() => goToPage(pageNumber - 1)}
                disabled={pageNumber <= 1 || !docMeta}
                className="rounded-md p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 rounded-md bg-black/20 px-3 py-1.5 text-sm">
                <input
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ""))}
                  onBlur={commitPageInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitPageInput();
                  }}
                  className="w-10 bg-transparent text-right outline-none"
                />
                <span className="text-white/70">/</span>
                <span>{numPages || "-"}</span>
              </div>

              <button
                onClick={() => goToPage(pageNumber + 1)}
                disabled={pageNumber >= numPages || !docMeta}
                className="rounded-md p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mx-2 hidden h-6 w-px bg-white/20 md:block" />

            <button
              onClick={() => setScale((prev) => clamp(prev - 0.1, 0.5, 3))}
              disabled={!docMeta}
              className="rounded-md p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 hidden sm:block"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="min-w-[64px] rounded-md bg-black/20 px-3 py-1.5 text-center text-sm hidden sm:block">
              {formatPercent(scale)}
            </div>

            <button
              onClick={() => setScale((prev) => clamp(prev + 0.1, 0.5, 3))}
              disabled={!docMeta}
              className="rounded-md p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 hidden sm:block"
            >
              <Plus className="h-4 w-4" />
            </button>

            <div className="mx-2 hidden h-6 w-px bg-white/20 md:block" />

            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              disabled={!docMeta}
              className="rounded-md p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 hidden sm:block"
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            <button
              onClick={openOriginal}
              disabled={!docMeta}
              className="rounded-md p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              title="Open original"
            >
              <ExternalLink className="h-4 w-4" />
            </button>

            <button
              onClick={downloadOriginal}
              disabled={!docMeta}
              className="rounded-md p-2 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 hidden sm:block"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </header>
        )}

        <div className="flex min-h-0 flex-1 relative">
          {variant === "full" && (
            <aside
            className={`border-r border-black/20 bg-[#3a4046] transition-all duration-300 absolute md:relative z-20 h-full ${
              sidebarOpen ? "w-[240px] translate-x-0" : "w-[240px] -translate-x-full md:translate-x-0 md:w-0"
            } overflow-hidden`}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-3 text-sm text-white/80">
                <span>Pages</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-md p-1.5 transition hover:bg-white/10"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                {!docMeta || numPages === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-white/50 text-center">
                    페이지 미리보기를<br/>준비 중입니다.
                  </div>
                ) : (
                  <Document
                    file={docMeta.fileUrl}
                    loading=""
                    className="space-y-5"
                  >
                    {Array.from({ length: numPages }, (_, index) => {
                      const thumbPage = index + 1;
                      const isActive = thumbPage === pageNumber;

                      return (
                        <button
                          key={thumbPage}
                          onClick={() => goToPage(thumbPage)}
                          className={`group flex w-full flex-col items-center gap-2 rounded-lg p-2 transition ${
                            isActive ? "bg-[#4a5159]" : "hover:bg-white/5"
                          }`}
                        >
                          <div
                            className={`overflow-hidden rounded-sm border-2 bg-white shadow-lg pointer-events-none ${
                              isActive ? "border-[#8ab4f8]" : "border-transparent"
                            }`}
                          >
                            <Page
                              pageNumber={thumbPage}
                              width={120}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                              rotate={rotation}
                              loading=""
                            />
                          </div>
                          <span className="text-sm text-white/80">{thumbPage}</span>
                        </button>
                      );
                    })}
                  </Document>
                )}
              </div>
            </div>
          </aside>
          )}

          {variant === "full" && !sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute left-3 top-[16px] md:top-[72px] z-20 rounded-md bg-[#2f3439] p-2 text-white shadow-lg transition hover:bg-[#454c53]"
              title="Open sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}

          {variant === "embedded" && docMeta && !isPdfLoading && !pdfError && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white z-50 shadow-2xl border border-white/10 pointer-events-auto">
              <button 
                onClick={() => setScale((prev) => clamp(prev - 0.1, 0.5, 3))} 
                className="p-1.5 hover:bg-white/20 rounded-full transition"
              >
                <Minus className="w-4 h-4"/>
              </button>
              <span className="text-sm font-medium min-w-[3rem] text-center select-none">
                {formatPercent(scale)}
              </span>
              <button 
                onClick={() => setScale((prev) => clamp(prev + 0.1, 0.5, 3))} 
                className="p-1.5 hover:bg-white/20 rounded-full transition"
              >
                <Plus className="w-4 h-4"/>
              </button>
            </div>
          )}

          {variant === "embedded" && docMeta && !isPdfLoading && !pdfError && numPages > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full text-white z-50 shadow-2xl border border-white/10 pointer-events-auto">
              <button 
                onClick={() => goToPage(pageNumber - 1)} 
                disabled={pageNumber <= 1}
                className="p-1 hover:bg-white/20 rounded-full transition disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <span className="text-sm font-medium min-w-[3rem] text-center select-none">
                {pageNumber} <span className="text-white/50 text-xs">/ {numPages}</span>
              </span>
              <button 
                onClick={() => goToPage(pageNumber + 1)} 
                disabled={pageNumber >= numPages}
                className="p-1 hover:bg-white/20 rounded-full transition disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5"/>
              </button>
            </div>
          )}

          <main ref={mainViewportRef} className="min-h-0 flex-1 overflow-auto bg-[#52585e] w-full">
            {isBootLoading ? (
              <div className="flex h-full items-center justify-center text-white">
                <div className="flex items-center gap-3 rounded-xl bg-black/20 px-5 py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  문서 정보를 불러오는 중입니다...
                </div>
              </div>
            ) : bootError ? (
              <div className="flex h-full items-center justify-center p-6">
                <div className="max-w-md rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
                  {bootError}
                </div>
              </div>
            ) : !docMeta ? (
              <div className="flex h-full items-center justify-center p-6">
                <div className="rounded-2xl bg-black/20 px-5 py-4 text-sm text-white/80">
                  표시할 문서가 없습니다.
                </div>
              </div>
            ) : (
              <div className="min-h-full px-2 py-6 sm:px-4 md:px-8 md:py-8">
                {isPdfLoading && (
                  <div className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-black/20 px-4 py-3 text-sm text-white max-w-xs mx-auto">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    PDF 렌더링 중...
                  </div>
                )}

                {pdfError && (
                  <div className="mx-auto mb-4 max-w-xl rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {pdfError}
                  </div>
                )}

                <div className="mx-auto flex justify-center">
                  <Document
                    file={docMeta.fileUrl}
                    onLoadSuccess={handleDocumentLoadSuccess}
                    onLoadError={handleDocumentLoadError}
                    loading=""
                    className="select-none"
                  >
                    <Page
                      pageNumber={pageNumber}
                      {...(variant === "embedded" ? { height: pageHeight } : { width: pageWidth })}
                      rotate={rotation}
                      renderAnnotationLayer
                      renderTextLayer
                      loading=""
                      className="shadow-[0_8px_30px_rgba(0,0,0,0.35)] max-w-full"
                    />
                  </Document>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
