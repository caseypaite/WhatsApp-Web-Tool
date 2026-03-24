import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import authService from '../services/auth.service';
import { ArrowRight, Shield, Zap, Layout as LayoutIcon, Cpu, User, BarChart2 } from 'lucide-react';

const LandingPage = () => {
  const { user, loading, logout, siteName } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState({
    hero_text: 'Building the Future of Identity',
    cta_text: 'Get Started',
    image_url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1200'
  });
  const [activePolls, setActivePolls] = useState([]);

  useEffect(() => {
    const fetchHeroContent = async () => {
      try {
        const response = await api.get('/cms/landing');
        if (response.data && response.data.hero_text) {
          setContent(response.data);
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

    fetchHeroContent();
    fetchPolls();
  }, []);

  return (
    <div className="min-h-screen bg-white">
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
                      <p className="font-bold text-slate-900">{siteName}</p>
                      <p className="text-sm text-slate-500">Verified Platform</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Polls Section */}
      <section className="py-24 bg-slate-50">
        <div className="container px-6 mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 md:text-4xl tracking-tight">Community Decisions</h2>
              <p className="mt-4 text-lg text-slate-600 font-medium">Join the conversation and cast your vote on active public polls.</p>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="text-primary-600 font-bold uppercase tracking-widest text-sm flex items-center gap-2 hover:translate-x-1 transition-transform"
            >
              View All Polls <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {activePolls.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {activePolls.map(poll => (
                <div key={poll.id} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 hover:shadow-2xl transition-all duration-500 group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-14 h-14 bg-slate-50 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-colors duration-500">
                      <BarChart2 className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-green-200">Active</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight group-hover:text-primary-600 transition-colors">{poll.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 line-clamp-3">{poll.description}</p>

                  <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-200/60">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{poll.created_at ? new Date(poll.created_at).toLocaleDateString() : 'N/A'}</span>
                    <button 
                      onClick={() => navigate(`/poll/${poll.id}`)}
                      className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg active:scale-95"
                    >
                      Vote Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner">
              <BarChart2 className="w-16 h-16 text-slate-200 mx-auto mb-6" />
              <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">No public polls currently active</h3>
              <p className="text-slate-400 text-sm mt-2">Check back later or sign in to create a new decision unit.</p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
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
