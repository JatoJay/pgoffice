"use client";

import { useState } from "react";

type PasswordInputProps = {
  isRegister: boolean;
};

export function PasswordInput({ isRegister }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-field">
      <label htmlFor="password">Password</label>
      <div className="login-input-wrapper">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="9" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M6 9V6a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="10" cy="13" r="1.5" fill="currentColor"/>
        </svg>
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 17L17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
