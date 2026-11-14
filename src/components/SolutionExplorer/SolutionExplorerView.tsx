import React, { useState } from 'react';
import { csharpSolutionFiles } from '../../data/csharpSolutionFiles';
import { downloadCSharpSolutionZip } from '../../services/zipService';
import { CSharpFile } from '../../types';
import {
  Download,
  Copy,
  Check,
  Code,
  Folder,
  FileCode,
  Sparkles,
  Layers,
} from 'lucide-react';

export const SolutionExplorerView: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CSharpFile>(csharpSolutionFiles[0]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      await downloadCSharpSolutionZip();
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = selectedFile.content.split('\n');

  return (
    <div className="flex h-full w-full bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden">
      {/* Left File Tree Sidebar */}
      <div className="w-80 bg-[#252526] border-r border-[#3F3F46] flex flex-col justify-between shrink-0">
        <div>
          {/* Header */}
          <div className="p-3 border-b border-[#3F3F46] bg-[#1E1E1E]/50">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  Solution Explorer
                </h3>
                <span className="text-[10px] text-[#888888] font-mono">
                  SupportToolkit.sln (.NET 8.0)
                </span>
              </div>
            </div>
          </div>

          {/* File Tree List */}
          <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
            <div className="text-[10px] uppercase tracking-wider text-[#888888] font-semibold px-2 py-1">
              Project Structure
            </div>

            {csharpSolutionFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              const isSln = file.name.endsWith('.sln') || file.name.endsWith('.csproj');
              const isXaml = file.name.endsWith('.xaml');

              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center gap-2 font-mono transition-colors ${
                    isSelected
                      ? 'bg-[#007ACC] text-white font-medium shadow-sm'
                      : 'text-[#CCCCCC] hover:bg-[#2D2D30] hover:text-white'
                  }`}
                >
                  {isSln ? (
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : isXaml ? (
                    <Code className="w-4 h-4 text-purple-400 shrink-0" />
                  ) : (
                    <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <div className="truncate leading-tight">{file.name}</div>
                    <div className="text-[9px] opacity-70 truncate text-[#AAAAAA]">
                      {file.path}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Download Button in Sidebar */}
        <div className="p-3 border-t border-[#3F3F46] bg-[#1E1E1E]/60">
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 rounded text-xs shadow-md transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
            <span>{isDownloading ? 'Packing ZIP...' : 'Download .NET 8 ZIP'}</span>
          </button>
        </div>
      </div>

      {/* Right Code Viewer */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1E1E1E]">
        {/* Code Header Bar */}
        <div className="flex items-center justify-between p-3 bg-[#252526] border-b border-[#3F3F46] text-xs">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-blue-400" />
            <span className="font-mono text-white font-semibold">{selectedFile.path}</span>
            <span className="text-[10px] bg-[#3E3E42] text-[#AAAAAA] px-2 py-0.5 rounded font-mono">
              {lines.length} lines
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 bg-[#3E3E42] hover:bg-[#4E4E52] text-white px-3 py-1.5 rounded text-xs transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy File Code'}</span>
            </button>

            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 rounded text-xs transition-colors shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Export Solution (.ZIP)</span>
            </button>
          </div>
        </div>

        {/* Code Body with Line Numbers */}
        <div className="flex-1 overflow-auto flex font-mono text-xs bg-[#1E1E1E]">
          {/* Line Numbers */}
          <div className="w-12 bg-[#1E1E1E] text-[#666666] border-r border-[#333333] select-none py-3 text-right pr-2 font-mono leading-5 shrink-0">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code Text Content */}
          <pre className="flex-1 p-3 leading-5 text-[#DCDCDC] overflow-x-auto select-text font-mono">
            <code>{selectedFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
