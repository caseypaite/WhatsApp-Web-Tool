import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, BookOpen, Shield, Code, History, Zap, ArrowLeft, Cpu, Globe, Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AboutPage = () => {
  const { siteName } = useAuth();
  const navigate = useNavigate();
  const version = "1.5.0";
  const versionHistory = [
    { tag: "v1.5.0", message: "Enterprise UI overhaul with WordPress-Admin theme and unified poll access", date: "2026-03-25" },
    { tag: "v1.4.4", message: "Alpha release with phone number linking and group management", date: "2026-03-24" },
    { tag: "v1.4.3", message: "Stable production release with update script", date: "2026-03-24" },
    { tag: "v1.4.2", message: "Production package release and version updates", date: "2026-03-24" },
    { tag: "v1.4.1", message: "Maintenance release with performance fixes", date: "2026-03-23" },
    { tag: "v1.4.0", message: "Initial production release v1.4.0", date: "2026-03-22" }
  ];

  const backendLibraries = [
    "Node.js (Express)", "whatsapp-web.js (Puppeteer)", "PostgreSQL (pg)", "JWT Auth", "Bcrypt.js", "AI Integration"
  ];

  const frontendLibraries = [
    "React (Vite)", "Tailwind CSS", "Lucide Icons", "Recharts", "Axios", "AuthContext"
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f1] font-sans text-[#3c434a] pb-20">
      {/* WP Header */}
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
              <Globe className="w-3 h-3" /> System Overview
            </div>
            <h2 className="text-4xl font-extrabold leading-tight mb-2 uppercase tracking-tighter">About the Platform</h2>
            <p className="text-[#a7aaad] text-sm font-medium italic">Secure Identity Propagation and Governance Infrastructure</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-1 text-[#646970] hover:text-[#2271b1] text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.24)] border border-[#dcdcde] p-8 md:p-12">
              <h3 className="text-2xl font-bold text-[#1d2327] mb-6 border-b border-[#f0f0f1] pb-4 uppercase tracking-tight">About the Platform</h3>
              <div className="prose prose-slate max-w-none text-[#3c434a] leading-relaxed space-y-6">
                <p className="text-lg font-medium italic text-[#646970]">
                  {siteName} is a cryptographic identity propagation layer engineered for absolute integrity in distributed governance.
                </p>
                <p>
                  Built on a foundation of hardware-anchored verification, the platform leverages the WhatsApp communication vector to establish immutable session anchors. This approach ensures that every interaction within the ecosystem is backed by a verified organizational identity.
                </p>
                <div className="grid sm:grid-cols-2 gap-6 py-6">
                  <div className="p-4 bg-[#f6f7f7] border border-[#dcdcde]">
                    <Shield className="w-6 h-6 text-[#2271b1] mb-2" />
                    <h4 className="font-bold text-sm uppercase mb-1">Secure Auth</h4>
                    <p className="text-xs text-[#646970]">Multi-factor authentication anchored to communication units.</p>
                  </div>
                  <div className="p-4 bg-[#f6f7f7] border border-[#dcdcde]">
                    <Activity className="w-6 h-6 text-[#2271b1] mb-2" />
                    <h4 className="font-bold text-sm uppercase mb-1">Audit Stream</h4>
                    <p className="text-xs text-[#646970]">Real-time logging of all node-to-node transmissions.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.24)] border border-[#dcdcde] p-8 md:p-12">
              <h3 className="text-2xl font-bold text-[#1d2327] mb-8 border-b border-[#f0f0f1] pb-4 uppercase tracking-tight">Version History</h3>
              <div className="space-y-6">
                {versionHistory.map((v, i) => (
                  <div key={v.tag} className="flex gap-6 group">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full border-2 transition-colors ${i === 0 ? 'bg-[#2271b1] border-[#2271b1]' : 'bg-white border-[#dcdcde] group-hover:border-[#2271b1]'}`} />
                      {i !== versionHistory.length - 1 && <div className="w-0.5 h-full bg-[#f0f0f1]" />}
                    </div>
                    <div className="pb-8">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-[#1d2327] bg-[#f0f0f1] px-2 py-0.5 rounded-sm">{v.tag}</span>
                        <span className="text-[10px] font-bold text-[#a7aaad] uppercase">{v.date}</span>
                      </div>
                      <p className="text-sm text-[#646970] font-medium leading-relaxed">{v.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white shadow-sm border border-[#dcdcde] p-6">
              <h4 className="text-xs font-black text-[#1d2327] uppercase tracking-[0.2em] mb-6 border-b border-[#f0f0f1] pb-2">Technical Core</h4>
              <div className="space-y-8">
                <div>
                  <h5 className="text-[10px] font-black text-[#a7aaad] uppercase mb-3 tracking-widest">Backend Systems</h5>
                  <ul className="space-y-2">
                    {backendLibraries.map(lib => (
                      <li key={lib} className="flex items-center gap-2 text-xs font-bold text-[#3c434a]">
                        <div className="w-1.5 h-1.5 bg-[#2271b1] rounded-full" />
                        {lib}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-[#a7aaad] uppercase mb-3 tracking-widest">Interface Layer</h5>
                  <ul className="space-y-2">
                    {frontendLibraries.map(lib => (
                      <li key={lib} className="flex items-center gap-2 text-xs font-bold text-[#3c434a]">
                        <div className="w-1.5 h-1.5 bg-[#72aee6] rounded-full" />
                        {lib}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-[#1d2327] text-white p-6 rounded-sm shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-[#2271b1]" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-[#72aee6]">Licensing Protocol</h4>
              </div>
              <p className="text-[11px] leading-relaxed text-[#a7aaad] mb-6 font-medium">
                Released under the <strong className="text-white">ISC Open Access License</strong>. Authorized for deployment, modification, and redistribution across all organizational nodes.
              </p>
              <a 
                href="https://github.com/caseypaite/WhatsApp-Web-Tool" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white hover:text-[#72aee6] transition-colors"
              >
                <Github className="w-4 h-4" /> Get Source Code
              </a>
            </div>

            <div className="p-6 border border-dashed border-[#dcdcde] text-center">
               <Cpu className="w-8 h-8 text-[#dcdcde] mx-auto mb-2" />
               <p className="text-[9px] font-bold text-[#a7aaad] uppercase tracking-[0.3em]">Protocol Build v{version}</p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-20 py-8 border-t border-[#dcdcde] text-center">
        <p className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-[0.2em]">© 2026 Identity Propagation Lab • Distributed Ledger Architecture</p>
      </footer>
    </div>
  );
};

export default AboutPage;
