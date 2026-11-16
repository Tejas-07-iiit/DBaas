/**
 * @file src/lib/auth/authErrors.ts
 * @description Translates Firebase Auth error codes into clean, user-friendly error messages.
 */

export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return "An unexpected error occurred. Please try again.";

  // If already a standard string
  if (typeof error === 'string') return error;

  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return "Invalid email or password. Please verify your credentials.";
    case 'auth/email-already-in-use':
      return "An account with this email already exists. Try logging in instead.";
    case 'auth/weak-password':
      return "Password is too weak. Please choose a stronger password (at least 6 characters).";
    case 'auth/invalid-email':
      return "Please enter a valid email address.";
    case 'auth/user-disabled':
      return "This account has been disabled. Please contact support.";
    case 'auth/too-many-requests':
      return "Too many failed attempts. Access to this account has been temporarily disabled. Please reset your password or try again later.";
    case 'auth/network-request-failed':
      return "Network connection error. Please check your internet connection and try again.";
    case 'auth/account-exists-with-different-credential':
      return "An account already exists with the same email address using a different login method. Please sign in using your original provider.";
    case 'auth/popup-blocked':
      return "The login popup was blocked by your browser. Please allow popups for this site.";
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return "";
    case 'auth/operation-not-allowed':
      return "This authentication provider is not enabled in the Firebase Console.";
    case 'auth/configuration-not-found':
      return "Firebase Authentication is not activated for this project. Please go to Firebase Console > Authentication > Click 'Get started' and enable Email/Password or Google.";
    default:
      return error.message || "An unexpected error occurred. Please try again.";
  }
}
