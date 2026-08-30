import { AuthPanel } from "@/components/auth/AuthPanel";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-4 py-10">
      <div className="w-full max-w-md">
        <AuthPanel />
      </div>
    </main>
  );
}
