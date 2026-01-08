import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Cloud, Lock, Mail, Loader2 } from 'lucide-react';
import api from '../lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('cloud_token', res.data.data.token);
        localStorage.setItem('user_info', JSON.stringify(res.data.data.user));
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="max-w-md w-full space-y-8 bg-[#1e293b] p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <Cloud className="h-10 w-10 text-blue-500" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">Ubox Cloud Dashboard</h2>
          <p className="mt-2 text-sm text-slate-400">
            Ingresa para gestionar tu negocio en tiempo real
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@tu-negocio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Iniciar Sesión'}
          </button>

          <p className="text-center text-sm text-slate-400">
            ¿No tienes una cuenta?{' '}
            <Link to="/register" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            Ubox POS SaaS - SISTEMA DE GESTIÓN INTELIGENTE
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
