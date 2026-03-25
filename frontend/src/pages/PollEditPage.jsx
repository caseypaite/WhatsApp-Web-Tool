import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { 
  ArrowLeft, Save, X, Plus, Trash2, 
  RefreshCw, BarChart2, User, Shield, Image as ImageIcon,
  AlertCircle, CheckCircle, Info
} from 'lucide-react';

const PollEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myGroups, setMyGroups] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [pollData, groupsData] = await Promise.all([
          authService.getPollDetails(id),
          authService.getMyGroups()
        ]);
        setPoll(pollData);
        setMyGroups(groupsData || []);
      } catch (err) {
        setError('Failed to load poll details or your groups.');
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
      setSuccess('File uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setError('File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdatePoll = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.updateAdvancedPoll(id, poll);
      setSuccess('Poll updated successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update poll.');
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <RefreshCw className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!poll && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <AlertCircle className="w-16 h-16 text-red-400 mb-6" />
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Poll Not Found</h2>
        <p className="text-slate-500 font-medium mb-8">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest flex items-center gap-3">
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Edit Decision Unit</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex items-center gap-2 px-6 py-2.5 text-slate-500 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpdatePoll}
              disabled={actionLoading}
              className="flex items-center gap-2 px-8 py-2.5 bg-primary-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-primary-900/20 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50"
            >
              {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-10">
        {error && (
          <div className="mb-8 p-5 bg-red-50 text-red-700 rounded-3xl border border-red-100 flex items-center gap-4 animate-in slide-in-from-top-4">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-bold">{error}</p>
            <button onClick={() => setError('')} className="ml-auto p-2 hover:bg-red-100 rounded-full transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        {success && (
          <div className="mb-8 p-5 bg-green-50 text-green-700 rounded-3xl border border-green-100 flex items-center gap-4 animate-in slide-in-from-top-4">
            <CheckCircle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-bold">{success}</p>
          </div>
        )}

        <form onSubmit={handleUpdatePoll} className="space-y-10">
          {/* Header Image Section */}
          <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            <div 
              className="h-48 bg-slate-900 relative flex items-center justify-center overflow-hidden"
              style={poll.background_image_url ? { 
                backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.6)), url(${poll.background_image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            >
              {!poll.background_image_url && (
                <div className="text-center space-y-2 opacity-30">
                  <ImageIcon className="w-12 h-12 text-white mx-auto" />
                  <p className="text-white text-[10px] font-black uppercase tracking-widest">No Background Image</p>
                </div>
              )}
              <div className="absolute bottom-6 right-6">
                <input 
                  type="file" 
                  id="poll-bg-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files[0], (url) => setPoll({...poll, background_image_url: url}))} 
                />
                <label 
                  htmlFor="poll-bg-upload" 
                  className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase cursor-pointer hover:bg-slate-50 transition-all shadow-xl shadow-black/20"
                >
                  {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                  Change Backdrop
                </label>
              </div>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Decision Title</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-black text-xl transition-all" 
                  value={poll.title} 
                  onChange={(e) => setPoll({...poll, title: e.target.value})} 
                  placeholder="e.g. 2026 Executive Council Election"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description / Context</label>
                <textarea 
                  required 
                  rows="4"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-medium text-sm resize-none transition-all leading-relaxed" 
                  value={poll.description} 
                  onChange={(e) => setPoll({...poll, description: e.target.value})} 
                  placeholder="Provide details about this decision process..."
                />
              </div>
            </div>
          </section>

          {/* Configuration Section */}
          <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100"><Shield className="w-5 h-5" /></div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Access & Timeline</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-bold text-sm appearance-none" 
                  value={poll.status} 
                  onChange={(e) => setPoll({...poll, status: e.target.value})}
                >
                  <option value="OPEN">OPEN (Accepting Votes)</option>
                  <option value="CLOSED">CLOSED (Read Only / Ended)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Protocol</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-bold text-sm appearance-none" 
                  value={poll.access_type} 
                  onChange={(e) => setPoll({...poll, access_type: e.target.value})}
                >
                  <option value="PUBLIC">PUBLIC (Anyone with link)</option>
                  <option value="CLOSED">CLOSED (Organizational Group Only)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Associated Group</label>
                <select 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-bold text-sm appearance-none" 
                  value={poll.group_id || ''} 
                  onChange={(e) => setPoll({...poll, group_id: e.target.value || null})}
                >
                  <option value="">No Group (Global)</option>
                  {myGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Results Visibility</label>
                <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-600 uppercase">Publish Results Now</span>
                  <button 
                    type="button" 
                    onClick={() => setPoll({...poll, results_published: !poll.results_published})}
                    className={`w-14 h-8 rounded-full transition-all relative ${poll.results_published ? 'bg-primary-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${poll.results_published ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mt-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activation (Starts At)</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-bold text-sm" 
                  value={poll.starts_at ? new Date(new Date(poll.starts_at).getTime() - new Date(poll.starts_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                  onChange={(e) => setPoll({...poll, starts_at: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Termination (Ends At)</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-bold text-sm" 
                  value={poll.ends_at ? new Date(new Date(poll.ends_at).getTime() - new Date(poll.ends_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} 
                  onChange={(e) => setPoll({...poll, ends_at: e.target.value})} 
                />
              </div>
            </div>
          </section>

          {/* Options / Candidates Section */}
          <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100"><BarChart2 className="w-5 h-5" /></div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{poll.type === 'ELECTION' ? 'Candidates List' : 'Voting Options'}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{poll.type} Type Module</p>
                </div>
              </div>
              {poll.type === 'ELECTION' && (
                <button 
                  type="button" 
                  onClick={addCandidate}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Candidate
                </button>
              )}
            </div>

            {poll.type === 'GENERAL' ? (
              <div className="space-y-4">
                {poll.options && poll.options.map((opt, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold text-slate-700">{opt}</div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">Fixed</div>
                  </div>
                ))}
                <div className="p-6 bg-amber-50 rounded-[1.5rem] border border-amber-100 flex items-start gap-4">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">Voting options for GENERAL polls are currently immutable after creation to maintain data integrity. If you need new options, please create a new decision unit.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {poll.candidates && poll.candidates.map((cand, i) => (
                  <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 relative group animate-in slide-in-from-bottom-2 duration-300">
                    <button 
                      type="button" 
                      onClick={() => removeCandidate(i)}
                      className="absolute top-6 right-6 p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col md:flex-row gap-8">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-32 h-32 bg-white rounded-[2rem] overflow-hidden shadow-inner border-4 border-white">
                          {cand.photo_url ? (
                            <img src={cand.photo_url} alt={cand.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                              <User className="w-12 h-12" />
                            </div>
                          )}
                        </div>
                        <input 
                          type="file" 
                          id={`cand-photo-${i}`} 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e.target.files[0], (url) => updateCandidate(i, 'photo_url', url))}
                        />
                        <label 
                          htmlFor={`cand-photo-${i}`} 
                          className="text-[9px] font-black text-primary-600 uppercase tracking-widest hover:underline cursor-pointer"
                        >
                          Upload Photo
                        </label>
                      </div>

                      <div className="flex-1 space-y-6">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Candidate Name</label>
                          <input 
                            type="text" 
                            required 
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-bold text-sm transition-all shadow-sm" 
                            value={cand.name} 
                            onChange={(e) => updateCandidate(i, 'name', e.target.value)} 
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manifesto Summary</label>
                          <input 
                            type="text" 
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-medium text-sm transition-all shadow-sm" 
                            value={cand.manifesto} 
                            onChange={(e) => updateCandidate(i, 'manifesto', e.target.value)} 
                            placeholder="Briefly state the core mission..."
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Biography / Career Node</label>
                          <textarea 
                            rows="3"
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-primary-100 outline-none font-medium text-sm resize-none transition-all shadow-sm leading-relaxed" 
                            value={cand.biography} 
                            onChange={(e) => updateCandidate(i, 'biography', e.target.value)} 
                            placeholder="Describe candidate background..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {(!poll.candidates || poll.candidates.length === 0) && (
                  <div className="py-20 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200 text-center space-y-4">
                    <User className="w-12 h-12 text-slate-200 mx-auto" />
                    <div>
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Candidates Configured</h4>
                      <p className="text-xs text-slate-400">Click the button above to add election participants.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="pt-10 flex flex-col sm:flex-row gap-4 items-center justify-center border-t border-slate-200">
            <button 
              type="submit" 
              disabled={actionLoading}
              className="w-full sm:w-auto px-12 py-5 bg-primary-600 text-white font-black text-sm uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl shadow-primary-900/30 hover:bg-primary-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Finalize & Update Unit
            </button>
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-10 py-5 bg-white text-slate-500 font-black text-xs uppercase tracking-widest rounded-[2rem] border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Abort Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PollEditPage;
