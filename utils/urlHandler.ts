import { router, Href } from 'expo-router';

type TabInfo = {
  tab: 'moodle' | 'office' | 'schulcloud' | 'wiki' | 'untis';
  route: Href<string>;
};

export const getTabFromUrl = (url: string): TabInfo | null => {
  try {
    const parsedUrl = new URL(url);
    
    switch (parsedUrl.hostname) {
      case 'portal.bbz-rd-eck.com':
        return { tab: 'moodle', route: '/(tabs)/moodle' as Href<string> };
      case 'cryptpad.fr':
        return { tab: 'office', route: '/(tabs)/office' as Href<string> };
      case 'app.schul.cloud':
        return { tab: 'schulcloud', route: '/(tabs)/schulcloud' as Href<string> };
      case 'wiki.bbz-rd-eck.com':
        return { tab: 'wiki', route: '/(tabs)/wiki' as Href<string> };
      case 'neilo.webuntis.com':
        return { tab: 'untis', route: '/(tabs)/untis' as Href<string> };
      default:
        return null;
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
};
