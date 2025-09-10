import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.tsx'

// Auth0 configuration (shared with frontpage)
const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const redirectUri = import.meta.env.VITE_AUTH0_CALLBACK_URL || window.location.origin;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Validate Auth0 configuration
if (!domain || !clientId || !audience) {
  console.error(
    'Missing Auth0 configuration. Make sure VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and VITE_AUTH0_AUDIENCE are set in your .env file.'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: audience,
        scope: 'openid profile email'
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>,
)
