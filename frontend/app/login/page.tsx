import Navbar from "@/components/Navbar";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Login</h1>
          <p className="mt-1 text-zinc-600">Sign in to your CollegeHub account.</p>
        </div>
        <LoginForm />
      </main>
    </div>
  );
}
