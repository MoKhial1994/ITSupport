import React, { useState, useEffect } from 'react';
import { defaultSystemInfo } from '../../data/sampleDbData';
import { SystemInfoModel } from '../../types';
import {
  Laptop,
  User,
  Shield,
  Cpu,
  HardDrive,
  RefreshCw,
  Network,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const SystemInfoView: React.FC = () => {
  const [info, setInfo] = useState<SystemInfoModel>(defaultSystemInfo);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cpuUsage, setCpuUsage] = useState<number>(18);
  const [memUsed, setMemUsed] = useState<number>(22.4);
  const [uptimeSec, setUptimeSec] = useState<number>(345600);

  // Live timer tick for diagnostics
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => {
        const delta = (Math.random() - 0.5) * 8;
        return Math.min(Math.max(Math.round(prev + delta), 5), 92);
      });
      setUptimeSec((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setInfo({ ...defaultSystemInfo });
    setCpuUsage(Math.floor(Math.random() * 20) + 12);
    setMemUsed(+(21.5 + Math.random() * 2).toFixed(1));
    setIsRefreshing(false);
  };

  const formatUptime = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] p-6 overflow-y-auto">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#3F3F46]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Laptop className="w-6 h-6 text-[#007ACC]" />
            <span>System Diagnostic Overview</span>
          </h2>
          <p className="text-xs text-[#888888] mt-1">
            Real-time machine performance telemetry & environment diagnostic specifications
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-[#007ACC] hover:bg-[#0066B2] text-white px-4 py-2 rounded text-xs font-semibold shadow transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Scanning System...' : 'Refresh Diagnostics'}</span>
        </button>
      </div>

      {/* Primary Hardware & System Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Machine Name */}
        <div className="bg-[#2D2D30] border border-[#3F3F46] rounded-lg p-4 shadow-sm hover:border-[#007ACC] transition-all">
          <div className="flex items-center gap-2 text-[#AAAAAA] text-xs mb-1 font-medium">
            <Laptop className="w-4 h-4 text-blue-400" />
            <span>Machine Name</span>
          </div>
          <div className="text-base font-bold text-white font-mono">{info.machineName}</div>
          <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-2">
            <CheckCircle2 className="w-3 h-3" /> Domain Joined & Verified
          </div>
        </div>

        {/* Current User */}
        <div className="bg-[#2D2D30] border border-[#3F3F46] rounded-lg p-4 shadow-sm hover:border-[#007ACC] transition-all">
          <div className="flex items-center gap-2 text-[#AAAAAA] text-xs mb-1 font-medium">
            <User className="w-4 h-4 text-purple-400" />
            <span>Current User</span>
          </div>
          <div className="text-base font-bold text-white font-mono">{info.userName}</div>
          <div className="text-[10px] text-[#888888] mt-2">Administrator Privilege Level</div>
        </div>

        {/* OS Version */}
        <div className="bg-[#2D2D30] border border-[#3F3F46] rounded-lg p-4 shadow-sm hover:border-[#007ACC] transition-all">
          <div className="flex items-center gap-2 text-[#AAAAAA] text-xs mb-1 font-medium">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Operating System</span>
          </div>
          <div className="text-sm font-semibold text-white leading-snug">{info.osVersion}</div>
          <div className="text-[10px] text-[#888888] mt-2">x64 Architecture • Build 22631</div>
        </div>

        {/* .NET Runtime */}
        <div className="bg-[#2D2D30] border border-[#3F3F46] rounded-lg p-4 shadow-sm hover:border-[#007ACC] transition-all">
          <div className="flex items-center gap-2 text-[#AAAAAA] text-xs mb-1 font-medium">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>.NET Runtime</span>
          </div>
          <div className="text-sm font-semibold text-white font-mono">{info.dotNetRuntime}</div>
          <div className="text-[10px] text-emerald-400 mt-2">WPF & CommunityToolkit Active</div>
        </div>

        {/* IP Address */}
        <div className="bg-[#2D2D30] border border-[#3F3F46] rounded-lg p-4 shadow-sm hover:border-[#007ACC] transition-all">
          <div className="flex items-center gap-2 text-[#AAAAAA] text-xs mb-1 font-medium">
            <Network className="w-4 h-4 text-amber-400" />
            <span>Local Network IP</span>
          </div>
          <div className="text-sm font-semibold text-white font-mono">{info.ipAddress}</div>
          <div className="text-[10px] text-[#888888] mt-2">Active Ethernet Adapter</div>
        </div>

        {/* Uptime */}
        <div className="bg-[#2D2D30] border border-[#3F3F46] rounded-lg p-4 shadow-sm hover:border-[#007ACC] transition-all">
          <div className="flex items-center gap-2 text-[#AAAAAA] text-xs mb-1 font-medium">
            <Activity className="w-4 h-4 text-pink-400" />
            <span>System Uptime</span>
          </div>
          <div className="text-sm font-semibold text-white font-mono">
            {formatUptime(uptimeSec)}
          </div>
          <div className="text-[10px] text-emerald-400 mt-2">System Healthy</div>
        </div>
      </div>

      {/* Performance Gauges Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Load Card */}
        <div className="bg-[#252526] border border-[#3F3F46] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <Cpu className="w-5 h-5 text-blue-400" />
              <span>Processor Performance</span>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {cpuUsage}% LOAD
            </span>
          </div>
          <p className="text-xs text-[#888888] mb-3 font-mono">{info.processor}</p>

          {/* Progress Bar */}
          <div className="w-full bg-[#1E1E1E] h-3 rounded-full overflow-hidden p-0.5 border border-[#3F3F46]">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#777777] mt-1.5 font-mono">
            <span>24 Logical Cores</span>
            <span>3.00 GHz Clock Speed</span>
          </div>
        </div>

        {/* Memory Load Card */}
        <div className="bg-[#252526] border border-[#3F3F46] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-semibold text-white text-sm">
              <HardDrive className="w-5 h-5 text-purple-400" />
              <span>RAM Memory Utilization</span>
            </div>
            <span className="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              {memUsed} GB / {info.totalMemory}
            </span>
          </div>
          <p className="text-xs text-[#888888] mb-3 font-mono">Dual-Channel DDR5 @ 5600MHz</p>

          {/* Progress Bar */}
          <div className="w-full bg-[#1E1E1E] h-3 rounded-full overflow-hidden p-0.5 border border-[#3F3F46]">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${(memUsed / 64) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#777777] mt-1.5 font-mono">
            <span>Used: {Math.round((memUsed / 64) * 100)}%</span>
            <span>Available: {(64 - memUsed).toFixed(1)} GB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
