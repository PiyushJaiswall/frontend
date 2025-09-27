'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully!');
    }
    setLoading(false);
  };
  
    const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Check your email for the confirmation link!');
    }
    setLoading(false);
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-primary">
      <div className="w-full max-w-md p-8 space-y-6 bg-secondary rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white">Welcome Back</h1>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-light-gray">
              Email
            </label>
            <input
              id="email"
              className="w-full px-3 py-2 mt-1 text-white bg-dark-gray border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-light-gray">
              Password
            </label>
            <input
              id="password"
              className="w-full px-3 py-2 mt-1 text-white bg-dark-gray border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-bold text-white bg-accent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
            <button
              onClick={handleSignup}
              disabled={loading}
              className="w-full px-4 py-2 font-bold text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
