import React from "react";
import { Download, Printer, BookOpen, CheckCircle, ShieldAlert, Cpu, ArrowRight, HelpCircle } from "lucide-react";
import { PRESENTATION_DATA } from "@/lib/presentationContent";

export const PresentationGuidePage: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-in fade-in duration-500">
      {/* Top Header & Download Action Card */}
      <div className="card p-6 border-accent/40 bg-gradient-to-r from-ink-soft via-ink to-ink-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-accent/20 text-accent border border-accent/30">
                SYSTEM ARCHITECTURE & TECHNICAL SPECIFICATION
              </span>
              <span className="text-xs text-paper/50">Official Engineering Reference</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-paper">
              Vehicle Re-ID Uncertainty Platform
            </h1>
            <p className="text-xs sm:text-sm text-paper/70 max-w-2xl">
              Architecture pipeline, evidential temperature calibration math, and multi-camera operational workflow.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3 flex-shrink-0">
            <a
              href="/api/download/presentation-guide.doc"
              download="Vehicle_ReID_Technical_Specification.doc"
              className="btn-primary py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              <Download className="w-4 h-4" />
              Export Document (.doc)
            </a>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-lg border border-purple/40 bg-purple/10 text-purple hover:bg-purple/20 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Quick Nav Anchors */}
        <div className="mt-6 pt-4 border-t border-ink-line/60 flex flex-wrap gap-2 text-xs">
          <span className="text-paper/40 py-1 font-mono uppercase text-[10px]">Jump to:</span>
          {PRESENTATION_DATA.sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="px-2.5 py-1 rounded bg-ink/70 border border-ink-line text-paper/70 hover:text-accent hover:border-accent/40 transition text-[11px]"
            >
              {s.title.split(".")[1]?.trim() || s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Printable Body */}
      <div className="space-y-8">
        {PRESENTATION_DATA.sections.map((section, idx) => (
          <section
            key={section.id}
            id={section.id}
            className="card p-6 sm:p-8 space-y-4 border-ink-line/70 hover:border-accent/30 transition scroll-mt-20"
          >
            <div className="flex items-center gap-3 border-b border-ink-line pb-3">
              <span className="w-7 h-7 rounded-full bg-accent/10 border border-accent/40 text-accent font-mono text-xs flex items-center justify-center font-bold">
                0{idx + 1}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-paper">
                {section.title}
              </h2>
            </div>

            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-paper/85 leading-relaxed space-y-4 whitespace-pre-line">
              {section.content}
            </div>
          </section>
        ))}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="card p-4 border-accent/30 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-paper/60">
          Official System Architecture & Technical Specifications for Re-ID Uncertainty Quantification.
        </div>
        <div className="flex gap-2">
          <a
            href="/api/download/presentation-guide.doc"
            download="Vehicle_ReID_Technical_Specification.doc"
            className="btn-primary py-1.5 px-3 text-xs"
          >
            <Download className="w-3.5 h-3.5 inline mr-1" />
            Export Word Doc
          </a>
          <button onClick={handlePrint} className="px-3 py-1.5 rounded bg-ink border border-ink-line text-xs text-paper hover:text-accent transition">
            <Printer className="w-3.5 h-3.5 inline mr-1" />
            Print Specification (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};
