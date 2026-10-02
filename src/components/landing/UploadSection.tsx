import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, FileText, Image as ImageIcon, Loader2, Table, UploadCloud } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { setPendingDemoFile } from "@/components/app/analysis";
import { Reveal, SectionHeading } from "./Reveal";
import { GlowButton } from "./GlowButton";

const STEPS = [
  "Uploading...",
  "AI Scanning...",
  "Transactions Extracted...",
  "Expenses Categorized...",
  "Dashboard Updated...",
];

export function UploadSection() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const start = (file: File) => {
    setFileName(file.name);
    setStep(0);
    setRunning(true);

    setPendingDemoFile(file);

    navigate({
      to: "/demo",
    });
  };

  return (
    <section id="upload" className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Upload"
          title={
            <>
              Drop a file. Watch <span className="text-gradient">AI do the rest</span>
            </>
          }
          subtitle="PDF statements, CSV exports, receipt photos, or app screenshots — all supported."
        />

        <Reveal className="mt-12" direction="zoom">
          <div className="grid gap-6 rounded-3xl glass-strong p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
            <div
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);

                const file = e.dataTransfer.files?.[0];

                if (file) {
                  start(file);
                }
              }}
              onClick={() => inputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
                dragging
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-border hover:border-primary/60 hover:bg-foreground/[0.03]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept=".pdf,.csv,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    start(file);
                  }
                }}
              />
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="grid h-16 w-16 place-items-center rounded-2xl"
                style={{ background: "var(--gradient-brand)", boxShadow: "var(--shadow-glow)" }}
              >
                <UploadCloud className="h-7 w-7 text-primary-foreground" />
              </motion.div>
              <p className="mt-5 font-medium">Drag & drop your file here</p>
              <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                {[
                  { icon: FileText, label: "PDF" },
                  { icon: Table, label: "CSV" },
                  { icon: ImageIcon, label: "Receipts" },
                  { icon: ImageIcon, label: "Screenshots" },
                ].map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1"
                  >
                    <t.icon className="h-3.5 w-3.5 text-primary" /> {t.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl glass p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Processing pipeline
              </p>
              <p className="mt-1 truncate text-sm font-medium">
                {fileName ?? "No file selected yet"}
              </p>

              <ul className="mt-5 space-y-3">
                {STEPS.map((label, i) => {
                  const state =
                    step < 0 ? "idle" : i < step ? "done" : i === step ? "active" : "idle";
                  return (
                    <li key={label} className="flex items-center gap-3">
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors duration-500 ${
                          state === "done"
                            ? "border-accent bg-accent/20 text-accent"
                            : state === "active"
                              ? "border-primary bg-primary/20 text-primary"
                              : "border-border text-muted-foreground"
                        }`}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          {state === "done" ? (
                            <motion.span
                              key="d"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </motion.span>
                          ) : state === "active" ? (
                            <Loader2 key="a" className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <span key="i" className="text-[10px]">
                              {i + 1}
                            </span>
                          )}
                        </AnimatePresence>
                      </span>
                      <span
                        className={`text-sm transition-colors duration-500 ${
                          state === "idle" ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <GlowButton
                className="mt-6 w-full"
                disabled={running}
                onClick={() => inputRef.current?.click()}
              >
                {running ? "Analyzing..." : "Run a sample analysis"}
              </GlowButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
