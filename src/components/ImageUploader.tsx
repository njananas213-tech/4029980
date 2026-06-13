import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, Image as ImageIcon, Check, RefreshCw, AlertCircle } from "lucide-react";

interface ImageUploaderProps {
  currentUrl?: string;
  portraitSrc: "designer" | "personal";
  onImageSelected: (base64Url: string) => void;
  onSourceChanged: (src: "designer" | "personal") => void;
}

export default function ImageUploader({
  currentUrl,
  portraitSrc,
  onImageSelected,
  onSourceChanged,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to process the selected raw file and convert to Base64 Url
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please provide a valid image file.");
      return;
    }

    // Limit file size to 7MB to avoid crashes/local storage freezes
    if (file.size > 7 * 1024 * 1024) {
      setUploadError("This image exceeds the 7MB limit. Please select a smaller photo.");
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        onImageSelected(e.target.result);
        onSourceChanged("personal"); // switch to custom portrait source
      } else {
        setUploadError("Error reading image content.");
      }
    };
    reader.onerror = () => {
      setUploadError("Failed to import selected file.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Selector Tabs */}
      <div className="flex rounded-lg bg-black/40 p-1 border border-amber-500/10" id="portrait-source-tabs">
        <button
          onClick={() => onSourceChanged("designer")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm rounded-md transition-all ${
            portraitSrc === "designer"
              ? "bg-amber-500/20 text-yellow-300 border border-amber-500/30"
              : "text-zinc-400 hover:text-zinc-100"
          }`}
          type="button"
          id="btn-use-designer-portrait"
        >
          <ImageIcon size={15} />
          <span>Designer Portrait</span>
        </button>
        <button
          onClick={() => onSourceChanged("personal")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm rounded-md transition-all ${
            portraitSrc === "personal"
              ? "bg-amber-500/20 text-yellow-300 border border-amber-500/30"
              : "text-zinc-400 hover:text-zinc-100"
          }`}
          type="button"
          id="btn-use-personal-portrait"
        >
          <Upload size={15} />
          <span>My Portrait (9:16)</span>
        </button>
      </div>

      {portraitSrc === "designer" ? (
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
            <Check size={20} />
          </div>
          <div>
            <h4 className="font-semibold text-yellow-100 text-sm">Designer asset preloaded</h4>
            <p className="text-zinc-400 text-xs mt-0.5">
              The custom-generated, photorealistic luxury portrait matching deep burgundy hijab elegancy config.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* File Drop Field */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
            className={`group cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[140px] ${
              isDragging
                ? "border-yellow-400 bg-yellow-500/10"
                : "border-zinc-700 bg-zinc-900/40 hover:border-amber-500/40 hover:bg-zinc-900/80"
            }`}
            id="drag-drop-zone"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {currentUrl ? (
              <div className="space-y-2 flex flex-col items-center">
                <div className="relative group/thumb">
                  <img
                    src={currentUrl}
                    alt="User Portrait Preview"
                    className="w-16 h-20 object-cover rounded-md border border-amber-500/30 shadow-lg shadow-black/80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <RefreshCw size={14} className="text-white animate-spin-slow" />
                  </div>
                </div>
                <p className="text-xs text-yellow-300 font-medium">Ready in Card!</p>
                <p className="text-[10px] text-zinc-500">Click or drag over to replace photo</p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-zinc-800/80 text-zinc-400 rounded-full group-hover:text-amber-400 group-hover:bg-amber-500/10 transition-colors mb-2">
                  <Upload size={24} />
                </div>
                <h5 className="font-medium text-zinc-300 text-xs">
                  Upload portrait (the provided photo)
                </h5>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Drag & drop, or click here to browse.
                </p>
              </>
            )}
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-300 text-xs animate-fadeIn">
              <AlertCircle size={14} className="shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <div className="text-[10px] text-zinc-500 italic flex items-start gap-1 p-1">
            <span className="text-amber-500/60 font-bold leading-none select-none">•</span>
            <span>
              Tip: Drag and drop or browse the portrait of the lady provided in the chat description to view it inside the dynamic layout.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
