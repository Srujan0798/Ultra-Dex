export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-bold">Login</h1>
        <form className="space-y-4">
          <input className="w-full border p-2" placeholder="Email" />
          <input className="w-full border p-2" placeholder="Password" type="password" />
          <button className="w-full bg-black text-white py-2">Sign in</button>
        </form>
      </div>
    </div>
  );
}
