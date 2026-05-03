'use client';

import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import Image from 'next/image';
import { CloudArrowUpIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  preview?: string;
  onClear?: () => void;
}

export default function UploadZone({ onFileSelect, preview, onClear }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    // Reset input so the same file can be re-selected if cleared
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden">
        <div className="relative max-h-64 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Screenshot preview"
            className="max-h-64 w-full object-contain rounded-xl bg-black/20"
          />
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
            aria-label="Clear image"
          >
            <XCircleIcon className="w-7 h-7 drop-shadow-lg" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors select-none ${
        isDraggingOver
          ? 'border-pl-green bg-pl-green/5'
          : 'border-pl-green/40 hover:border-pl-green/60'
      }`}
    >
      <CloudArrowUpIcon
        className={`w-12 h-12 mx-auto mb-3 transition-colors ${
          isDraggingOver ? 'text-pl-green' : 'text-pl-green/60'
        }`}
      />
      <p className="text-white font-medium text-sm">Drop Playtomic screenshot here</p>
      <p className="text-white/50 text-xs mt-1">or tap to browse</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload screenshot"
      />
    </div>
  );
}
