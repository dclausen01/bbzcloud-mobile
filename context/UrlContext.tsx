import React, { createContext, useContext, useState } from 'react';

type UrlContextType = {
  urls: {
    moodle: string;
    office: string;
    schulcloud: string;
    wiki: string;
    untis: string;
  };
  setUrl: (tab: keyof UrlContextType['urls'], url: string) => void;
};

const defaultUrls = {
  moodle: 'https://portal.bbz-rd-eck.com',
  office: 'https://cryptpad.fr/drive',
  schulcloud: 'https://app.schul.cloud',
  wiki: 'https://wiki.bbz-rd-eck.com',
  untis: 'https://neilo.webuntis.com/WebUntis/?school=bbz-rd-eck#/basic/login',
};

const UrlContext = createContext<UrlContextType | undefined>(undefined);

export const UrlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [urls, setUrls] = useState(defaultUrls);

  const setUrl = (tab: keyof typeof urls, url: string) => {
    setUrls(prev => ({
      ...prev,
      [tab]: url,
    }));
  };

  return (
    <UrlContext.Provider value={{ urls, setUrl }}>
      {children}
    </UrlContext.Provider>
  );
};

export const useUrl = () => {
  const context = useContext(UrlContext);
  if (context === undefined) {
    throw new Error('useUrl must be used within a UrlProvider');
  }
  return context;
};
