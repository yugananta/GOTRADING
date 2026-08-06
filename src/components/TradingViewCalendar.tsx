import React, { useEffect, useRef } from 'react';

interface TradingViewCalendarProps {
  theme?: 'light' | 'dark';
}

export const TradingViewCalendar: React.FC<TradingViewCalendarProps> = ({ theme = 'light' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous children in case of re-renders
    containerRef.current.innerHTML = '';

    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container';
    widgetContainer.style.width = '100%';
    widgetContainer.style.height = '100%';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.width = '100%';
    widget.style.height = '100%';
    widgetContainer.appendChild(widget);

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isTransparent: true,
      width: '100%',
      height: '550',
      locale: 'en',
      importanceFilter: '0',
      countryFilter: 'us,eu,gb,jp,ch,ca,au,nz,cn'
    });
    widgetContainer.appendChild(script);

    containerRef.current.appendChild(widgetContainer);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [theme]);

  return (
    <div className="w-full h-[550px] rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800/80 relative z-0 bg-white dark:bg-[#121620]">
      <div ref={containerRef} className="w-full h-full" id="tradingview-calendar-widget-container" />
    </div>
  );
};
