import React, { useState } from 'react';
import { ConnectionConfig } from '../../types';
import { Plus, Save, Trash2, CheckCircle2, XCircle, Loader2, ShieldCheck, KeyRound, Server } from 'lucide-react';

interface ConnectionManagerProps {
  connections: ConnectionConfig[];
  selectedConnection: ConnectionConfig | null;
  onSelectConnection: (conn: ConnectionConfig) => void;
  onSaveConnection: (conn: ConnectionConfig) => void;
  onDeleteConnection: (id: string) => void;
  onTestConnection: (conn: ConnectionConfig) => Promise<boolean>;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  connections,
  selectedConnection,
  onSelectConnection,
  onSaveConnection,
  onDeleteConnection,
  onTestConnection,
}) => {
  const [formData, setFormData] = useState<ConnectionConfig>(
    selectedConnection || {
      id: `conn-${Date.now()}`,
      name: 'New Connection',
      server: 'localhost',
      database: 'master',
      integratedSecurity: true,
      username: '',
      password: '',
      encrypt: false,
      trustServerCertificate: true,
      timeout: 30,
      isDefault: false,
      dbProvider: 'SQL Server',
    }
  );

  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleSelect = (conn: ConnectionConfig) => {
    onSelectConnection(conn);
    setFormData({ ...conn });
    setTestStatus('idle');
  };

  const handleNew = () => {
    const newConn: ConnectionConfig = {
      id: `conn-${Date.now()}`,
      name: 'New Connection',
      server: 'localhost',
      database: 'master',
      integratedSecurity: true,
      username: '',
      password: '',
      encrypt: false,
      trustServerCertificate: true,
      timeout: 30,
      isDefault: false,
      dbProvider: 'SQL Server',
    };
    setFormData(newConn);
    setTestStatus('idle');
  };

  const handleTest = async () => {
    setTestStatus('testing');
    setTestMessage('Connecting to SQL server...');
    const result = await onTestConnection(formData);
    if (result) {
      setTestStatus('success');
      setTestMessage('Connection successful! Server handshake verified.');
    } else {
      setTestStatus('failed');
      setTestMessage('Connection failed. Please check host, port, credentials, or firewall settings.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConnection(formData);
    setTestStatus('success');
    setTestMessage('Connection saved successfully.');
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete connection "${formData.name}"?`)) {
      onDeleteConnection(formData.id);
      handleNew();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] text-[#E0E0E0] p-3 text-xs overflow-y-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-3 border-b border-[#3F3F46] pb-2">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <Server className="w-4 h-4 text-[#007ACC]" />
          <span>Connection Manager</span>
        </div>
        <button
          id="btn-new-connection"
          onClick={handleNew}
          className="flex items-center gap-1 bg-[#3E3E42] hover:bg-[#4E4E52] text-white px-2.5 py-1 rounded text-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Saved Connections Selector */}
      <div className="mb-4">
        <label className="text-[11px] text-[#888888] font-medium block mb-1">
          SAVED CONNECTIONS ({connections.length})
        </label>
        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {connections.map((conn) => {
            const isSelected = selectedConnection?.id === conn.id;
            return (
              <button
                key={conn.id}
                onClick={() => handleSelect(conn)}
                className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-[#007ACC] text-white font-medium'
                    : 'bg-[#1E1E1E] text-[#CCCCCC] hover:bg-[#2D2D30]'
                }`}
              >
                <div className="truncate">
                  <div className="truncate font-semibold">{conn.name}</div>
                  <div className="text-[10px] opacity-75 truncate font-mono">
                    {conn.server} ({conn.database})
                  </div>
                </div>
                {conn.isDefault && (
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30 font-mono shrink-0 ml-1">
                    DEF
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection Form */}
      <form onSubmit={handleSave} className="space-y-3 border-t border-[#3F3F46] pt-3">
        <div>
          <label className="text-[11px] text-[#AAAAAA] block mb-1">Display Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#007ACC]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] text-[#AAAAAA] block mb-1">Database Provider</label>
            <select
              value={formData.dbProvider || 'SQL Server'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dbProvider: e.target.value as 'SQL Server' | 'PostgreSQL',
                })
              }
              className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#007ACC]"
            >
              <option value="SQL Server">Microsoft SQL Server</option>
              <option value="PostgreSQL">PostgreSQL</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-[#AAAAAA] block mb-1">Timeout (Sec)</label>
            <input
              type="number"
              value={formData.timeout}
              onChange={(e) =>
                setFormData({ ...formData, timeout: parseInt(e.target.value, 10) || 30 })
              }
              className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#007ACC]"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] text-[#AAAAAA] block mb-1">Server Host / Address</label>
          <input
            type="text"
            value={formData.server}
            onChange={(e) => setFormData({ ...formData, server: e.target.value })}
            className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#007ACC]"
            required
          />
        </div>

        <div>
          <label className="text-[11px] text-[#AAAAAA] block mb-1">Database Name</label>
          <input
            type="text"
            value={formData.database}
            onChange={(e) => setFormData({ ...formData, database: e.target.value })}
            className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#007ACC]"
            required
          />
        </div>

        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id="chk-integrated-security"
            checked={formData.integratedSecurity}
            onChange={(e) => setFormData({ ...formData, integratedSecurity: e.target.checked })}
            className="rounded bg-[#1E1E1E] border-[#3F3F46] text-[#007ACC] focus:ring-0"
          />
          <label htmlFor="chk-integrated-security" className="text-xs text-[#E0E0E0] cursor-pointer">
            Integrated Security (Windows Auth)
          </label>
        </div>

        {!formData.integratedSecurity && (
          <div className="space-y-2.5 pl-2 border-l-2 border-[#007ACC] my-2">
            <div>
              <label className="text-[11px] text-[#AAAAAA] block mb-1">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#007ACC]"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-[#AAAAAA]">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#007ACC] hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-[#1E1E1E] border border-[#3F3F46] rounded px-2.5 py-1.5 text-white focus:outline-none focus:border-[#007ACC]"
              />
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                <KeyRound className="w-3 h-3" />
                ProtectedData Protected (AES-256)
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.trustServerCertificate}
              onChange={(e) => setFormData({ ...formData, trustServerCertificate: e.target.checked })}
              className="rounded bg-[#1E1E1E] border-[#3F3F46] text-[#007ACC]"
            />
            <span className="text-xs text-[#CCCCCC]">Trust Server Certificate</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.encrypt}
              onChange={(e) => setFormData({ ...formData, encrypt: e.target.checked })}
              className="rounded bg-[#1E1E1E] border-[#3F3F46] text-[#007ACC]"
            />
            <span className="text-xs text-[#CCCCCC]">Encrypt Connection</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded bg-[#1E1E1E] border-[#3F3F46] text-[#007ACC]"
            />
            <span className="text-xs text-[#CCCCCC]">Set as Default Connection</span>
          </label>
        </div>

        {/* Test Connection Result Feedback */}
        {testStatus !== 'idle' && (
          <div
            className={`p-2 rounded text-xs flex items-start gap-2 ${
              testStatus === 'testing'
                ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-200'
                : testStatus === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                : 'bg-red-500/10 border border-red-500/30 text-red-200'
            }`}
          >
            {testStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />}
            {testStatus === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />}
            {testStatus === 'failed' && <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />}
            <div>
              <div className="font-semibold">
                {testStatus === 'testing'
                  ? 'Testing Handshake...'
                  : testStatus === 'success'
                  ? 'Connection Verified'
                  : 'Connection Failed'}
              </div>
              <div className="text-[11px] leading-tight opacity-90">{testMessage}</div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handleTest}
            disabled={testStatus === 'testing'}
            className="flex items-center justify-center gap-1 bg-[#3E3E42] hover:bg-[#4E4E52] text-white py-1.5 rounded transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Test Connection</span>
          </button>

          <button
            type="submit"
            className="flex items-center justify-center gap-1 bg-[#007ACC] hover:bg-[#0066B2] text-white py-1.5 rounded font-semibold transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Connection</span>
          </button>
        </div>

        {selectedConnection && (
          <button
            type="button"
            onClick={handleDelete}
            className="w-full flex items-center justify-center gap-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/40 py-1.5 rounded text-xs transition-colors mt-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Connection</span>
          </button>
        )}
      </form>
    </div>
  );
};
