import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart2, ArrowLeft, Phone, ShieldCheck, 
  User, CheckCircle, AlertCircle, RefreshCw, X 
} from 'lucide-react';

const PollVotingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      setSuccess('Authorization packet sent to your WhatsApp.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please check the number.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCastVote = async () => {
    if (!isViewing && !votingData.option_selected && !votingData.candidate_id) {
      setError('Please select an option before finalizing.');
      return;
    }
    if (votingData.otp.length !== 6) {
      setError('Please enter the 6-digit authorization packet.');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const res = await authService.verifyAndVote(votingData);
      if (res.already_voted) {
        setSuccess('Identity verified. Loading your previous decision...');
        setTimeout(() => navigate(`/poll/${id}/results`), 2000);
      } else {
        setSuccess('Decision finalized and recorded on the ledger.');
        setTimeout(() => navigate(`/poll/${id}/results`), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Incorrect OTP.');
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
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase">Access Denied</h2>
        <p className="text-slate-500 font-medium mb-8">{error}</p>
        <button onClick={() => navigate('/')} className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest flex items-center gap-3">
          <ArrowLeft className="w-5 h-5" /> Return to Safety
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 selection:bg-primary-100">
      {/* Header Backdrop */}
      <div className="h-80 bg-slate-900 relative overflow-hidden">
        {poll.background_image_url ? (
          <img src={poll.background_image_url} className="w-full h-full object-cover opacity-40 grayscale" alt="" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-primary-900 opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-40 relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-white/70 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>

        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-white overflow-hidden">
          <div className="p-10 md:p-16 space-y-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-primary-100">
                <BarChart2 className="w-3 h-3" /> Decision Unit Active
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                {poll.title}
              </h1>
              <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
                {poll.description}
              </p>
            </div>

            {success && (
              <div className="p-6 bg-green-50 text-green-700 rounded-3xl border border-green-100 flex items-center gap-5 animate-in slide-in-from-left-4">
                <CheckCircle className="w-6 h-6" />
                <p className="text-sm font-black uppercase tracking-widest leading-tight">{success}</p>
              </div>
            )}

            {error && (
              <div className="p-6 bg-red-50 text-red-700 rounded-3xl border border-red-100 flex items-center gap-5 animate-in slide-in-from-left-4">
                <AlertCircle className="w-6 h-6" />
                <p className="text-sm font-black uppercase tracking-widest leading-tight">{error}</p>
              </div>
            )}

            {/* IDENTITY VERIFICATION (STEP 1) */}
            {!otpSent && (
              <div className="py-10 space-y-10 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase">Step 1: Identity Authentication</h3>
                  <p className="text-sm text-slate-400 font-medium">Please enter your WhatsApp-linked mobile unit to receive an authorization packet.</p>
                </div>
                
                <div className="max-w-md mx-auto space-y-6">
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                    <input 
                      type="tel" 
                      required 
                      disabled={needsConfirmation}
                      className="w-full pl-16 pr-6 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-black text-2xl outline-none focus:ring-8 focus:ring-primary-100 shadow-inner disabled:opacity-50 transition-all" 
                      placeholder="91XXXXXXXXXX" 
                      value={votingData.phone_number} 
                      onChange={(e) => setVotingData({...votingData, phone_number: e.target.value})} 
                    />
                  </div>

                  {!needsConfirmation ? (
                    <button 
                      onClick={() => handleRequestOtp(false)} 
                      disabled={actionLoading || !votingData.phone_number}
                      className="w-full py-6 bg-primary-600 text-white text-xs font-black rounded-[2rem] uppercase tracking-[0.3em] shadow-2xl shadow-primary-900/30 active:scale-95 transform transition-all hover:bg-primary-700 disabled:opacity-50"
                    >
                      {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Request Authorization Packet'}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                      <button 
                        onClick={() => handleRequestOtp(true)} 
                        disabled={actionLoading}
                        className="w-full py-6 bg-primary-600 text-white text-xs font-black rounded-[2rem] uppercase tracking-[0.3em] shadow-2xl shadow-primary-900/30 active:scale-95 transform transition-all"
                      >
                        Verify Identity to View My Decision
                      </button>
                      <button 
                        onClick={() => { setNeedsConfirmation(false); setSuccess(''); }} 
                        className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all"
                      >
                        Change Number
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 flex items-start gap-5">
                  <ShieldCheck className="w-8 h-8 text-indigo-600 flex-shrink-0 mt-1" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-indigo-900 uppercase tracking-widest">WhatsApp Identity Protocol</p>
                    <p className="text-xs text-indigo-600 font-medium leading-relaxed">We use your live WhatsApp group membership as a cryptographic anchor. Your identity is verified against the real-time participant ledger of the linked organizational unit.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SELECTION & FINALIZATION (STEP 2) */}
            {otpSent && !isViewing && (
              <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase">Step 2: Cast Your Decision</h3>
                  <p className="text-sm text-slate-400 font-medium text-center">Identity verified. Select your option and enter the 6-digit packet to finalize.</p>
                </div>

                <div className="grid gap-6">
                  {poll.type === 'GENERAL' ? (
                    <div className="grid gap-4">
                      {poll.options.map(opt => (
                        <button 
                          key={opt} 
                          onClick={() => setVotingData({...votingData, option_selected: opt, candidate_id: null})}
                          className={`p-8 rounded-[2.5rem] border-4 text-left flex items-center justify-between transition-all ${votingData.option_selected === opt ? 'border-primary-600 bg-primary-50 shadow-xl scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                        >
                          <span className="text-xl font-black text-slate-800">{opt}</span>
                          <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center ${votingData.option_selected === opt ? 'border-primary-600' : 'border-slate-200'}`}>
                            {votingData.option_selected === opt && <div className="w-4 h-4 bg-primary-600 rounded-full" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {poll.candidates?.map(cand => (
                        <div 
                          key={cand.id} 
                          onClick={() => setVotingData({...votingData, candidate_id: cand.id, option_selected: null})}
                          className={`p-8 rounded-[3rem] border-4 transition-all cursor-pointer flex flex-col md:flex-row gap-8 ${votingData.candidate_id === cand.id ? 'border-primary-600 bg-primary-50 shadow-2xl scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                        >
                          <div className="w-32 h-32 bg-slate-100 rounded-[2.5rem] overflow-hidden flex-shrink-0 border-4 border-white shadow-xl">
                            {cand.photo_url ? <img src={cand.photo_url} alt={cand.name} className="w-full h-full object-cover" /> : <User className="w-full h-full p-8 text-slate-300" />}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-2xl font-black uppercase tracking-tightest text-slate-900">{cand.name}</h5>
                              <div className={`w-8 h-8 rounded-full border-4 flex items-center justify-center ${votingData.candidate_id === cand.id ? 'border-primary-600' : 'border-slate-200'}`}>
                                {votingData.candidate_id === cand.id && <div className="w-4 h-4 bg-primary-600 rounded-full" />}
                              </div>
                            </div>
                            <p className="text-sm text-slate-500 font-medium italic leading-relaxed mb-6 line-clamp-2">"{cand.manifesto}"</p>
                            <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedCandidate(cand); setShowCandidateModal(true); }}
                                className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline"
                              >
                                View Detailed Intelligence
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-10 border-t-2 border-dashed border-slate-100 space-y-10">
                  <div className="space-y-4 text-center max-w-sm mx-auto">
                    <label className="block text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] text-center">Authorization Packet</label>
                    <input 
                      type="text" 
                      maxLength="6" 
                      className="w-full px-6 py-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-center font-black tracking-[1.2em] text-5xl focus:ring-8 focus:ring-primary-100 outline-none shadow-inner transition-all" 
                      placeholder="000000" 
                      value={votingData.otp} 
                      onChange={(e) => setVotingData({...votingData, otp: e.target.value})} 
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={handleCastVote} 
                      disabled={actionLoading || votingData.otp.length !== 6 || (!votingData.option_selected && !votingData.candidate_id)} 
                      className="w-full py-8 bg-green-600 text-white text-sm font-black rounded-[2.5rem] uppercase tracking-[0.4em] shadow-2xl shadow-green-900/30 hover:bg-green-700 transition-all active:scale-95 transform disabled:opacity-50"
                    >
                      {actionLoading ? <RefreshCw className="w-6 h-6 animate-spin mx-auto" /> : 'Finalize Decision Ledger'}
                    </button>
                    
                    <button 
                      onClick={() => { setOtpSent(false); setVotingData({...votingData, otp: ''}); }}
                      className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                    >
                      Back to Step 1: Change Number
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEWING MODE (FOR ALREADY VOTED) */}
            {otpSent && isViewing && (
              <div className="pt-10 space-y-10 animate-in slide-in-from-bottom-4">
                <div className="space-y-4 text-center max-w-sm mx-auto">
                  <label className="block text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] text-center">Identity Confirmation</label>
                  <input 
                    type="text" 
                    maxLength="6" 
                    className="w-full px-6 py-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-center font-black tracking-[1.2em] text-5xl focus:ring-8 focus:ring-primary-100 outline-none shadow-inner transition-all" 
                    placeholder="000000" 
                    value={votingData.otp} 
                    onChange={(e) => setVotingData({...votingData, otp: e.target.value})} 
                  />
                </div>
                <button 
                  onClick={handleCastVote} 
                  disabled={actionLoading || votingData.otp.length !== 6} 
                  className="w-full py-8 bg-primary-600 text-white text-sm font-black rounded-[2.5rem] uppercase tracking-[0.4em] shadow-2xl shadow-primary-900/30 hover:bg-primary-700 transition-all active:scale-95 transform disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw className="w-6 h-6 animate-spin mx-auto" /> : 'Decrypt & View My Decision'}
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
                <img src={selectedCandidate.photo_url} alt={selectedCandidate.name} className="w-full h-full object-cover grayscale-[50%]" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-900"><User className="w-24 h-24" /></div>
              )}
              <button 
                onClick={() => setShowCandidateModal(false)}
                className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md text-white rounded-2xl hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-white to-transparent pt-20">
                <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{selectedCandidate.name}</h4>
                <p className="text-primary-600 font-black text-[10px] uppercase tracking-[0.2em]">Profile Document Alpha-7</p>
              </div>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manifesto Alpha</label>
                <p className="text-lg text-slate-700 font-black leading-tight italic">"{selectedCandidate.manifesto}"</p>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biographical Node</label>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{selectedCandidate.biography}</p>
              </div>
              <button 
                onClick={() => setShowCandidateModal(false)}
                className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all"
              >
                Close Intelligence Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollVotingPage;
