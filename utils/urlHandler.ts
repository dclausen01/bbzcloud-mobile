import { router, Href } from 'expo-router';

type TabInfo = {
  tab: 'moodle' | 'wiki';
  route: Href<string>;
};

export const getTabFromUrl = (url: string): TabInfo | null => {
  try {
    const parsedUrl = new URL(url);
    
    switch (parsedUrl.hostname) {
      case 'portal.bbz-rd-eck.com':
        return { tab: 'moodle', route: '/(tabs)/moodle' as Href<string> };
      case 'wiki.bbz-rd-eck.com':
        return { tab: 'wiki', route: '/(tabs)/wiki' as Href<string> };
      default:
        return null;
    }
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
};
