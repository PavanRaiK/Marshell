import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [isStudent, setIsStudent] = useState(true);
  const [identifier, setIdentifier] = useState(''); // USN or Email
  const [password, setPassword] = useState('');
  const [errorStatus, setErrorStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const submitAuth = async () => {
    setErrorStatus('');
    setLoading(true);
    try {
      const emailObj = isStudent ? `${identifier.toLowerCase()}@forge.com` : identifier;
      const passwordToUse = isStudent ? password.toUpperCase() : password;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailObj,
        password: passwordToUse
      });

      if (error) throw error;

      // Explicitly navigate to the root interceptor which will read the role and route correctly
      navigate('/');
    } catch (err) {
      setErrorStatus(err.message || "Invalid credentials provided");
    } finally {
      if (!needsPasswordChange) setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setErrorStatus('');
    if (newPassword.length < 6) {
      setErrorStatus("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      setNeedsPasswordChange(false);
      navigate('/');
    } catch (err) {
      setErrorStatus(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center p-6 bg-void app-main text-white">
      <div className="card w-full max-w-[440px] px-8 py-12 relative z-10 flex flex-col items-center">
        
        <div className="w-12 h-12 rounded-xl bg-accent-glow flex items-center justify-center shadow-focus mb-6">
          <span className="text-[20px] font-display font-bold text-white">F</span>
        </div>
        <h1 className="text-h2 text-fg-primary mb-8 text-center">Sign in to ForgeTrack</h1>

        {needsPasswordChange ? (
           <div className="w-full flex-col gap-4">
              <p className="text-body-sm text-fg-secondary mb-4 text-center">
                Please set a personalized password to secure your account.
              </p>
              <div className="mb-6">
                 <label className="block text-label text-fg-secondary mb-2 whitespace-nowrap">NEW PASSWORD</label>
                 <input 
                   type="password" 
                   value={newPassword}
                   onChange={e => setNewPassword(e.target.value)}
                   className="input w-full"
                   placeholder="At least 6 characters"
                 />
              </div>
              {errorStatus && <p className="text-caption text-danger-fg mb-4 text-center">{errorStatus}</p>}
              <button 
                onClick={handlePasswordReset} 
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
           </div>
        ) : (
          <>
            <div className="flex w-full mb-8 p-1 bg-surface-inset rounded-lg ring-1 ring-border-default">
              <button 
                onClick={() => { setIsStudent(true); setErrorStatus(''); setIdentifier(''); setPassword(''); }}
                className={`flex-1 py-1.5 text-body-sm rounded-md transition-colors ${
                  isStudent ? 'bg-surface-raised text-fg-primary' : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
              >
                Student
              </button>
              <button 
                onClick={() => { setIsStudent(false); setErrorStatus(''); setIdentifier(''); setPassword(''); }}
                className={`flex-1 py-1.5 text-body-sm rounded-md transition-colors ${
                  !isStudent ? 'bg-surface-raised text-fg-primary' : 'text-fg-tertiary hover:text-fg-secondary'
                }`}
              >
                Mentor
              </button>
            </div>

            <div className="w-full flex flex-col gap-6">
              <div>
                <label className="block text-label text-fg-secondary mb-2">
                  {isStudent ? 'UNIVERSITY SEAT NUMBER' : 'EMAIL ADDRESS'}
                </label>
                <input 
                  type={isStudent ? 'text' : 'email'} 
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="input w-full font-mono uppercase"
                  placeholder={isStudent ? '4SH...' : 'mentor@forge.com'}
                />
              </div>

              <div>
                <label className="block text-label text-fg-secondary mb-2">PASSWORD</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input w-full font-mono uppercase"
                  placeholder={isStudent ? 'ENTER USN AS PASSWORD' : '••••••••'}
                />
              </div>

              {isStudent && (
                <p className="text-[11px] text-fg-tertiary text-center -mt-4">
                  Students: Enter your USN in both fields to login.
                </p>
              )}

              {errorStatus && <p className="text-caption text-danger-fg text-center">{errorStatus}</p>}

              <button 
                onClick={submitAuth}
                disabled={loading || !identifier || !password}
                className="btn-primary w-full mt-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
