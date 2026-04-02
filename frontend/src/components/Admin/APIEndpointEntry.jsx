import React from 'react';

const APIEndpointEntry = ({ endpoint, onClick }) => {
  return (
    <div className="flex flex-col border-b border-[#f0f0f1] pb-1.5 group">
      <div className="flex items-center justify-between p-1 hover:bg-[#f6f7f7] rounded-sm transition-colors">
        <div className="flex flex-col items-start text-left min-w-0 flex-1">
          <p className="text-[10px] font-black text-[#1d2327] uppercase tracking-tighter mb-1">{endpoint.n || 'API Node'}</p>
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${endpoint.m === 'GET' ? 'bg-[#edfaef] text-[#00a32a]' : 'bg-[#fcf0f1] text-[#d63638]'}`}>{endpoint.m}</span>
            {endpoint.mo && <span className="text-[9px] font-black bg-[#edfaef] text-[#00a32a] px-1 border border-[#00a32a] rounded-sm uppercase tracking-tighter">MO-Key</span>}
            <code className="text-xs font-mono text-[#1d2327] font-bold truncate">{endpoint.p}</code>
          </div>
          <p className="text-[10px] text-[#646970] font-medium truncate w-full">{endpoint.d}</p>
        </div>
        <button 
          type="button"
          onClick={() => onClick(endpoint)}
          className="ml-2 px-3 py-1.5 bg-[#2271b1] text-white text-[9px] font-bold uppercase rounded-sm hover:bg-[#135e96] transition-all shadow-sm flex-shrink-0"
        >
          Diagnostics
        </button>
      </div>
    </div>
  );
};

export default APIEndpointEntry;
