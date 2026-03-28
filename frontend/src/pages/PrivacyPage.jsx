import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowLeft } from 'lucide-react';

const PrivacyPage = () => {
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
              <Lock className="w-8 h-8 text-[#72aee6]" />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-[#1d2327]">Privacy Policy</h1>
              <p className="text-xs font-bold text-[#a7aaad] uppercase tracking-widest mt-1">Data Sovereignty Protocol v1.5.5</p>
            </div>
          </div>

          <div className="space-y-8 text-sm leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">1. Data Vector Collection</h2>
              <p>
                We collect minimal data necessary for the operation of the cryptographic identity nodes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Identity Anchors:</strong> Email addresses and names provided during node registration.</li>
                <li><strong>Communication Links:</strong> Phone numbers associated with your WhatsApp session for OTP transmission and group management.</li>
                <li><strong>Operational Metadata:</strong> System interaction logs, including broadcast timestamps and poll responses.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">2. WhatsApp Session Data</h2>
              <p>
                The platform utilizes `whatsapp-web.js` to manage session continuity. Your WhatsApp authentication data is stored in an encrypted filesystem layer (`.wwebjs_auth`). This data never leaves the server environment and is utilized solely for maintaining your node's connection to the WhatsApp network.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">3. Data Propagation & Third Parties</h2>
              <p>
                {siteName} does not sell, trade, or otherwise propagate your personal data to external third parties. We utilize industry-standard encryption protocols (JWT, Bcrypt) to ensure the integrity of your identity within our local ecosystem.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">4. Cryptographic Security</h2>
              <p>
                We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your identity node. All sensitive data is transmitted via Secure Socket Layer (SSL) technology and then encrypted into our database.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1d2327]">5. User Rights (Sovereignty)</h2>
              <p>
                You maintain full sovereignty over your data. You may request the termination of your identity node and the subsequent purging of all associated operational metadata at any time by contacting a system administrator.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-[#f0f0f1] text-center">
            <p className="text-[10px] font-bold text-[#a7aaad] uppercase tracking-[0.2em]">© 2026 {siteName} Privacy Council. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
