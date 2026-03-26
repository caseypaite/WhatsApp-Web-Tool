import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart2, ArrowLeft, Phone, ShieldCheck, 
  User, CheckCircle, AlertCircle, RefreshCw, X, Zap, Globe
} from 'lucide-react';

const PollVotingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { siteName } = useAuth();
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
          setError(`This decision unit is scheduled to initialize on ${new Date(data.starts_at).toLocaleString()}.`);
        } else if (data.ends_at && new Date(data.ends_at) < now) {
          setError('The operational window for this unit has expired.');
        } else if (data.status !== 'OPEN') {
          setError('This node is not currently accepting incoming packets.');
        }
      } catch (err) {
        setError('Inquiry unit not found or offline.');
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
      setSuccess('Authorization packet transmitted to your communication unit.');
    } catch (err) {
      setError(err.response?.data?.error || 'Transmission failed. Verify mobile identifier.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCastVote = async () => {
    if (!isViewing && !votingData.option_selected && !votingData.candidate_id) {
      setError('Please select a selection node before finalizing.');
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
        setSuccess('Identity verified. Synchronizing previous decision...');
        setTimeout(() => navigate(`/poll/${id}/results`), 2000);
      } else {
        setSuccess('Decision committed and recorded on the ledger.');
        setTimeout(() => navigate(`/poll/${id}/results`), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Protocol mismatch.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f0f0f1]">
        <div className="w-8 h-8 border-4 border-[#dcdcde] border-t-[#2271b1] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f0f1] font-sans text-[#3c434a] pb-20">
      {/* WP-Style Header for Public Pages */}
      <div className="bg-[#1d2327] py-12 px-4 mb-12 text-center text-white border-b-4 border-[#2271b1]">
        <div className="container mx-auto">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group cursor-pointer" onClick={() => navigate('/')}>
              <Zap className="w-6 h-6 text-[#72aee6]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{siteName} Enterprise</h1>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2271b1] rounded-sm text-[10px] font-bold uppercase tracking-widest mb-4">
              <Globe className="w-3 h-3" /> Secure Poll
            </div>
            <h2 className="text-4xl font-extrabold leading-tight mb-2 uppercase tracking-tighter">{poll?.title}</h2>
            <p className="text-[#a7aaad] text-sm font-medium italic">"{poll?.description}"</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-3xl">
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-[#646970] hover:text-[#2271b1] text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Polls
        </button>

        <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.24)] border border-[#dcdcde] overflow-hidden">
          <div className="p-8 md:p-12">
            {error && (
              <div className="p-4 mb-8 text-[#d63638] bg-white border-l-4 border-[#d63638] shadow-sm text-sm font-medium animate-in fade-in">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="p-4 mb-8 text-[#00a32a] bg-white border-l-4 border-[#00a32a] shadow-sm text-sm font-medium animate-in fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{success}</p>
                </div>
              </div>
            )}

            {/* STEP 1: AUTH */}
            {!otpSent && (
              <div className="space-y-8 animate-in slide-in-from-top-2 duration-500">
                <div className="border-b border-[#f0f0f1] pb-4">
                  <h3 className="text-lg font-bold text-[#1d2327] uppercase tracking-tight">Step 1: Phone Verification</h3>
                  <p className="text-xs text-[#646970] font-medium mt-1">Receive an OTP via WhatsApp to verify your identity.</p>
                </div>
                
                <div className="max-w-md mx-auto space-y-6">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Mobile Link Identifier</label>
                    <input 
                      type="tel" 
                      disabled={needsConfirmation}
                      className="w-full px-4 py-3 bg-[#f6f7f7] border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none font-bold text-xl tracking-wider shadow-inner disabled:opacity-50 transition-all text-center" 
                      placeholder="91XXXXXXXXXX" 
                      value={votingData.phone_number} 
                      onChange={(e) => setVotingData({...votingData, phone_number: e.target.value})} 
                    />
                  </div>

                  {!needsConfirmation ? (
                    <button 
                      onClick={() => handleRequestOtp(false)} 
                      disabled={actionLoading || !votingData.phone_number}
                      className="w-full py-3 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded-sm uppercase tracking-widest text-sm border-b-2 border-[#135e96] transition-all disabled:opacity-50"
                    >
                      {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Request Authorization Packet'}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => handleRequestOtp(true)} 
                        className="w-full py-3 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded-sm uppercase tracking-widest text-sm border-b-2 border-[#135e96]"
                      >
                        Verify Identity to View Decision
                      </button>
                      <button 
                        onClick={() => { setNeedsConfirmation(false); setSuccess(''); }} 
                        className="text-xs text-[#2271b1] hover:underline font-bold"
                      >
                        Change Mobile Identifier
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[#fcf9e8] border border-[#dba617] flex items-start gap-4">
                  <ShieldCheck className="w-6 h-6 text-[#dba617] flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-[#1d2327] uppercase tracking-widest">Identity Protocol Notice</p>
                    <p className="text-xs text-[#646970] font-medium leading-relaxed italic">Your organizational membership is verified in real-time against the decentralized participant registry. Access is restricted to authorized entities.</p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: SELECTION */}
            {otpSent && !isViewing && (
              <div className="space-y-10 animate-in fade-in duration-700">
                <div className="border-b border-[#f0f0f1] pb-4">
                  <h3 className="text-lg font-bold text-[#1d2327] uppercase tracking-tight">Finalize Selection Node</h3>
                  <p className="text-xs text-[#646970] font-medium mt-1">Select your decision node and enter the verification packet.</p>
                </div>

                <div className="grid gap-3">
                  {poll.type === 'GENERAL' ? (
                    poll.options.map(opt => (
                      <button 
                        key={opt} 
                        onClick={() => setVotingData({...votingData, option_selected: opt, candidate_id: null})}
                        className={`p-4 border text-left flex items-center justify-between transition-all ${votingData.option_selected === opt ? 'bg-[#f6f7f7] border-[#2271b1] ring-1 ring-[#2271b1]' : 'bg-white border-[#dcdcde] hover:bg-[#f6f7f7]'}`}
                      >
                        <span className="text-sm font-bold text-[#1d2327]">{opt}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${votingData.option_selected === opt ? 'border-[#2271b1]' : 'border-[#dcdcde]'}`}>
                          {votingData.option_selected === opt && <div className="w-2.5 h-2.5 bg-[#2271b1] rounded-full" />}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="grid gap-4">
                      {poll.candidates?.map(cand => (
                        <div 
                          key={cand.id} 
                          onClick={() => setVotingData({...votingData, candidate_id: cand.id, option_selected: null})}
                          className={`p-4 border transition-all cursor-pointer flex gap-6 ${votingData.candidate_id === cand.id ? 'bg-[#f6f7f7] border-[#2271b1] ring-1 ring-[#2271b1]' : 'bg-white border-[#dcdcde] hover:bg-[#f6f7f7]'}`}
                        >
                          <div className="w-20 h-20 bg-[#f0f0f1] border border-[#dcdcde] flex-shrink-0">
                            {cand.photo_url ? <img src={cand.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-5 text-[#a7aaad]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-black uppercase text-[#1d2327]">{cand.name}</h5>
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${votingData.candidate_id === cand.id ? 'border-[#2271b1]' : 'border-[#dcdcde]'}`}>
                                {votingData.candidate_id === cand.id && <div className="w-2.5 h-2.5 bg-[#2271b1] rounded-full" />}
                              </div>
                            </div>
                            <p className="text-xs text-[#646970] italic line-clamp-2 leading-relaxed mb-2">"{cand.manifesto}"</p>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedCandidate(cand); setShowCandidateModal(true); }}
                              className="text-[10px] font-bold text-[#2271b1] hover:underline uppercase"
                            >
                              View Intelligence
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-[#dcdcde] space-y-8">
                  <div className="max-w-xs mx-auto space-y-2">
                    <label className="block text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest text-center">Enter OTP</label>
                    <input 
                      type="text" 
                      maxLength="6" 
                      className="w-full px-4 py-3 bg-[#f6f7f7] border border-[#8c8f94] focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none font-bold text-2xl tracking-[0.5em] shadow-inner text-center" 
                      placeholder="000000" 
                      value={votingData.otp} 
                      onChange={(e) => setVotingData({...votingData, otp: e.target.value})} 
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <button 
                      onClick={handleCastVote} 
                      disabled={actionLoading || votingData.otp.length !== 6 || (!votingData.option_selected && !votingData.candidate_id)} 
                      className="w-full py-3 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded-sm uppercase tracking-widest text-sm border-b-2 border-[#135e96] transition-all disabled:opacity-50"
                    >
                      {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Submit Vote'}
                    </button>
                    
                    <button 
                      onClick={() => { setOtpSent(false); setVotingData({...votingData, otp: ''}); }}
                      className="w-full text-[10px] font-bold text-[#646970] hover:text-[#2271b1] uppercase tracking-widest"
                    >
                      Back to Step 1: Change Identifier
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEWING MODE */}
            {otpSent && isViewing && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="max-w-xs mx-auto space-y-4 text-center">
                  <label className="block text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Confirmation Packet</label>
                  <input 
                    type="text" 
                    maxLength="6" 
                    className="w-full px-4 py-3 bg-[#f6f7f7] border border-[#8c8f94] focus:border-[#2271b1] outline-none font-bold text-2xl tracking-[0.5em] text-center" 
                    placeholder="000000" 
                    value={votingData.otp} 
                    onChange={(e) => setVotingData({...votingData, otp: e.target.value})} 
                  />
                  <button 
                    onClick={handleCastVote} 
                    disabled={actionLoading || votingData.otp.length !== 6} 
                    className="w-full py-3 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded-sm uppercase tracking-widest text-sm border-b-2 border-[#135e96] shadow-sm"
                  >
                    Retrieve My Decision
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Candidate Modal */}
      {showCandidateModal && selectedCandidate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl shadow-2xl border border-[#dcdcde] animate-in zoom-in-95">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#dcdcde] bg-[#f6f7f7]">
              <h4 className="text-sm font-semibold">Intelligence Profile</h4>
              <button onClick={() => setShowCandidateModal(false)} className="p-1 text-[#646970] hover:text-[#d63638]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8">
              <div className="flex gap-8 mb-8">
                <div className="w-32 h-32 bg-[#f0f0f1] border border-[#dcdcde] flex-shrink-0">
                  {selectedCandidate.photo_url ? <img src={selectedCandidate.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-8 text-[#a7aaad]" />}
                </div>
                <div className="flex-1">
                  <h5 className="text-2xl font-bold text-[#1d2327] mb-1">{selectedCandidate.name}</h5>
                  <p className="text-[10px] font-bold text-[#2271b1] uppercase tracking-widest">Profile Document Node</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest border-b border-[#f0f0f1] block pb-1">Manifesto Alpha</label>
                  <p className="text-base text-[#3c434a] font-medium leading-relaxed italic">"{selectedCandidate.manifesto}"</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest border-b border-[#f0f0f1] block pb-1">Biographical Stream</label>
                  <p className="text-sm text-[#646970] font-medium leading-relaxed">{selectedCandidate.biography}</p>
                </div>
              </div>
              <button onClick={() => setShowCandidateModal(false)} className="w-full mt-10 py-3 bg-[#1d2327] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#2c3338]">Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollVotingPage;
