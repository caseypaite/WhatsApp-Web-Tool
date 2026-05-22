import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import authService from '../services/auth.service';
import DOMPurify from 'dompurify';
import { ArrowRight, Shield, Zap, Layout as LayoutIcon, Cpu, User, BarChart2, Globe, MessageSquare, ShieldCheck, Activity, History } from 'lucide-react';

const DEFAULT_HERO_IMAGE_URL = '/hero.png';
const LEGACY_DEFAULT_HERO_IMAGES = new Set([
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832'
]);

const LandingPage = () => {
  const { user, loading, logout, siteName } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState({
    hero_text: 'Isolated WhatsApp Operations for Every Team',
    cta_text: 'Open Portal',
    image_url: DEFAULT_HERO_IMAGE_URL
  });
  const [activePolls, setActivePolls] = useState([]);
  const [buildInfo, setBuildInfo] = useState({
    version: '1.6.0',
    history: []
  });

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const response = await api.get('/cms/landing');
        if (response.data && response.data.hero_text) {
          const imageUrl = response.data.image_url;
          setContent({
            ...response.data,
            image_url: !imageUrl || LEGACY_DEFAULT_HERO_IMAGES.has(imageUrl)
              ? DEFAULT_HERO_IMAGE_URL
              : imageUrl
          });
        }
      } catch (err) {
        console.error('Failed to fetch CMS content:', err);
      }
    };

    const fetchPolls = async () => {
      try {
        const pollsRes = await authService.getPublicLatestPolls();
        setActivePolls(pollsRes);
      } catch (err) {
        console.error('Failed to fetch polls:', err);
      }
    };

    const fetchBuildInfo = async () => {
      try {
        const response = await api.get('/system/git-history');
        if (response.data?.version) {
          setBuildInfo({
            version: response.data.version,
            history: Array.isArray(response.data.history) ? response.data.history : []
          });
        }
      } catch (err) {
        console.error('Failed to fetch build info:', err);
      }
    };

    fetchHeroContent();
    fetchPolls();
    fetchBuildInfo();
  }, []);

  const injectVariables = (html) => {
    if (!html) return '';
    let result = html;
    
    // Escape helper to prevent XSS through settings
    const escapeHtml = (unsafe) => {
      if (typeof unsafe !== 'string') return unsafe;
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const vars = {
      site_name: escapeHtml(siteName || 'AppStack'),
      website_domain: escapeHtml(window.location.origin),
      hero_text: escapeHtml(content.hero_text),
      cta_text: escapeHtml(content.cta_text)
    };

    Object.entries(vars).forEach(([key, val]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, val);
    });
    return result;
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#3c434a]">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden border-b border-[#dcdcde]">
        <div className="container px-6 mx-auto">
          <div className="flex flex-wrap items-center -mx-4">
            <div className="w-full px-4 lg:w-1/2">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f0f0f1] border border-[#dcdcde] rounded-sm mb-8">
                  <ShieldCheck className="w-4 h-4 text-[#2271b1]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1d2327]">Secure Voting Platform</span>
                </div>
                <h1 className="mb-8 text-5xl font-extrabold leading-[1.1] tracking-tight text-[#1d2327] md:text-7xl">
                  {content.hero_text}
                </h1>
                <p className="mb-12 text-xl text-[#646970] leading-relaxed max-w-lg font-medium">
                  Run a separate WhatsApp session for every user, keep the root admin account isolated, and operate messaging, audits, and polls from one controlled platform.
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                  {loading ? (
                    <div className="w-10 h-10 border-4 border-[#2271b1] border-t-transparent rounded-full animate-spin"></div>
                  ) : !user ? (
                    <button 
                      onClick={() => navigate('/login')}
                      className="inline-flex items-center px-10 py-4 text-base font-bold text-white transition-all bg-[#2271b1] rounded-sm hover:bg-[#135e96] shadow-md border-b-2 border-[#135e96] active:scale-95"
                    >
                      {content.cta_text}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center px-10 py-4 text-base font-bold text-white transition-all bg-[#2271b1] rounded-sm hover:bg-[#135e96] shadow-md border-b-2 border-[#135e96]"
                      >
                        Launch Portal
                        <User className="ml-2 w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => logout()}
                        className="inline-flex items-center px-10 py-4 text-base font-bold text-[#1d2327] transition-all bg-[#f0f0f1] border border-[#dcdcde] rounded-sm hover:bg-[#dcdcde]"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                  {!loading && !user && (
                    <button 
                      onClick={() => navigate('/about')}
                      className="inline-flex items-center px-10 py-4 text-base font-bold text-[#1d2327] transition-all bg-white border border-[#dcdcde] rounded-sm hover:bg-[#f6f7f7]"
                    >
                      Technical Overview
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full px-4 mt-16 lg:w-1/2 lg:mt-0">
              <div className="relative group">
                <div className="absolute inset-0 bg-[#2271b1] rounded-sm blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                <div className="relative bg-white p-2 border border-[#dcdcde] shadow-2xl rounded-sm">
                  <img 
                    src={content.image_url} 
                    alt="Network Infrastructure" 
                    className="w-full object-cover aspect-[4/3] grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                  />
                </div>
                
                {/* Floating Meta-info */}
                <div className="absolute -bottom-8 -right-8 p-6 bg-[#1d2327] text-white shadow-2xl rounded-sm border border-white/10 hidden md:block animate-in slide-in-from-bottom-4 duration-1000">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#2271b1] rounded-sm">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-[#72aee6]">Status</p>
                      <p className="text-xl font-bold">Node {siteName || 'Active'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic HTML Content Injection */}
      {content.html_content && (
        <section className="py-20 border-b border-[#dcdcde]">
          <div className="container px-6 mx-auto">
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(injectVariables(content.html_content)) }} 
            />
          </div>
        </section>
      )}

      {/* Analytics / Stats Banner */}
      <section className="bg-[#f6f7f7] border-b border-[#dcdcde] py-12">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
            { label: 'Isolated Sessions', val: 'Root + User' },
            { label: 'API Ownership', val: 'User Scoped' },
            { label: 'Restart Mode', val: 'Serialized' },
            { label: 'Audit Surface', val: 'Live Logs' }
            ].map((stat, i) => (
              <div key={i} className="text-center md:text-left border-l border-[#dcdcde] pl-6 first:border-0 first:pl-0">
                <p className="text-[10px] font-black text-[#a7aaad] uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-[#1d2327]">{stat.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white border-b border-[#dcdcde]">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mb-14">
            <h2 className="text-[11px] font-black text-[#2271b1] uppercase tracking-[0.4em] mb-4">Build Ledger</h2>
            <h3 className="text-4xl font-extrabold text-[#1d2327] mb-6 tracking-tight">Release Intelligence</h3>
            <p className="text-lg text-[#646970] font-medium leading-relaxed">Track the active build, recent repository changes, and the current deployment posture from the running node.</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
            <div className="bg-[#1d2327] text-white border border-white/10 rounded-sm p-8 shadow-xl">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-[#2271b1] rounded-sm mb-6">
                <Cpu className="w-7 h-7 text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#72aee6] mb-3">Current Version</p>
              <p className="text-4xl font-extrabold tracking-tight mb-4">v{buildInfo.version}</p>
              <p className="text-sm text-[#a7aaad] leading-relaxed font-medium">This node reports the running application version and exposes the latest repository activity directly on the landing page.</p>
            </div>

            <div className="bg-white border border-[#dcdcde] rounded-sm shadow-sm">
              <div className="flex items-center gap-3 p-6 border-b border-[#f0f0f1] bg-[#f6f7f7]">
                <History className="w-5 h-5 text-[#2271b1]" />
                <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-[#1d2327]">Recent Git History</h4>
              </div>

              <div className="divide-y divide-[#f0f0f1]">
                {buildInfo.history.length > 0 ? (
                  buildInfo.history.map((entry) => (
                    <div key={entry.id} className="p-6 md:p-7">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="px-2.5 py-1 bg-[#f0f0f1] text-[#1d2327] text-xs font-bold rounded-sm">
                          {entry.shortHash}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a7aaad]">
                          {entry.date}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-[#1d2327] leading-relaxed">{entry.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <p className="text-sm font-medium text-[#646970]">Git history is not available on this node right now.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Decision Streams */}
      <section className="py-32 bg-white">
        <div className="container px-6 mx-auto">
          <div className="max-w-3xl mb-20">
            <h2 className="text-[11px] font-black text-[#2271b1] uppercase tracking-[0.4em] mb-4">Governance Layer</h2>
            <h3 className="text-4xl font-extrabold text-[#1d2327] mb-6 tracking-tight">Community Polls</h3>
            <p className="text-lg text-[#646970] font-medium leading-relaxed">Publish verified public decisions while keeping internal and user-scoped operations isolated behind authenticated sessions.</p>
          </div>

          {activePolls.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activePolls.map(poll => (
                <div key={poll.id} className="bg-white border border-[#dcdcde] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
                  <div className="p-6 border-b border-[#f0f0f1] bg-[#f6f7f7]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#2271b1]" />
                      <span className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-widest">Active Node</span>
                    </div>
                    <span className="w-2 h-2 bg-[#00a32a] rounded-full shadow-[0_0_8px_#00a32a]"></span>
                  </div>
                  <div className="p-8 flex-1">
                    <h4 className="text-xl font-bold text-[#1d2327] mb-4 group-hover:text-[#2271b1] transition-colors line-clamp-2">{poll.title}</h4>
                    <p className="text-sm text-[#646970] leading-relaxed italic line-clamp-3 mb-8">"{poll.description}"</p>
                    
                    <div className="flex items-center justify-between pt-6 border-t border-[#f0f0f1]">
                      <div className="flex items-center gap-2 text-[10px] font-black text-[#a7aaad] uppercase tracking-tighter">
                        <Globe className="w-3 h-3" />
                        Public Access
                      </div>
                      <button 
                        onClick={() => navigate(`/poll/${poll.id}`)}
                        className="px-6 py-2.5 bg-[#1d2327] text-white text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-[#2271b1] transition-all shadow-md active:scale-95"
                      >
                        Participate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 bg-[#f6f7f7] border border-dashed border-[#dcdcde] text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-white border border-[#dcdcde] rounded-full flex items-center justify-center mb-6 shadow-sm">
                <Activity className="w-8 h-8 text-[#a7aaad]" />
              </div>
              <h4 className="text-sm font-bold text-[#1d2327] uppercase tracking-[0.2em]">No Active Polls</h4>
              <p className="text-xs text-[#646970] mt-2 max-w-xs mx-auto font-medium">No public decision nodes are currently broadcasting. Access the secured portal for internal operations.</p>
            </div>
          )}
        </div>
      </section>

      {/* Feature Architecture */}
      <section className="py-32 bg-[#1d2327] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2271b1] rounded-full blur-[120px] opacity-10 -mr-48 -mt-48"></div>
        <div className="container px-6 mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-[11px] font-black text-[#72aee6] uppercase tracking-[0.5em] mb-6">Core Infrastructure</h2>
            <h3 className="text-4xl font-extrabold mb-8 tracking-tight">Engineered for Absolute Integrity</h3>
            <div className="h-1.5 w-24 bg-[#2271b1] mx-auto rounded-full"></div>
          </div>

          <div className="grid gap-16 md:grid-cols-3">
            {[
              { icon: Shield, title: 'Session Isolation', desc: 'Root admin WhatsApp and every user-linked WhatsApp account run as separate persisted sessions.' },
              { icon: LayoutIcon, title: 'Owned API Access', desc: 'Users create and rotate their own message-only API keys while admins keep platform governance controls.' },
              { icon: MessageSquare, title: 'Operational Telemetry', desc: 'Message logs and session lifecycle logs provide live visibility into user and platform messaging activity.' }
            ].map((feature, i) => (
              <div key={i} className="group cursor-default">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-8 text-[#72aee6] bg-white/5 border border-white/10 rounded-sm group-hover:bg-[#2271b1] group-hover:text-white transition-all duration-500 group-hover:rotate-[360deg]">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h4 className="mb-4 text-xl font-bold tracking-tight">{feature.title}</h4>
                <p className="text-[#a7aaad] leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#dcdcde] py-12">
        <div className="container px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1d2327] rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-[#1d2327] tracking-tighter">{siteName} Enterprise</span>
          </div>
          <div className="flex gap-8">
            <button onClick={() => navigate('/about')} className="text-[10px] font-bold uppercase tracking-widest text-[#646970] hover:text-[#2271b1] transition-colors">Intelligence</button>
            <button onClick={() => navigate('/terms')} className="text-[10px] font-bold uppercase tracking-widest text-[#646970] hover:text-[#2271b1] transition-colors">Terms</button>
            <button onClick={() => navigate('/privacy')} className="text-[10px] font-bold uppercase tracking-widest text-[#646970] hover:text-[#2271b1] transition-colors">Privacy</button>
            <button onClick={() => navigate('/login')} className="text-[10px] font-bold uppercase tracking-widest text-[#646970] hover:text-[#2271b1] transition-colors">Node Access</button>
          </div>
          <p className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-[0.2em]">© 2026 Identity Propagation Lab • Beta v{buildInfo.version}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
