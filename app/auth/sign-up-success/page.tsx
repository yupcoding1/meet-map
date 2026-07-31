'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, ArrowRight } from 'lucide-react';

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
              <Mail size={32} className="text-teal-600" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mb-3">Check Your Email</h2>

          <p className="text-slate-600 mb-8">
            We&apos;ve sent you a confirmation link. Click it to verify your email and activate your account.
          </p>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-8">
            <p className="text-sm text-teal-900">
              If you don&apos;t see the email, check your spam folder or try signing up again.
            </p>
          </div>

          <Link href="/auth/login">
            <Button className="w-full h-11 rounded-lg gap-2">
              Back to Sign In
              <ArrowRight size={18} />
            </Button>
          </Link>

          <div className="mt-6 text-sm text-slate-600">
            <p>
              Once confirmed, you&apos;ll be able to{' '}
              <span className="font-semibold text-teal-600">create and join plans</span> with the community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
