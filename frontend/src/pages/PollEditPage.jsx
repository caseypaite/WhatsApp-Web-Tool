import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, Save, X, Plus, Trash2, 
  RefreshCw, BarChart2, User, Shield, Image as ImageIcon,
  AlertCircle, CheckCircle, Info, ShieldCheck, Zap, LogOut, Menu, Home, Settings as SettingsIcon,
  ChevronDown, ChevronUp, Lock, Activity, Layout
} from 'lucide-react';

const PollEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout, siteName } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myGroups, setMyGroups] = useState([]);
  const [waGroups, setWaGroups] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [pollData, groupsData, waChats] = await Promise.all([
          authService.getPollDetails(id),
          authService.getMyGroups(),
          authService.getWhatsappChats().catch(() => [])
        ]);
        setPoll(pollData);
        setMyGroups(groupsData || []);
        setWaGroups(waChats.filter(c => c.isGroup && c.isAdmin) || []);
      } catch (err) {
        setError('Failed to load unit parameters.');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id]);

  const handleFileUpload = async (file, onSuccess) => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      const data = await authService.uploadFile(file);
      onSuccess(data.url);
      setSuccess('Resource packet uploaded.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdatePoll = async (e) => {
    if (e) e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.updateAdvancedPoll(id, poll);
      setSuccess('Unit parameters synchronized.');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Synchronization failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const addCandidate = () => {
    setPoll({
      ...poll,
      candidates: [...(poll.candidates || []), { name: '', photo_url: '', manifesto: '', biography: '' }]
    });
  };

  const removeCandidate = (index) => {
    const newCandidates = [...poll.candidates];
    newCandidates.splice(index, 1);
    setPoll({ ...poll, candidates: newCandidates });
  };

  const updateCandidate = (index, field, value) => {
    const newCandidates = [...poll.candidates];
    newCandidates[index] = { ...newCandidates[index], [field]: value };
    setPoll({ ...poll, candidates: newCandidates });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f0f0f1]">
        <div className="w-8 h-8 border-4 border-[#dcdcde] border-t-[#2271b1] rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Identity Profile', icon: User, path: '/dashboard' },
    { id: 'security', label: 'Security Node', icon: Lock, path: '/dashboard' },
    { id: 'polls', label: 'Decision Units', icon: BarChart2, path: '/dashboard' },
    { id: 'messages', label: 'Interaction Stream', icon: Activity, path: '/dashboard' },
  ];

  return (
    <div className="flex min-h-screen bg-[#f0f0f1] text-[#3c434a] font-sans">
      {/* SIDEBAR */}
      <aside className={`bg-[#1d2327] transition-all duration-200 z-40 fixed lg:static h-full shadow-lg ${isSidebarCollapsed ? 'w-12' : 'w-48'}`}>
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="py-4 px-3 mb-2 flex items-center gap-2 border-b border-[#2c3338]">
            <Zap className="w-5 h-5 text-[#72aee6]" />
            {!isSidebarCollapsed && <h1 className="text-sm font-bold text-white uppercase tracking-tight">{siteName}</h1>}
          </div>

          <nav className="flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`w-full wp-sidebar-link ${tab.id === 'polls' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <tab.icon className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>{tab.label}</span>}
              </button>
            ))}
            
            <div className="mt-4 pt-4 border-t border-[#2c3338]">
               {user?.roles?.includes('Admin') && (
                <button 
                  onClick={() => navigate('/admin')}
                  className={`w-full wp-sidebar-link ${isSidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  {!isSidebarCollapsed && <span>Root Terminal</span>}
                </button>
              )}
              <button 
                onClick={logout} 
                className={`w-full wp-sidebar-link hover:text-[#d63638] ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Terminate Session</span>}
              </button>
            </div>
          </nav>
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="mt-auto py-3 px-4 text-[#a7aaad] hover:text-white flex items-center gap-2 transition-colors border-t border-[#2c3338]"
          >
            <Menu className="w-4 h-4" />
            {!isSidebarCollapsed && <span className="text-xs uppercase tracking-widest font-bold">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-[#dcdcde] px-4 py-2 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-1 text-[#646970] hover:text-[#2271b1] transition-colors"><ArrowLeft className="w-5 h-5" /></button>
            <h2 className="text-xl font-medium text-[#1d2327]">Edit Poll</h2>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => navigate('/dashboard')} className="wp-button-secondary border-none shadow-none text-[#646970] hover:text-[#d63638]">Discard</button>
             <button onClick={handleUpdatePoll} disabled={actionLoading} className="wp-button-primary px-6 flex items-center gap-2">
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Poll
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {error && (
            <div className="mb-6 p-3 bg-[#fcf0f1] text-[#d63638] border-l-4 border-[#d63638] text-sm font-medium shadow-sm animate-in fade-in">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 bg-[#edfaef] text-[#00a32a] border-l-4 border-[#00a32a] text-sm font-medium shadow-sm animate-in fade-in">
              {success}
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
             {/* Main Form Column */}
             <div className="lg:col-span-3 space-y-6">
                <div className="wp-card p-6">
                   <div className="space-y-6">
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Poll Title</label>
                         <input type="text" required className="w-full wp-input text-lg font-bold" value={poll.title} onChange={(e) => setPoll({...poll, title: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Description</label>
                         <textarea rows="6" required className="w-full wp-input resize-none italic leading-relaxed" value={poll.description} onChange={(e) => setPoll({...poll, description: e.target.value})} />
                      </div>
                   </div>
                </div>

                {/* Options / Candidates */}
                <div className="wp-card">
                   <div className="px-4 py-3 border-b border-[#dcdcde] bg-[#f6f7f7] flex justify-between items-center">
                      <h3 className="text-sm font-semibold">{poll.type === 'ELECTION' ? 'Candidates' : 'Poll Options'}</h3>
                      {poll.type === 'ELECTION' && (
                        <button type="button" onClick={addCandidate} className="wp-button-secondary py-1 flex items-center gap-1 text-[10px]">
                           <Plus className="w-3.5 h-3.5" /> Initialize Candidate
                        </button>
                      )}
                   </div>
                   <div className="p-6">
                      {poll.type === 'GENERAL' ? (
                        <div className="space-y-2">
                           {poll.options?.map((opt, i) => (
                             <div key={i} className="flex gap-2">
                                <div className="flex-1 bg-[#f6f7f7] border border-[#dcdcde] px-4 py-3 text-sm font-bold text-[#3c434a] shadow-inner">{opt}</div>
                                <div className="px-4 py-3 bg-[#f0f0f1] text-[9px] font-bold text-[#a7aaad] uppercase flex items-center border border-[#dcdcde]">Immutable</div>
                             </div>
                           ))}
                           <div className="p-4 bg-[#fcf9e8] border border-[#dba617] text-[10px] font-medium leading-relaxed italic mt-4">
                              Selection nodes for general units are locked post-initialization to ensure interaction integrity.
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                           {poll.candidates?.map((cand, i) => (
                             <div key={i} className="p-6 bg-[#f6f7f7] border border-[#dcdcde] relative group transition-all hover:bg-white">
                                <button type="button" onClick={() => removeCandidate(i)} className="absolute top-2 right-2 p-1.5 text-[#d63638] hover:bg-[#fcf0f1] rounded transition-all"><Trash2 className="w-4 h-4" /></button>
                                <div className="flex flex-col md:flex-row gap-6">
                                   <div className="flex flex-col items-center gap-2">
                                      <div className="w-24 h-24 bg-white border border-[#dcdcde] flex items-center justify-center overflow-hidden shadow-inner">
                                         {cand.photo_url ? <img src={cand.photo_url} className="w-full h-full object-cover" alt="" /> : <User className="w-10 h-10 text-[#dcdcde]" />}
                                      </div>
                                      <input type="file" id={`cand-${i}`} className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], (url) => updateCandidate(i, 'photo_url', url))} />
                                      <label htmlFor={`cand-${i}`} className="text-[9px] font-bold text-[#2271b1] hover:underline cursor-pointer uppercase tracking-tighter">Upload Vector</label>
                                   </div>
                                   <div className="flex-1 space-y-4">
                                      <input type="text" required className="w-full wp-input font-bold" placeholder="Candidate Name" value={cand.name} onChange={(e) => updateCandidate(i, 'name', e.target.value)} />
                                      <input type="text" className="w-full wp-input text-xs" placeholder="Manifesto Headline" value={cand.manifesto} onChange={(e) => updateCandidate(i, 'manifesto', e.target.value)} />
                                      <textarea rows="3" className="w-full wp-input text-xs resize-none leading-relaxed" placeholder="Detailed Biography..." value={cand.biography} onChange={(e) => updateCandidate(i, 'biography', e.target.value)} />
                                   </div>
                                </div>
                             </div>
                           ))}
                           {(!poll.candidates || poll.candidates.length === 0) && (
                             <div className="py-12 border-2 border-dashed border-[#dcdcde] text-center text-[#a7aaad] flex flex-col items-center gap-3">
                                <User className="w-10 h-10 opacity-30" />
                                <p className="text-xs font-bold uppercase tracking-widest">Awaiting Candidate Input</p>
                             </div>
                           )}
                        </div>
                      )}
                   </div>
                </div>
             </div>

             {/* Sidebar Settings Column */}
             <div className="lg:col-span-1 space-y-6">
                {/* Publish Box */}
                <div className="wp-card">
                   <div className="px-4 py-2 border-b border-[#dcdcde] bg-[#f6f7f7]"><h3 className="text-xs font-bold uppercase">Poll Status</h3></div>
                   <div className="p-4 space-y-4">
                      <div className="space-y-2">
                         <div className="flex items-center gap-2 text-xs">
                            <Activity className="w-3.5 h-3.5 text-[#646970]" />
                            <span className="text-[#646970]">Status:</span>
                            <select className="bg-transparent border-none p-0 font-bold text-[#1d2327] outline-none cursor-pointer" value={poll.status} onChange={(e) => setPoll({...poll, status: e.target.value})}>
                               <option value="OPEN">Open</option>
                               <option value="CLOSED">Closed</option>
                            </select>
                         </div>
                         <div className="flex items-center gap-2 text-xs">
                            <Globe className="w-3.5 h-3.5 text-[#646970]" />
                            <span className="text-[#646970]">Access:</span>
                            <span className="font-bold text-[#1d2327]">{poll.access_type}</span>
                         </div>
                         <div className="flex items-center gap-2 text-xs text-[#646970]">
                            <History className="w-3.5 h-3.5" />
                            <span>Created: <strong>{new Date(poll.created_at).toLocaleDateString()}</strong></span>
                         </div>
                      </div>
                      <div className="pt-4 border-t border-[#f0f0f1] flex items-center justify-between">
                         <span className="text-[10px] font-bold text-[#646970] uppercase">Publish Results</span>
                         <button onClick={() => setPoll({...poll, results_published: !poll.results_published})} className={`w-10 h-5 rounded-full relative transition-all ${poll.results_published ? 'bg-[#2271b1]' : 'bg-[#dcdcde]'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${poll.results_published ? 'left-5.5 shadow-sm' : 'left-0.5 shadow-sm'}`} />
                         </button>
                      </div>
                   </div>
                   <div className="px-4 py-3 bg-[#f6f7f7] border-t border-[#dcdcde] flex justify-between">
                      <button onClick={() => navigate('/dashboard')} className="text-[#d63638] text-[10px] font-bold uppercase hover:underline">Delete Poll</button>
                      <button onClick={handleUpdatePoll} disabled={actionLoading} className="wp-button-primary py-1 px-4 text-xs">Update</button>
                   </div>
                </div>

                {/* Protocol Settings */}
                <div className="wp-card">
                   <div className="px-4 py-2 border-b border-[#dcdcde] bg-[#f6f7f7]"><h3 className="text-xs font-bold uppercase">Protocol Settings</h3></div>
                   <div className="p-4 space-y-4">
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Target Access Unit</label>
                         <select 
                            className="w-full wp-input text-xs" 
                            value={
                              poll.access_type === 'PUBLIC' ? 'PUBLIC' : 
                              poll.group_id ? `INTERNAL:${poll.group_id}` : 
                              poll.wa_jid ? `WHATSAPP:${poll.wa_jid}` : 'PUBLIC'
                            } 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'PUBLIC') {
                                setPoll({...poll, access_type: 'PUBLIC', group_id: null, wa_jid: null});
                              } else if (val.startsWith('INTERNAL:')) {
                                setPoll({...poll, access_type: 'CLOSED', group_id: val.split(':')[1], wa_jid: null});
                              } else if (val.startsWith('WHATSAPP:')) {
                                setPoll({...poll, access_type: 'CLOSED', group_id: null, wa_jid: val.split(':')[1]});
                              }
                            }}
                          >
                            <option value="PUBLIC">🌍 Public Network</option>
                            <optgroup label="Internal Units">
                              {myGroups.map(g => <option key={g.id} value={`INTERNAL:${g.id}`}>🏠 {g.name}</option>)}
                            </optgroup>
                            <optgroup label="WhatsApp Units">
                              {waGroups.map(g => <option key={g.id?._serialized} value={`WHATSAPP:${g.id?._serialized}`}>💬 {g.name}</option>)}
                            </optgroup>
                         </select>
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-[#a7aaad] uppercase">Start Date</label>
                         <input type="datetime-local" className="w-full wp-input text-[10px]" value={poll.starts_at ? new Date(new Date(poll.starts_at).getTime() - new Date(poll.starts_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setPoll({...poll, starts_at: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[10px] font-bold text-[#a7aaad] uppercase">End Date</label>
                         <input type="datetime-local" className="w-full wp-input text-[10px]" value={poll.ends_at ? new Date(new Date(poll.ends_at).getTime() - new Date(poll.ends_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={(e) => setPoll({...poll, ends_at: e.target.value})} />
                      </div>
                   </div>
                </div>

                {/* Featured Vector */}
                <div className="wp-card">
                   <div className="px-4 py-2 border-b border-[#dcdcde] bg-[#f6f7f7]"><h3 className="text-xs font-bold uppercase">Featured Vector</h3></div>
                   <div className="p-4 space-y-4 text-center">
                      <div className="aspect-video bg-[#f6f7f7] border border-[#dcdcde] overflow-hidden shadow-inner flex items-center justify-center relative group">
                         {poll.background_image_url ? (
                           <>
                             <img src={poll.background_image_url} className="w-full h-full object-cover" alt="" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button type="button" onClick={() => setPoll({...poll, background_image_url: ''})} className="text-white text-[10px] font-bold underline">Remove</button>
                             </div>
                           </>
                         ) : <ImageIcon className="w-8 h-8 text-[#dcdcde]" />}
                      </div>
                      <input type="file" id="bg-vector" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e.target.files[0], (url) => setPoll({...poll, background_image_url: url}))} />
                      <label htmlFor="bg-vector" className="text-[10px] font-bold text-[#2271b1] hover:underline cursor-pointer uppercase">Set Featured Vector</label>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PollEditPage;
