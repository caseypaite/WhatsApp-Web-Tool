import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  const navigate = useNavigate();
  const { siteName } = useAuth();

  return (
    <div className="min-h-screen bg-[#f0f0f1] font-sans text-[#3c434a] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2271b1] hover:text-[#135e96] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Vector
        </button>

        <div className="bg-white shadow-sm border border-[#dcdcde] p-12">
          <div className="flex items-center gap-4 mb-12 border-b border-[#f0f0f1] pb-8">
            <div className="p-3 bg-[#1d2327] rounded-sm">
              <Shield className="w-8 h-8 text-[#72aee6]" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-[#1d2327]">Terms of Service</h1>
              <p className="text-xs font-bold text-[#a7aaad] uppercase tracking-widest mt-1">Operational Protocol v1.6.0</p>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">1. Acceptance of Protocol</h2>
              <p>
                By accessing the {siteName || 'AppStack'} platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">2. WhatsApp Automation Usage</h2>
              <p>
                This platform utilizes the WhatsApp Web automation protocol. You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You will not use the platform for the transmission of "spam", unsolicited bulk messages, or unauthorized commercial communications.</li>
                <li>You are solely responsible for any content transmitted through your associated WhatsApp session.</li>
                <li><strong>Account Risk:</strong> The use of automation tools carries a risk of account suspension by WhatsApp Inc. {siteName} is not liable for any account restrictions, bans, or data loss resulting from the use of this software.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">3. Identity & Security</h2>
              <p>
                Access to the platform is granted via cryptographic identity nodes. You must maintain the confidentiality of your session tokens and physical device access. Any unauthorized propagation of identity through your node is your sole responsibility.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">4. Operational Limitations</h2>
              <p>
                In no event shall {siteName} or its developers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on the platform.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">5. Governance & Content</h2>
              <p>
                All materials contained in the platform are protected by applicable copyright and trademark law. System administrators reserve the right to terminate any identity node found in violation of these protocols without prior notice.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#f0f0f1] text-center">
            <p className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-[0.2em]">© 2026 {siteName} Security Council. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
