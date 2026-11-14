import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ClipboardPaste,
  FileCode,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Clock,
  Info,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  Hash,
  Download,
  Share2,
} from 'lucide-react';
import {
  parseJwt,
  extractClaims,
  auditJwt,
  verifyHmacSignature,
  signHmacJwt,
  formatTimestamp,
  DecodedJwt,
  ClaimInfo,
  SecurityAuditResult,
} from './jwtUtils';
import { JWT_PRESETS, JwtPreset } from './jwtPresets';

export const JwtDecoderView: React.FC = () => {
  const [tokenInput, setTokenInput] = useState<string>(JWT_PRESETS[0].token);
  const [secretKey, setSecretKey] = useState<string>(JWT_PRESETS[0].secret || '');
  const [isBase64Secret, setIsBase64Secret] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Active sub-tab in Decoded inspector
  const [activeTab, setActiveTab] = useState<'claims' | 'json' | 'security' | 'signature'>('claims');

  // Edit Mode for Live Re-signing
  const [headerJsonInput, setHeaderJsonInput] = useState<string>('');
  const [payloadJsonInput, setPayloadJsonInput] = useState<string>('');
  const [jsonEditError, setJsonEditError] = useState<string | null>(null);

  // Signature verification state
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    message: string;
    checked: boolean;
  }>({ isValid: false, message: '', checked: false });

  // Selected preset tracker
  const [selectedPresetId, setSelectedPresetId] = useState<string>('standard-hs256');

  // Parse JWT
  const decoded: DecodedJwt = useMemo(() => {
    return parseJwt(tokenInput);
  }, [tokenInput]);

  // Extract claims and security audit
  const claims: ClaimInfo[] = useMemo(() => {
    if (!decoded.isValidStructure) return [];
    return extractClaims(decoded.payload);
  }, [decoded]);

  const auditResults: SecurityAuditResult[] = useMemo(() => {
    return auditJwt(decoded, secretKey);
  }, [decoded, secretKey]);

  // Sync formatted JSON editors when token changes
  useEffect(() => {
    if (decoded.isValidStructure) {
      setHeaderJsonInput(JSON.stringify(decoded.header, null, 2));
      setPayloadJsonInput(JSON.stringify(decoded.payload, null, 2));
      setJsonEditError(null);
    }
  }, [decoded.raw]);

  // Run live HMAC signature verification
  useEffect(() => {
    let isCancelled = false;

    const runVerification = async () => {
      if (!decoded.isValidStructure) {
        setVerificationResult({ isValid: false, message: 'Invalid token structure', checked: false });
        return;
      }

      const alg = (decoded.header.alg || '').toUpperCase();
      if (alg.startsWith('HS')) {
        if (!secretKey) {
          setVerificationResult({
            isValid: false,
            message: 'Enter secret key below to verify signature',
            checked: false,
          });
          return;
        }

        const res = await verifyHmacSignature(tokenInput, secretKey, isBase64Secret);
        if (!isCancelled) {
          setVerificationResult({ isValid: res.isValid, message: res.message, checked: true });
        }
      } else if (alg === 'NONE' || !alg) {
        setVerificationResult({
          isValid: false,
          message: 'Algorithm is "none" - Token is Unsigned / Insecure',
          checked: true,
        });
      } else {
        setVerificationResult({
          isValid: true,
          message: `Public-key algorithm (${alg}). Verify against public certificate or JWKS endpoint.`,
          checked: false,
        });
      }
    };

    runVerification();

    return () => {
      isCancelled = true;
    };
  }, [tokenInput, secretKey, isBase64Secret, decoded]);

  // Apply JSON edits to generate new token
  const handleApplyJsonEdits = async () => {
    try {
      const parsedHeader = JSON.parse(headerJsonInput);
      const parsedPayload = JSON.parse(payloadJsonInput);

      const alg = (parsedHeader.alg || 'HS256').toUpperCase();
      if (alg.startsWith('HS')) {
        const newToken = await signHmacJwt(
          parsedHeader,
          parsedPayload,
          secretKey || 'default-secret-key',
          isBase64Secret
        );
        setTokenInput(newToken);
        setJsonEditError(null);
      } else {
        // Unsigned or non-HMAC: Base64Url encode header and payload, keep old or empty signature
        const { base64UrlEncode } = await import('./jwtUtils');
        const hB64 = base64UrlEncode(JSON.stringify(parsedHeader));
        const pB64 = base64UrlEncode(JSON.stringify(parsedPayload));
        const oldSig = decoded.parts[2] || '';
        setTokenInput(`${hB64}.${pB64}.${oldSig}`);
        setJsonEditError(null);
      }
    } catch (err: any) {
      setJsonEditError(`JSON Error: ${err.message}`);
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
      }
    } catch {
      // Fallback
    }
  };

  const handleSelectPreset = (preset: JwtPreset) => {
    setSelectedPresetId(preset.id);
    setTokenInput(preset.token);
    setSecretKey(preset.secret || '');
    setIsBase64Secret(preset.isBase64Secret || false);
  };

  // Check expiration details
  const expInfo = useMemo(() => {
    if (decoded.payload && typeof decoded.payload.exp === 'number') {
      return formatTimestamp(decoded.payload.exp);
    }
    return null;
  }, [decoded.payload]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E1E1E] text-[#E0E0E0] overflow-hidden">
      {/* Top Header / Control Toolbar */}
      <div className="bg-[#252526] border-b border-[#3F3F46] px-5 py-3 flex flex-wrap items-center justify-between gap-4 select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#FB7185]/20 border border-[#FB7185]/40 flex items-center justify-center text-[#FB7185]">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide">
                JWT Token Deserializer & Debugger
              </h2>
              <span className="bg-[#007ACC]/20 text-[#38BDF8] border border-[#007ACC]/40 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                RFC 7519 Compliant
              </span>
            </div>
            <p className="text-xs text-[#888888]">
              Decode, inspect claims, audit vulnerabilities, and verify HMAC / RSA JSON Web Tokens in real-time.
            </p>
          </div>
        </div>

        {/* Presets and Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-[#1E1E1E] px-2.5 py-1 rounded border border-[#3F3F46] text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[#888888] text-[11px]">Preset:</span>
            <select
              id="jwt-preset-select"
              value={selectedPresetId}
              onChange={(e) => {
                const p = JWT_PRESETS.find((item) => item.id === e.target.value);
                if (p) handleSelectPreset(p);
              }}
              className="bg-transparent text-[#CCCCCC] text-xs font-medium focus:outline-none cursor-pointer"
            >
              {JWT_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#252526] text-white">
                  {p.category}: {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-paste-jwt"
            onClick={handlePaste}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Paste token from clipboard"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-[#38BDF8]" />
            Paste
          </button>

          <button
            id="btn-copy-jwt"
            onClick={() => handleCopy(tokenInput, 'token')}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
          >
            {copiedField === 'token' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy Token
              </>
            )}
          </button>

          <button
            id="btn-clear-jwt"
            onClick={() => {
              setTokenInput('');
              setSecretKey('');
            }}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] hover:text-white rounded border border-[#3F3F46] flex items-center gap-1.5 transition-all"
            title="Clear all fields"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            Clear
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT COLUMN: Encoded Token Editor (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col border-r border-[#3F3F46] bg-[#1E1E1E] overflow-hidden">
          <div className="p-3 bg-[#252526] border-b border-[#3F3F46] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white uppercase tracking-wider">
                Encoded Token
              </span>
              <span className="text-[10px] text-[#888888] font-mono">
                {tokenInput.length} chars • {new Blob([tokenInput]).size} bytes
              </span>
            </div>

            {/* Segment color legend */}
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-[#FB7185]">
                <span className="w-2 h-2 rounded-full bg-[#FB7185]" />
                Header
              </span>
              <span className="flex items-center gap-1 text-[#C084FC]">
                <span className="w-2 h-2 rounded-full bg-[#C084FC]" />
                Payload
              </span>
              <span className="flex items-center gap-1 text-[#38BDF8]">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                Signature
              </span>
            </div>
          </div>

          {/* Token Visual Segment Preview if valid */}
          {decoded.isValidStructure && (
            <div className="p-3 bg-[#181818] border-b border-[#333333] text-xs font-mono break-all max-h-36 overflow-y-auto select-all leading-relaxed">
              <span className="text-[#FB7185] bg-[#FB7185]/10 px-0.5 rounded font-semibold">
                {decoded.parts[0]}
              </span>
              <span className="text-gray-500">.</span>
              <span className="text-[#C084FC] bg-[#C084FC]/10 px-0.5 rounded font-semibold">
                {decoded.parts[1]}
              </span>
              <span className="text-gray-500">.</span>
              <span className="text-[#38BDF8] bg-[#38BDF8]/10 px-0.5 rounded font-semibold">
                {decoded.parts[2] || '<unsigned>'}
              </span>
            </div>
          )}

          {/* Token Live Raw Textarea Input */}
          <div className="flex-1 flex flex-col p-3 overflow-hidden">
            <label className="text-[11px] font-semibold text-[#AAAAAA] mb-1.5 flex items-center justify-between">
              <span>Paste or Edit JWT String:</span>
              <span className="text-[10px] text-[#777777]">Live Synchronized</span>
            </label>
            <textarea
              id="txt-jwt-raw-input"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste raw JWT here: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature"
              className="flex-1 w-full bg-[#181818] text-[#E0E0E0] p-3 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none font-mono text-xs resize-none leading-relaxed overflow-y-auto"
              spellCheck={false}
            />

            {/* Parsing error warning if malformed */}
            {tokenInput.trim() && !decoded.isValidStructure && (
              <div className="mt-2.5 p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <div className="font-semibold">Malformed Token Structure</div>
                  <div className="text-[11px] opacity-90">{decoded.error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Token Metadata Footer */}
          <div className="p-3 bg-[#252526] border-t border-[#3F3F46] flex items-center justify-between text-xs text-[#888888]">
            <div className="flex items-center gap-2">
              <span className="text-[#AAAAAA]">Algorithm:</span>
              <span className="font-mono text-white bg-[#333333] px-2 py-0.5 rounded border border-[#444444]">
                {decoded.header.alg || 'none'}
              </span>
              <span className="text-[#AAAAAA]">Type:</span>
              <span className="font-mono text-white bg-[#333333] px-2 py-0.5 rounded border border-[#444444]">
                {decoded.header.typ || 'JWT'}
              </span>
            </div>

            {expInfo && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span
                  className={`font-semibold ${
                    expInfo.isPast ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {expInfo.isPast ? 'Expired' : 'Active'} ({expInfo.relative})
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Decoded Payload, Claims, Security Audit & Verification (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col bg-[#1E1E1E] overflow-hidden">
          {/* Sub-Navigation Tabs for Decoded View */}
          <div className="bg-[#252526] border-b border-[#3F3F46] px-3 pt-2 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-1">
              <button
                id="tab-jwt-claims"
                onClick={() => setActiveTab('claims')}
                className={`px-3 py-2 text-xs font-medium rounded-t border-t border-x transition-all flex items-center gap-1.5 ${
                  activeTab === 'claims'
                    ? 'bg-[#1E1E1E] text-white border-[#3F3F46] border-b-transparent shadow-sm'
                    : 'text-[#888888] hover:text-[#CCCCCC] border-transparent'
                }`}
              >
                <Hash className="w-3.5 h-3.5 text-[#C084FC]" />
                Claims Inspector ({claims.length})
              </button>

              <button
                id="tab-jwt-json"
                onClick={() => setActiveTab('json')}
                className={`px-3 py-2 text-xs font-medium rounded-t border-t border-x transition-all flex items-center gap-1.5 ${
                  activeTab === 'json'
                    ? 'bg-[#1E1E1E] text-white border-[#3F3F46] border-b-transparent shadow-sm'
                    : 'text-[#888888] hover:text-[#CCCCCC] border-transparent'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-[#38BDF8]" />
                JSON Editor & Re-Sign
              </button>

              <button
                id="tab-jwt-signature"
                onClick={() => setActiveTab('signature')}
                className={`px-3 py-2 text-xs font-medium rounded-t border-t border-x transition-all flex items-center gap-1.5 ${
                  activeTab === 'signature'
                    ? 'bg-[#1E1E1E] text-white border-[#3F3F46] border-b-transparent shadow-sm'
                    : 'text-[#888888] hover:text-[#CCCCCC] border-transparent'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Verify Signature
                {verificationResult.checked && (
                  <span
                    className={`w-2 h-2 rounded-full ${
                      verificationResult.isValid ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                )}
              </button>

              <button
                id="tab-jwt-security"
                onClick={() => setActiveTab('security')}
                className={`px-3 py-2 text-xs font-medium rounded-t border-t border-x transition-all flex items-center gap-1.5 ${
                  activeTab === 'security'
                    ? 'bg-[#1E1E1E] text-white border-[#3F3F46] border-b-transparent shadow-sm'
                    : 'text-[#888888] hover:text-[#CCCCCC] border-transparent'
                }`}
              >
                <ShieldAlert
                  className={`w-3.5 h-3.5 ${
                    auditResults.some((a) => a.severity === 'danger')
                      ? 'text-rose-400'
                      : auditResults.some((a) => a.severity === 'warning')
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                />
                Security Audit ({auditResults.length})
              </button>
            </div>

            <div className="pb-2">
              <button
                id="btn-copy-payload-json"
                onClick={() => handleCopy(JSON.stringify(decoded.payload, null, 2), 'payloadJson')}
                className="px-2 py-1 bg-[#333333] hover:bg-[#3E3E42] text-[11px] text-[#CCCCCC] rounded border border-[#3F3F46] flex items-center gap-1"
                title="Copy Payload JSON"
              >
                {copiedField === 'payloadJson' ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                Copy JSON
              </button>
            </div>
          </div>

          {/* TAB 1: CLAIMS INSPECTOR */}
          {activeTab === 'claims' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Header Box */}
              <div className="bg-[#252526] rounded-lg border border-[#3F3F46] p-3.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FB7185]" />
                    <span className="text-xs font-semibold text-[#FB7185] uppercase tracking-wider">
                      Header Parameters
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#888888]">
                    {Object.keys(decoded.header).length} fields
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                  {Object.entries(decoded.header).map(([k, v]) => (
                    <div key={k} className="bg-[#1E1E1E] p-2 rounded border border-[#333333]">
                      <div className="text-[#888888] text-[10px]">{k}</div>
                      <div className="text-white font-semibold truncate">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Claims Table */}
              <div className="bg-[#252526] rounded-lg border border-[#3F3F46] overflow-hidden">
                <div className="p-3 bg-[#2D2D30] border-b border-[#3F3F46] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C084FC]" />
                    <span className="text-xs font-semibold text-[#C084FC] uppercase tracking-wider">
                      Payload Claims & Identity Data
                    </span>
                  </div>
                  <span className="text-xs text-[#888888] font-mono">
                    {claims.length} extracted claims
                  </span>
                </div>

                {claims.length === 0 ? (
                  <div className="p-8 text-center text-[#888888] text-xs">
                    No claims parsed. Paste a valid JWT token to inspect claims.
                  </div>
                ) : (
                  <div className="divide-y divide-[#333333]">
                    {claims.map((claim) => (
                      <div
                        key={claim.key}
                        className="p-3 hover:bg-[#2A2A2D] transition-colors flex flex-col gap-1 text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#444444]">
                              {claim.key}
                            </span>
                            {claim.isStandard ? (
                              <span className="bg-purple-900/40 text-purple-300 border border-purple-700/50 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                Standard (RFC)
                              </span>
                            ) : (
                              <span className="bg-blue-900/30 text-blue-300 border border-blue-700/40 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                Custom
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleCopy(String(claim.value), `claim-${claim.key}`)}
                            className="text-[#888888] hover:text-white p-1"
                            title="Copy Claim Value"
                          >
                            {copiedField === `claim-${claim.key}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>

                        {/* Claim Value */}
                        <div className="font-mono text-[#E0E0E0] bg-[#1A1A1A] p-2 rounded border border-[#2F2F32] break-all select-all">
                          {typeof claim.value === 'object'
                            ? JSON.stringify(claim.value, null, 2)
                            : String(claim.value)}
                        </div>

                        {/* Human Readable Date info if timestamp */}
                        {claim.humanReadable && ['exp', 'iat', 'nbf', 'auth_time'].includes(claim.key) && (
                          <div className="flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-950/30 px-2 py-1 rounded border border-amber-800/40">
                            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{claim.humanReadable}</span>
                          </div>
                        )}

                        <div className="text-[11px] text-[#888888]">{claim.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: JSON EDITOR & RE-SIGN */}
          {activeTab === 'json' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
              <div className="text-xs text-[#888888] flex items-center justify-between">
                <span>Edit JSON directly and click <strong>Apply & Re-Sign</strong> to update the token:</span>
              </div>

              {jsonEditError && (
                <div className="p-2.5 rounded bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
                  {jsonEditError}
                </div>
              )}

              {/* Header JSON */}
              <div className="flex-1 flex flex-col">
                <label className="text-xs font-semibold text-[#FB7185] mb-1">
                  Header (Algorithm & Token Type) JSON:
                </label>
                <textarea
                  id="txt-header-json"
                  value={headerJsonInput}
                  onChange={(e) => setHeaderJsonInput(e.target.value)}
                  className="h-28 w-full bg-[#181818] text-[#FB7185] p-3 rounded border border-[#3F3F46] focus:border-[#FB7185] focus:outline-none font-mono text-xs resize-none"
                  spellCheck={false}
                />
              </div>

              {/* Payload JSON */}
              <div className="flex-[2] flex flex-col">
                <label className="text-xs font-semibold text-[#C084FC] mb-1">
                  Payload (Claims & Data) JSON:
                </label>
                <textarea
                  id="txt-payload-json"
                  value={payloadJsonInput}
                  onChange={(e) => setPayloadJsonInput(e.target.value)}
                  className="flex-1 min-h-[160px] w-full bg-[#181818] text-[#C084FC] p-3 rounded border border-[#3F3F46] focus:border-[#C084FC] focus:outline-none font-mono text-xs resize-none"
                  spellCheck={false}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  id="btn-format-json"
                  onClick={() => {
                    try {
                      setHeaderJsonInput(JSON.stringify(JSON.parse(headerJsonInput), null, 2));
                      setPayloadJsonInput(JSON.stringify(JSON.parse(payloadJsonInput), null, 2));
                      setJsonEditError(null);
                    } catch (e: any) {
                      setJsonEditError(e.message);
                    }
                  }}
                  className="px-3 py-1.5 bg-[#333333] hover:bg-[#3E3E42] text-xs text-[#CCCCCC] rounded border border-[#3F3F46]"
                >
                  Format JSON
                </button>
                <button
                  id="btn-apply-resign"
                  onClick={handleApplyJsonEdits}
                  className="px-4 py-1.5 bg-[#007ACC] hover:bg-[#0062A3] text-xs text-white font-medium rounded shadow-sm flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Apply & Re-Sign Token
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VERIFY SIGNATURE */}
          {activeTab === 'signature' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Verification Status Banner */}
              <div
                className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                  verificationResult.isValid
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                }`}
              >
                {verificationResult.isValid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-sm">
                    {verificationResult.isValid ? 'Signature Verified' : 'Signature Unverified / Invalid'}
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">{verificationResult.message}</div>
                </div>
              </div>

              {/* Secret Key Input Box for HMAC */}
              <div className="bg-[#252526] p-4 rounded-lg border border-[#3F3F46] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    HMAC Secret Key (for HS256, HS384, HS512):
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-[#AAAAAA] cursor-pointer">
                    <input
                      type="checkbox"
                      id="chk-base64-secret"
                      checked={isBase64Secret}
                      onChange={(e) => setIsBase64Secret(e.target.checked)}
                      className="rounded border-[#3F3F46] bg-[#1E1E1E] text-[#007ACC] focus:ring-0"
                    />
                    <span>Secret is Base64 encoded</span>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    id="txt-hmac-secret"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder="Enter 256-bit secret string (e.g. your-256-bit-secret)..."
                    className="w-full bg-[#181818] text-white pr-10 pl-3 py-2 rounded border border-[#3F3F46] focus:border-[#007ACC] focus:outline-none font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2.5 top-2.5 text-[#888888] hover:text-white"
                    title={showSecret ? 'Hide secret' : 'Show secret'}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-[11px] text-[#888888] flex items-center justify-between">
                  <span>Secret length: {secretKey.length} chars ({secretKey.length * 8} bits)</span>
                  <span className={secretKey.length >= 32 ? 'text-emerald-400' : 'text-amber-400'}>
                    {secretKey.length >= 32 ? '✓ Recommended length (>= 256 bits)' : '⚠ Weak secret (< 256 bits)'}
                  </span>
                </div>
              </div>

              {/* Asymmetric / Public Key instructions */}
              <div className="bg-[#252526] p-4 rounded-lg border border-[#3F3F46] space-y-2">
                <div className="text-xs font-semibold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#38BDF8]" />
                  Asymmetric Algorithms (RS256, ES256, PS256)
                </div>
                <p className="text-xs text-[#AAAAAA] leading-relaxed">
                  Tokens issued by Microsoft Entra ID (Azure AD), Google Firebase, Auth0, or Okta are signed
                  using asymmetric private keys on the server and verified via their OpenID Connect JWKS public key endpoint
                  (e.g., <code>https://auth-server/.well-known/jwks.json</code>).
                </p>
                {decoded.header.kid && (
                  <div className="p-2 bg-[#1E1E1E] rounded border border-[#333333] font-mono text-xs text-[#38BDF8]">
                    Key ID (kid): {decoded.header.kid}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY AUDIT & DIAGNOSTICS */}
          {activeTab === 'security' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              <div className="text-xs text-[#888888] mb-2">
                Automated vulnerability and hygiene checks based on NIST, OWASP, and RFC 7519 security standards:
              </div>

              {auditResults.map((audit, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                    audit.severity === 'danger'
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-300'
                      : audit.severity === 'warning'
                      ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
                      : 'bg-emerald-950/20 border-emerald-800/50 text-emerald-300'
                  }`}
                >
                  {audit.severity === 'danger' ? (
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  ) : audit.severity === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1 space-y-1">
                    <div className="font-semibold text-xs text-white">{audit.title}</div>
                    <div className="text-xs opacity-90">{audit.description}</div>
                    <div className="text-[11px] font-mono opacity-80 pt-1 text-[#CCCCCC]">
                      <strong>Recommendation:</strong> {audit.recommendation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
