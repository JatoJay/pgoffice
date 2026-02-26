import { loginAction, registerAction } from "./actions";

interface LoginPageProps {
  searchParams: Promise<{ mode?: string; error?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { mode, error, message } = await searchParams;
  const isRegister = mode === "register";

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <div className="login-logo-mark">PG</div>
              <div className="login-logo-text">
                <span className="login-logo-title">pgmonitor</span>
                <span className="login-logo-subtitle">Impact Management Platform</span>
              </div>
            </div>
          </div>

          <div className="login-content">
            <h1 className="login-title">
              {isRegister ? "Create your account" : "Welcome back"}
            </h1>
            <p className="login-subtitle">
              {isRegister
                ? "Start monitoring your PostgreSQL databases in minutes"
                : "Sign in to access your monitoring dashboard"}
            </p>

            {error && (
              <div className="login-alert login-alert-error">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M10 6v5M10 13.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="login-alert login-alert-success">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{message}</span>
              </div>
            )}

            <form action={isRegister ? registerAction : loginAction} className="login-form">
              {isRegister && (
                <div className="login-field">
                  <label htmlFor="name">Full Name</label>
                  <div className="login-input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="6" r="4" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 18c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              <div className="login-field">
                <label htmlFor="email">Email Address</label>
                <div className="login-input-wrapper">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M2 6l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

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
                    type="password"
                    placeholder="••••••••"
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    required
                  />
                </div>
              </div>

              <button className="login-submit" type="submit">
                <span>{isRegister ? "Create Account" : "Sign In"}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>

            <div className="login-divider">
              <span>or continue with</span>
            </div>

            <div className="login-social">
              <button type="button" className="login-social-btn" disabled>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2C5.582 2 2 5.582 2 10c0 3.535 2.292 6.533 5.471 7.591.4.074.547-.173.547-.385 0-.19-.007-.693-.01-1.36-2.226.483-2.695-1.073-2.695-1.073-.364-.924-.889-1.17-.889-1.17-.726-.496.055-.486.055-.486.803.056 1.226.824 1.226.824.713 1.222 1.872.869 2.328.664.073-.517.279-.869.508-1.069-1.777-.202-3.645-.888-3.645-3.953 0-.873.312-1.587.823-2.147-.082-.202-.357-1.015.079-2.117 0 0 .672-.215 2.2.82a7.673 7.673 0 012.004-.27c.68.003 1.365.092 2.004.27 1.527-1.035 2.198-.82 2.198-.82.437 1.102.162 1.915.08 2.117.513.56.822 1.274.822 2.147 0 3.073-1.87 3.749-3.653 3.947.287.247.543.735.543 1.481 0 1.07-.01 1.932-.01 2.195 0 .214.145.463.55.385C15.71 16.531 18 13.533 18 10c0-4.418-3.582-8-8-8z" fill="currentColor"/>
                </svg>
                <span>GitHub</span>
              </button>
              <button type="button" className="login-social-btn" disabled>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M18.171 8.368h-.08V8.333H10v3.334h4.709A5 5 0 1110 5c1.214 0 2.324.434 3.192 1.152l2.357-2.357A8.316 8.316 0 0010 1.667a8.333 8.333 0 108.171 6.701z" fill="#FFC107"/>
                  <path d="M2.628 6.121l2.74 2.009A5 5 0 0110 5c1.214 0 2.324.434 3.192 1.152l2.357-2.357A8.316 8.316 0 0010 1.667a8.329 8.329 0 00-7.372 4.454z" fill="#FF3D00"/>
                  <path d="M10 18.333a8.294 8.294 0 005.587-2.163l-2.579-2.183A4.963 4.963 0 0110 15a5 5 0 01-4.701-3.306l-2.72 2.095A8.328 8.328 0 0010 18.333z" fill="#4CAF50"/>
                  <path d="M18.171 8.368h-.08V8.333H10v3.334h4.709a5.015 5.015 0 01-1.705 2.32l.001-.001 2.579 2.183c-.182.166 2.749-2.003 2.749-6.169 0-.559-.057-1.104-.162-1.632z" fill="#1976D2"/>
                </svg>
                <span>Google</span>
              </button>
            </div>
          </div>

          <div className="login-footer">
            {isRegister ? (
              <p>
                Already have an account?{" "}
                <a href="/login" className="login-link">Sign in</a>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{" "}
                <a href="/login?mode=register" className="login-link">Create one</a>
              </p>
            )}
          </div>
        </div>

        <div className="login-features">
          <div className="login-feature">
            <div className="login-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="login-feature-text">
              <strong>Real-time Metrics</strong>
              <span>Monitor query performance, connections, and resource usage</span>
            </div>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="login-feature-text">
              <strong>Security Insights</strong>
              <span>Track access patterns and detect anomalies</span>
            </div>
          </div>
          <div className="login-feature">
            <div className="login-feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="login-feature-text">
              <strong>Smart Alerts</strong>
              <span>Get notified before issues impact your users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
