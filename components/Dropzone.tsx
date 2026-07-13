"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  description?: string;
}

export default function Dropzone({
  onFileSelected,
  accept = "image/png, image/jpeg, image/webp",
  maxSizeMB = 15,
  label,
  description,
}: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const displayLabel = label || t.dropzoneTitle;
  const displayDescription = description || t.dropzoneDesc;

  const processFile = (file: File) => {
    setError(null);

    // Validate type
    const acceptedTypes = accept.split(",").map((type) => type.trim());
    const isValidType = acceptedTypes.some((type) => {
      if (type.endsWith("/*")) {
        const baseType = type.split("/")[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type;
    });

    if (!isValidType) {
      setError(`Unsupported file format. Please upload: ${accept.replace(/image\//g, "")}`);
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    onFileSelected(file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
        className={`relative flex flex-col items-center justify-center w-full min-h-[300px] border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-indigo-500 bg-indigo-500/5 shadow-lg shadow-indigo-500/10"
            : "border-slate-300 dark:border-zinc-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 bg-slate-50 dark:bg-zinc-950/40 hover:bg-indigo-50/10 dark:hover:bg-zinc-950/60"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className={`p-4 rounded-full border transition-all ${
            isDragActive
              ? "bg-indigo-500/20 border-indigo-400 text-indigo-400 scale-110"
              : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-indigo-600 dark:text-indigo-400"
          }`}>
            <Upload className="h-8 w-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-800 dark:text-white">
              {displayLabel}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {displayDescription}
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-755 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
          >
            <ImageIcon className="h-4 w-4" />
            {t.dropzoneSelect}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg text-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
