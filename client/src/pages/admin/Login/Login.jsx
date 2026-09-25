import { Link } from 'react-router'
import PlaceholderPage from '../../../components/common/PlaceholderPage'
import { SITE_NAME } from '../../../constants/site'

/** Rendered outside AdminLayout: no sidebar before sign-in. */
function Login() {
  return (
    <main
      id="main-content"
      className="flex min-h-svh flex-col items-center justify-center gap-6 bg-surface-muted px-4 py-12"
    >
      <p className="text-lg font-extrabold tracking-tight text-ink uppercase">
        {SITE_NAME}
      </p>
      <div className="w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-sm md:p-8">
        <PlaceholderPage
          variant="admin"
          title="Admin Login"
          route="/admin/login"
          phase="Phase 3 — Authentication"
          description="Email and password sign-in for NIST FC administrators."
        />
      </div>
      <Link
        to="/"
        className="text-sm font-semibold text-ink-muted hover:text-ink"
      >
        Back to website
      </Link>
    </main>
  )
}

export default Login
