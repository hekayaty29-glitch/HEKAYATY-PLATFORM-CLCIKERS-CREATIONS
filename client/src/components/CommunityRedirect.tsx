import { useEffect } from 'react';

export default function CommunityRedirect() {
  useEffect(() => {
    // Redirect to external community site
    window.location.href = 'https://hekayaty-community.vercel.app/';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900/20 to-brown-dark text-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <h2 className="font-cinzel text-2xl font-bold mb-2">Redirecting to Community...</h2>
        <p className="text-amber-200">
          Taking you to the HEKAYATY Community platform
        </p>
        <p className="text-amber-300 text-sm mt-4">
          If you're not redirected automatically, 
          <a 
            href="https://hekayaty-community.vercel.app/" 
            className="text-amber-400 hover:text-amber-300 underline ml-1"
            target="_blank" 
            rel="noopener noreferrer"
          >
            click here
          </a>
        </p>
      </div>
    </div>
  );
}
