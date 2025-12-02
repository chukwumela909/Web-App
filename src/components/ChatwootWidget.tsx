'use client';

import { useEffect } from 'react';

interface ChatwootWindow extends Window {
  chatwootSDK?: {
    run: (config: ChatwootConfig) => void;
    toggle: (visibility?: 'open' | 'close') => void;
  };
}

interface ChatwootConfig {
  websiteToken: string;
  baseUrl: string;
  locale?: string;
  type?: 'standard' | 'expanded_bubble';
  launcherTitle?: string;
  showPopoutButton?: boolean;
  widgetStyle?: 'standard' | 'flat';
  darkMode?: 'light' | 'dark' | 'auto';
}

declare const window: ChatwootWindow;

interface ChatwootWidgetProps {
  websiteToken?: string;
  baseUrl?: string;
  locale?: string;
  launcherTitle?: string;
  showPopoutButton?: boolean;
  darkMode?: 'light' | 'dark' | 'auto';
}

const ChatwootWidget = ({
  websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || '',
  baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://app.chatwoot.com',
  locale = 'en',
  launcherTitle = 'Chat with us',
  showPopoutButton = true,
  darkMode = 'auto'
}: ChatwootWidgetProps = {}) => {
  useEffect(() => {
    // Add Chatwoot Settings
    const addChatwootSettings = () => {
      const script = document.createElement('script');
      script.src = `${baseUrl}/packs/js/sdk.js`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        if (window.chatwootSDK) {
          window.chatwootSDK.run({
            websiteToken,
            baseUrl,
            locale,
            type: 'standard',
            launcherTitle,
            showPopoutButton,
            widgetStyle: 'standard',
            darkMode
          });
        }
      };
      
      script.onerror = () => {
        console.warn('Failed to load Chatwoot widget');
      };
      
      document.head.appendChild(script);
    };

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src="${baseUrl}/packs/js/sdk.js"]`);
    if (!existingScript) {
      addChatwootSettings();
    } else if (window.chatwootSDK) {
      // Re-initialize if script exists but SDK is available
      window.chatwootSDK.run({
        websiteToken,
        baseUrl,
        locale,
        type: 'standard',
        launcherTitle,
        showPopoutButton,
        widgetStyle: 'standard',
        darkMode
      });
    }

    // Cleanup function
    return () => {
      // Note: We don't remove the script on unmount to avoid issues with re-mounting
      // The widget will persist across page navigations which is typically desired
    };
  }, [websiteToken, baseUrl, locale, launcherTitle, showPopoutButton, darkMode]);

  return null; // This component doesn't render anything visible
};

export default ChatwootWidget;
