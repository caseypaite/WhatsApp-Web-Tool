import React, { useState, useEffect } from 'react';
import { RefreshCw, Play } from 'lucide-react';
import Modal from './Modal';

const APIEndpointModal = ({ endpoint, isOpen, onClose, onTest, loading, result, settings }) => {
  const [testPayload, setTestPayload] = useState({});

  useEffect(() => {
    if (endpoint && endpoint.b) {
      try {
        setTestPayload(JSON.parse(endpoint.b));
      } catch (e) {
        setTestPayload({});
      }
    } else {
      setTestPayload({});
    }
  }, [endpoint]);

  if (!endpoint || !isOpen) return null;
  
  const apiBaseUrl = settings.find(s => s.key === 'vite_api_base_url')?.value || import.meta.env.VITE_API_BASE_URL || window.location.origin;
  const apiUrl = apiBaseUrl.replace(/\/api$/, '');
  const apiKey = settings.find(s => s.key === 'api_key')?.value || 'YOUR_KEY';
  
  const currentPayload = JSON.stringify(testPayload);
  const fullUrl = `${apiUrl}/api${endpoint.p}`;
  
  const curl = endpoint.k 
    ? `curl -X ${endpoint.m} "${fullUrl}" \\\n  -H "x-api-key: ${apiKey}" ${endpoint.b ? `\\\n  -H "Content-Type: application/json" \\\n  -d '${currentPayload}'` : ''}`
    : `curl -X ${endpoint.m} "${fullUrl}" \\\n  -H "Authorization: Bearer YOUR_JWT_TOKEN" ${endpoint.b ? `\\\n  -H "Content-Type: application/json" \\\n  -d '${currentPayload}'` : ''}`;

  const handleFieldChange = (key, val) => {
    setTestPayload(prev => ({ ...prev, [key]: val }));
  };

  const handleArrayChange = (key, index, subKey, val) => {
    const arr = [...testPayload[key]];
    if (typeof arr[index] === 'object') {
      arr[index] = { ...arr[index], [subKey]: val };
    } else {
      arr[index] = val;
    }
    setTestPayload(prev => ({ ...prev, [key]: arr }));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="API Node Diagnostics"
      subtitle={endpoint.d}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {endpoint.b && (
          <div className="p-4 bg-[#f6f7f7] border border-[#dcdcde] space-y-4">
            <h4 className="text-[10px] font-bold text-[#1d2327] uppercase tracking-widest border-b border-[#dcdcde] pb-2 text-center">Transmission Parameters</h4>
            <div className="grid grid-cols-1 gap-4">
              {Object.keys(testPayload).map(key => {
                if (key === 'targets' && Array.isArray(testPayload[key])) {
                  return (
                    <div key={key} className="space-y-2">
                      <label className="text-[10px] font-bold text-[#a7aaad] uppercase italic">{key}</label>
                      {testPayload[key].map((target, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white p-2 border border-[#dcdcde] shadow-sm">
                          <input type="text" className="flex-1 wp-input font-mono text-[10px] py-1" value={target.id} onChange={(e) => handleArrayChange(key, idx, 'id', e.target.value)} placeholder="Target ID" />
                          <select className="wp-input text-[10px] font-bold py-1 px-2 uppercase" value={target.type} onChange={(e) => handleArrayChange(key, idx, 'type', e.target.value)}>
                            <option value="individual">Individual</option>
                            <option value="group">Group</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  );
                }
                if (key === 'options' && Array.isArray(testPayload[key])) {
                  return (
                    <div key={key} className="space-y-2">
                      <label className="text-[10px] font-bold text-[#a7aaad] uppercase italic">{key}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {testPayload[key].map((opt, idx) => (
                          <input key={idx} type="text" className="wp-input font-mono text-[10px] py-1 bg-white" value={opt} onChange={(e) => handleArrayChange(key, idx, null, e.target.value)} />
                        ))}
                      </div>
                    </div>
                  );
                }
                if (key === 'participants' && Array.isArray(testPayload[key])) {
                  return (
                    <div key={key} className="space-y-2">
                      <label className="text-[10px] font-bold text-[#a7aaad] uppercase italic">{key} (CSV)</label>
                      <input type="text" className="w-full wp-input font-mono text-[10px] py-1 bg-white" value={testPayload[key].join(', ')} onChange={(e) => handleFieldChange(key, e.target.value.split(',').map(p => p.trim()))} />
                    </div>
                  );
                }
                if (key === 'mediaType') {
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-bold text-[#a7aaad] uppercase italic">{key}</label>
                      <select className="w-full wp-input text-[10px] font-bold py-1 uppercase bg-white" value={testPayload[key]} onChange={(e) => handleFieldChange(key, e.target.value)}>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="document">Document</option>
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-[#a7aaad] uppercase italic">{key}</label>
                    {typeof testPayload[key] === 'boolean' ? (
                      <select className="w-full wp-input text-[10px] font-bold py-1 uppercase bg-white" value={testPayload[key].toString()} onChange={(e) => handleFieldChange(key, e.target.value === 'true')}>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <textarea rows={testPayload[key].length > 50 ? 3 : 1} className="w-full wp-input font-mono text-[10px] py-1 bg-white resize-none" value={testPayload[key]} onChange={(e) => handleFieldChange(key, e.target.value)} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Vector Transmission Blueprint (cURL)</label>
            <button 
              type="button"
              onClick={() => { navigator.clipboard.writeText(curl); }}
              className="text-[10px] text-[#2271b1] font-bold hover:underline uppercase"
            >
              Copy Blueprint
            </button>
          </div>
          <pre className="p-4 bg-[#262c33] text-white text-xs font-mono rounded-sm whitespace-pre-wrap break-all leading-relaxed shadow-inner border border-black/20">
            {curl}
          </pre>
        </div>

        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => onTest({ ...endpoint, b: currentPayload })}
            disabled={loading}
            className="flex-1 wp-button-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Execute Vector Test
          </button>
          <button type="button" onClick={onClose} className="px-8 wp-button-secondary font-bold uppercase tracking-widest">Close</button>
        </div>

        {result && (
          <div className={`mt-4 p-4 rounded-sm border-l-4 ${result.success ? 'bg-[#edfaef] border-[#00a32a]' : 'bg-[#fcf0f1] border-[#d63638]'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-black uppercase tracking-widest ${result.success ? 'text-[#00a32a]' : 'text-[#d63638]'}`}>Transmission Feedback [HTTP ${result.status}]</span>
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all bg-white/50 p-3 rounded-sm border border-black/5 text-[#1d2327] max-h-60 overflow-y-auto custom-scrollbar">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default APIEndpointModal;
