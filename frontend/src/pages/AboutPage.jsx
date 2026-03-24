import React from 'react';
import { Github, BookOpen, Shield, Code, History } from 'lucide-react';

const AboutPage = () => {
  const version = "1.4.3";
  const versionHistory = [
    { tag: "v1.4.3", message: "Stable production release with update script", date: "2026-03-24" },
    { tag: "v1.4.2", message: "Production package release and version updates", date: "2026-03-24" },
    { tag: "v1.4.1", message: "Maintenance release with performance fixes", date: "2026-03-23" },
    { tag: "v1.4.0", message: "Initial production release v1.4.0", date: "2026-03-22" },
    { tag: "v1.3.0", message: "Enhanced security and governance updates", date: "2026-03-22" }
  ];

  const backendLibraries = [
    "express", "whatsapp-web.js", "pg (PostgreSQL)", "jsonwebtoken", "bcryptjs", "multer", "dotenv", "cors", "compression"
  ];

  const frontendLibraries = [
    "react", "react-router-dom", "lucide-react", "recharts", "axios", "tailwindcss", "vite"
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
        <div className="p-8 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Code className="mr-3 h-8 w-8 text-blue-600" />
              About AppStack
            </h1>
            <div className="flex items-center space-x-4">
              <a 
                href="https://github.com/caseypaite/WhatsApp-Web-Tool" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 transition-colors"
                title="GitHub Repository"
              >
                <Github className="h-7 w-7" />
              </a>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                v{version}
              </span>
            </div>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed">
            AppStack is a secure, enterprise-grade WhatsApp automation platform and identity management system. 
            It provides robust governance, automated communication, and secure RBAC-enabled portal access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-100">
          <div className="p-8 bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <History className="mr-2 h-5 w-5 text-indigo-600" />
              Version History
            </h2>
            <div className="space-y-4">
              {versionHistory.map((v) => (
                <div key={v.tag} className="group border-l-2 border-indigo-100 pl-4 py-1 hover:border-indigo-500 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">{v.tag}</span>
                    <span className="text-xs text-gray-400 font-medium">{v.date}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-snug group-hover:text-gray-900 transition-colors">{v.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 bg-white">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-emerald-600" />
              Technology Stack
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Backend</h3>
                <ul className="space-y-2">
                  {backendLibraries.map(lib => (
                    <li key={lib} className="text-sm text-gray-600 flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></div>
                      {lib}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Frontend</h3>
                <ul className="space-y-2">
                  {frontendLibraries.map(lib => (
                    <li key={lib} className="text-sm text-gray-600 flex items-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></div>
                      {lib}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-gray-50">
          <div className="flex items-start">
            <Shield className="h-6 w-6 text-orange-500 mt-1 mr-4" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">License Information</h2>
              <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
                <p>
                  This software is released under the <strong>ISC License</strong>. It is a permissive free software license 
                  that allows for commercial use, modification, distribution, and private use, provided that the 
                  copyright notice and this permission notice appear in all copies.
                </p>
                <div className="bg-orange-50 border border-orange-100 rounded p-3 italic text-xs text-orange-800">
                  "Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee 
                  is hereby granted, provided that the above copyright notice and this permission notice appear in all copies."
                </div>
                <p className="pt-2">
                  <a 
                    href="https://opensource.org/licenses/ISC" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center"
                  >
                    View Full License Details
                    <BookOpen className="ml-1 h-3 w-3" />
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-xs">
        &copy; {new Date().getFullYear()} AppStack. All rights reserved. Built with security and scalability in mind.
      </div>
    </div>
  );
};

export default AboutPage;
