import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Shield, Zap, Layout as LayoutIcon, Cpu, User } from 'lucide-react';

const LandingPage = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState({
    hero_text: 'Building the Future of Identity',
    cta_text: 'Get Started',
    image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=2832'
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await api.get('/cms/landing');
        console.log('CMS content response:', response.data);
        if (response.data && response.data.hero_text) {
          setContent(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch CMS content:', err);
      }
    };
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden bg-white">
        <div className="container px-6 mx-auto">
          <div className="flex flex-wrap items-center -mx-4">
            <div className="w-full px-4 lg:w-1/2">
              <div className="max-w-xl">
                <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
                  {content.hero_text}
                </h1>
                <p className="mb-10 text-xl text-slate-600">
                  A comprehensive stack for identity management, verifiable credentials, and secure role-based access control.
                </p>
                <div className="flex flex-wrap gap-4 min-h-[64px] items-center">
                  {loading ? (
                    <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin ml-4"></div>
                  ) : !user ? (
                    <button 
                      onClick={() => navigate('/login')}
                      className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white transition duration-200 bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200"
                    >
                      {content.cta_text}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white transition duration-200 bg-primary-600 rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200"
                      >
                        Go to Dashboard
                        <User className="ml-2 w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => logout()}
                        className="inline-flex items-center px-8 py-4 text-lg font-semibold text-slate-700 transition duration-200 bg-slate-100 rounded-xl hover:bg-slate-200"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                  {!loading && !user && (
                    <button className="inline-flex items-center px-8 py-4 text-lg font-semibold text-slate-700 transition duration-200 bg-slate-100 rounded-xl hover:bg-slate-200">
                      Learn More
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="w-full px-4 mt-12 lg:w-1/2 lg:mt-0">
              <div className="relative">
                <img 
                  src={content.image_url} 
                  alt="Identity and Technology" 
                  className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
                />
                <div className="absolute -bottom-6 -left-6 p-6 bg-white rounded-2xl shadow-xl hidden md:block">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Verified Identity</p>
                      <p className="text-sm text-slate-500">W3C Compliant VC</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-slate-50">
        <div className="container px-6 mx-auto text-center">
          <h2 className="mb-16 text-3xl font-bold text-slate-900 md:text-4xl">Powering Secure Experiences</h2>
          <div className="grid gap-12 md:grid-cols-3">
            {[
              { icon: Shield, title: 'Secure Auth', desc: 'Custom registration and login with local JWT storage.' },
              { icon: LayoutIcon, title: 'Full RBAC', desc: 'Granular access control for Admins, Editors, and Users.' },
              { icon: Cpu, title: 'Two-Step Activation', desc: 'OTP verification followed by manual admin approval.' }
            ].map((feature, i) => (
              <div key={i} className="p-8 bg-white border border-slate-100 rounded-3xl transition duration-200 hover:shadow-xl group">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 text-primary-600 bg-primary-50 rounded-2xl transition duration-200 group-hover:bg-primary-600 group-hover:text-white">
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
