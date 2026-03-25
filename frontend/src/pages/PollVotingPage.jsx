import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { 
  BarChart2, ArrowLeft, Phone, ShieldCheck, 
  User, CheckCircle, AlertCircle, RefreshCw, X 
} from 'lucide-react';

const PollVotingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [votingData, setVotingData] = useState({ 
    pollId: id, phone_number: '', otp: '', option_selected: '', candidate_id: null 
  });
  const [otpSent, setOtpSent] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const data = await authService.getPollDetails(id);
        setPoll(data);
        const now = new Date();
        if (data.starts_at && new Date(data.starts_at) > now) {
          setError(`This poll is scheduled to start on ${new Date(data.starts_at).toLocaleString()}.`);
        } else if (data.ends_at && new Date(data.ends_at) < now) {
          setError('This poll has ended.');
        } else if (data.status !== 'OPEN') {
          setError('This poll is not currently accepting votes.');
        }
      } catch (err) {
        setError('Poll not found or inactive.');
      } finally {
        setLoading(false);
      }
    };
    fetchPoll();
  }, [id]);

  const handleRequestOtp = async (confirmView = false) => {
    if (!votingData.phone_number) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await authService.requestVoteOtp(id, votingData.phone_number, confirmView);
      if (res.already_voted && !confirmView) {
        setNeedsConfirmation(true);
        setSuccess(res.message);
        return;
      }
      setOtpSent(true);
      setNeedsConfirmation(false);
      setIsViewing(confirmView || res.already_voted);
      setSuccess('OTP sent to your mobile number.');
    } catch (err) {
      setError('Failed to send OTP. Please check the number.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCastVote = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await authService.verifyAndVote(votingData);
      if (res.already_voted) {
        setSuccess(res.message);
        setIsViewing(true);
      } else {
        setSuccess('Vote cast successfully! Redirecting...');
        setTimeout(() => navigate('/'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <RefreshCw className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <AlertCircle className="w-16 h-16 text-red-400 mb-6" />
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Decision Unit Offline</h2>
        <p className="text-slate-500 font-medium mb-8">{error}</p>
        <button onClick={() => navigate('/')} className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest flex items-center gap-3">
          <ArrowLeft className="w-5 h-5" /> Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center py-12 px-4 md:py-20">
      <div className="w-full max-w-2xl">
        <button onClick={() => navigate('/')} className="mb-10 text-slate-400 hover:text-primary-600 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-colors">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
          <header 
            className="p-10 md:p-14 bg-slate-900 text-white relative overflow-hidden"
            style={poll.background_image_url ? { 
              backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.9)), url(${poll.background_image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <BarChart2 className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">{poll.type}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tightest leading-none uppercase mb-4">{poll.title}</h1>
              <p className="text-slate-400 font-medium leading-relaxed max-w-lg">{poll.description}</p>
            </div>
          </header>

          <div className="p-10 md:p-14 space-y-10">
            {success && (
              <div className="p-5 bg-green-50 text-green-700 rounded-2xl border border-green-100 flex items-center gap-4 animate-in slide-in-from-left-4">
                <CheckCircle className="w-6 h-6" />
                <p className="text-sm font-black uppercase tracking-widest leading-tight">{success}</p>
              </div>
            )}

            {error && (
              <div className="p-5 bg-red-50 text-red-700 rounded-2xl border border-red-100 flex items-center gap-4 animate-in slide-in-from-left-4">
                <AlertCircle className="w-6 h-6" />
                <p className="text-sm font-black uppercase tracking-widest leading-tight">{error}</p>
              </div>
            )}

            {/* Public Candidate/Option View */}
            {(!otpSent || isViewing) && (
              <div className="space-y-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">
                  {isViewing ? 'Your Decision Summary' : 'Available Options'}
                </label>
                
                <div className="grid gap-6">
                  {poll.type === 'GENERAL' ? (
                    <div className="grid gap-4">
                      {poll.options.map(opt => (
                        <div 
                          key={opt} 
                          className={`p-6 rounded-[2rem] border-2 text-left flex items-center justify-between ${votingData.option_selected === opt ? 'border-primary-600 bg-primary-50' : 'border-slate-100 bg-white'}`}
                        >
                          <span className="text-lg font-black text-slate-700">{opt}</span>
                          {!otpSent && (
                            <button 
                              onClick={() => setVotingData({...votingData, option_selected: opt, candidate_id: null})}
                              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${votingData.option_selected === opt ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                            >
                              {votingData.option_selected === opt ? 'Selected' : 'Select'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {poll.candidates?.map(cand => (
                        <div 
                          key={cand.id} 
                          className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col md:flex-row gap-8 ${votingData.candidate_id === cand.id ? 'border-primary-600 bg-primary-50 shadow-xl' : 'border-slate-100 bg-white'}`}
                        >
                          <div className="w-24 h-24 bg-slate-100 rounded-3xl overflow-hidden flex-shrink-0 border-2 border-white shadow-lg">
                            {cand.photo_url ? <img src={cand.photo_url} alt={cand.name} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-slate-300" />}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-xl font-black uppercase tracking-tightest text-slate-900">{cand.name}</h5>
                              {!otpSent && (
                                <button 
                                  onClick={() => setVotingData({...votingData, candidate_id: cand.id, option_selected: null})}
                                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${votingData.candidate_id === cand.id ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                >
                                  {votingData.candidate_id === cand.id ? 'Selected' : 'Select'}
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-medium italic leading-relaxed line-clamp-2 mb-4">"{cand.manifesto}"</p>
                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                              <button 
                                onClick={() => { setSelectedCandidate(cand); setShowCandidateModal(true); }}
                                className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                              >
                                View Full Profile
                              </button>
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-primary-500" />
                                <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Verified Identity</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!otpSent ? (
              <div className="pt-10 border-t-2 border-dashed border-slate-100 space-y-8">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 text-center">Verify Identity to Cast Vote</label>
                  <div className="max-w-md mx-auto">
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                        <input 
                          type="tel" 
                          required 
                          disabled={needsConfirmation}
                          className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-black text-lg outline-none focus:ring-4 focus:ring-primary-100 shadow-inner disabled:opacity-50" 
                          placeholder="Phone Number (91)" 
                          value={votingData.phone_number} 
                          onChange={(e) => setVotingData({...votingData, phone_number: e.target.value})} 
                        />
                      </div>
                      {!needsConfirmation && (
                        <button 
                          onClick={() => handleRequestOtp(false)} 
                          disabled={actionLoading || !votingData.phone_number || (!votingData.option_selected && !votingData.candidate_id)}
                          className="px-8 bg-primary-600 text-white text-[11px] font-black rounded-[1.5rem] uppercase tracking-widest shadow-xl shadow-primary-900/20 active:scale-95 transform transition-all hover:bg-primary-700 disabled:opacity-50"
                        >
                          Request OTP
                        </button>
                      )}
                    </div>
                    
                    {needsConfirmation && (
                      <div className="flex gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
                        <button 
                          onClick={() => handleRequestOtp(true)} 
                          disabled={actionLoading}
                          className="flex-1 py-5 bg-primary-600 text-white text-[11px] font-black rounded-2xl uppercase tracking-widest shadow-lg active:scale-95 transform transition-all"
                        >
                          Send OTP to View My Vote
                        </button>
                        <button 
                          onClick={() => { setNeedsConfirmation(false); setSuccess(''); }} 
                          disabled={actionLoading}
                          className="px-8 py-5 bg-slate-100 text-slate-500 text-[11px] font-black rounded-2xl uppercase tracking-widest hover:bg-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center gap-5 italic text-slate-400 font-medium text-center">
                  <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                  <p className="text-xs">OTP will be sent to your WhatsApp unit for cryptographic identity verification.</p>
                </div>
              </div>
            ) : !isViewing && (
              <div className="pt-10 border-t-2 border-dashed border-slate-100 space-y-8 animate-in slide-in-from-bottom-4">
                <div className="space-y-4 text-center max-w-sm mx-auto">
                  <label className="block text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] text-center">Authorization Packet</label>
                  <input 
                    type="text" 
                    maxLength="6" 
                    className="w-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-center font-black tracking-[1em] text-4xl focus:ring-8 focus:ring-primary-100 outline-none shadow-inner transition-all" 
                    placeholder="000000" 
                    value={votingData.otp} 
                    onChange={(e) => setVotingData({...votingData, otp: e.target.value})} 
                  />
                </div>
                
                <button 
                  onClick={handleCastVote} 
                  disabled={actionLoading || votingData.otp.length !== 6} 
                  className="w-full py-6 bg-green-600 text-white text-xs font-black rounded-[2rem] uppercase tracking-[0.4em] shadow-2xl shadow-green-900/30 hover:bg-green-700 transition-all active:scale-95 transform disabled:opacity-50"
                >
                  Finalize Decision
                </button>
                
                <button 
                  onClick={() => { setOtpSent(false); setVotingData({...votingData, otp: ''}); }}
                  className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                  Change Selection / Phone
                </button>
              </div>
            )}

            {otpSent && isViewing && (
              <div className="pt-10 border-t-2 border-dashed border-slate-100 space-y-8 animate-in slide-in-from-bottom-4">
                <div className="space-y-4 text-center max-w-sm mx-auto">
                  <label className="block text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] text-center">Verify Identity to View</label>
                  <input 
                    type="text" 
                    maxLength="6" 
                    className="w-full px-6 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-center font-black tracking-[1em] text-4xl focus:ring-8 focus:ring-primary-100 outline-none shadow-inner transition-all" 
                    placeholder="000000" 
                    value={votingData.otp} 
                    onChange={(e) => setVotingData({...votingData, otp: e.target.value})} 
                  />
                </div>
                <button 
                  onClick={handleCastVote} 
                  disabled={actionLoading || votingData.otp.length !== 6} 
                  className="w-full py-6 bg-primary-600 text-white text-xs font-black rounded-[2rem] uppercase tracking-[0.4em] shadow-2xl shadow-primary-900/30 hover:bg-primary-700 transition-all active:scale-95 transform disabled:opacity-50"
                >
                  View My Decision
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Profile Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="relative h-64 bg-slate-100">
              {selectedCandidate.photo_url ? (
                <img src={selectedCandidate.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                  <User className="w-20 h-20" />
                </div>
              )}
              <button 
                onClick={() => setShowCandidateModal(false)}
                className="absolute top-6 right-6 p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-3xl font-black text-white uppercase tracking-tightest">{selectedCandidate.name}</h3>
                <p className="text-primary-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-2">Official Candidate Node</p>
              </div>
            </div>
            
            <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Biography</h4>
                <p className="text-slate-600 leading-relaxed font-medium">{selectedCandidate.biography}</p>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Manifesto</h4>
                <div className="p-6 bg-primary-50 rounded-3xl border border-primary-100 italic text-slate-700 leading-relaxed">
                  "{selectedCandidate.manifesto}"
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowCandidateModal(false)}
                className="w-full py-5 bg-slate-900 text-white text-[11px] font-black rounded-2xl uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollVotingPage;
