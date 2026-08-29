import Navbar from "@/components/Navbar";
import SignupForm from "@/components/SignupForm";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Create your account
          </h1>
          <p className="mt-1 text-zinc-600">Join CollegeHub to compare and discover colleges.</p>
        </div>
        <SignupForm />
      </main>
    </div>
  );
}
