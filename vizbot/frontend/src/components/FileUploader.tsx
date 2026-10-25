import React, { useCallback, useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelected, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setFileName(file.name);
        onFileSelected(file);
      } else {
        alert("Please upload a CSV file.");
      }
    }
  }, [onFileSelected]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      onFileSelected(file);
    }
  }, [onFileSelected]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`relative group cursor-pointer transition-all duration-300 ease-in-out
          border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        style={{
          borderColor: dragActive ? '#818cf8' : 'rgba(255,255,255,0.1)',
          background: dragActive ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
          transform: dragActive ? 'scale(1.02)' : 'scale(1)',
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          accept=".csv"
          disabled={isLoading}
        />

        <div className="p-4 rounded-2xl mb-4 transition-colors"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.15)' }}>
          {isLoading ? (
            <div className="animate-spin h-8 w-8 border-3 border-indigo-400 border-t-transparent rounded-full" />
          ) : fileName ? (
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          ) : (
            <Upload className="w-8 h-8 text-indigo-400" />
          )}
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          {isLoading ? 'Agent is Analyzing...' : fileName ? 'File Selected' : 'Upload CSV Data'}
        </h3>

        <p className="text-sm max-w-xs" style={{ color: '#6b6b8a' }}>
          {fileName
            ? <span className="text-emerald-400 font-medium">{fileName}</span>
            : 'Drag & drop your CSV file here, or click to browse'}
        </p>
      </div>
    </div>
  );
};