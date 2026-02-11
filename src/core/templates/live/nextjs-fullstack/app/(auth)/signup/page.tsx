/**
 * @fileoverview Page module
 * @module signup/page
 */

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <form className="space-y-4">
          <input className="w-full border p-2" placeholder="Email" />
          <input className="w-full border p-2" placeholder="Password" type="password" />
          <button className="w-full bg-black text-white py-2">Create account</button>
        </form>
      </div>
    </div>
  );
}

/**
 * Error handler for page
 * @param {Error} error - Error to handle
 */
function handlePageError(error) {
  try {
    console.error('[page]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
