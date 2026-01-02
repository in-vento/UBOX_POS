'use server';

import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  // Mock login logic, in a real app you'd validate credentials
  const email = formData.get('email');
  if (email) {
    // In a real app, you would set a session cookie here
    redirect('/dashboard?role=admin');
  }
}

export async function logout() {
  // In a real app, you would clear the session cookie here
  redirect('/');
}
