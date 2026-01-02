import { Upload } from 'lucide-react';
import { useCallback, useState } from 'react';
import { clsx } from 'clsx';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({ onFileSelect, accept = '.csv', label = 'Upload CSV' }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      className={clsx(
        "relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ease-in-out group",
        isDragging
          ? "border-indigo-500 bg-indigo-50/50 scale-[1.02]"
          : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept={accept}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
          }
        }}
      />
      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
        <div className={clsx("p-2 rounded-full mb-3 transition-colors", isDragging ? "bg-indigo-100" : "bg-slate-100 group-hover:bg-indigo-50")}>
          <Upload className={clsx("w-6 h-6", isDragging ? "text-indigo-600" : "text-slate-400 group-hover:text-indigo-500")} />
        </div>
        <p className="mb-1 text-sm font-medium text-slate-700">
          <span className="text-indigo-600 hover:underline">{label}</span>
        </p>
        <p className="text-xs text-slate-500">or drag and drop CSV</p>
      </div>
    </div>
  );
}
