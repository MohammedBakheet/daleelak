/**
 * تحليلات موقع دليلك — Google Analytics 4
 *
 * طريقة التفعيل:
 * 1) أنشئ تدفق ويب في Google Analytics 4.
 * 2) انسخ Measurement ID الذي يبدأ بـ G-.
 * 3) استبدل G-XXXXXXXXXX في السطر التالي بالمعرف الحقيقي.
 * 4) لا تضف Google tag مرة ثانية داخل ملفات HTML؛ هذا الملف يتولى تحميله.
 */
(function () {
  'use strict';

  const MEASUREMENT_ID = 'G-8GCSQ9L2NQ';
  const DEBUG_MODE = new URLSearchParams(window.location.search).get('ga_debug') === '1';
  const isConfigured = /^G-[A-Z0-9]+$/i.test(MEASUREMENT_ID) && MEASUREMENT_ID !== 'G-8GCSQ9L2NQ';
  let context = {};
  const sentViews = new Set();

  function cleanValue(value) {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'string') return value.slice(0, 100);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    return String(value).slice(0, 100);
  }

  function cleanParams(params) {
    const output = {};
    Object.entries(params || {}).forEach(([key, value]) => {
      const cleaned = cleanValue(value);
      if (cleaned !== undefined) output[key] = cleaned;
    });
    return output;
  }

  function detectDeviceGroup() {
    const ua = navigator.userAgent || '';
    if (/iPad/i.test(ua)) return 'ipad';
    if (/iPhone|iPod/i.test(ua)) return 'iphone';
    if (/Android/i.test(ua)) return 'android';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'mac';
    if (/Windows/i.test(ua)) return 'windows';
    return 'other';
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  if (isConfigured) {
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: true,
      debug_mode: DEBUG_MODE
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
    document.head.appendChild(script);
  } else {
    console.info('[دليلك] Google Analytics غير مفعّل بعد. استبدل G-8GCSQ9L2NQ داخل assets/js/analytics.js.');
  }

  function track(eventName, params = {}) {
    const payload = cleanParams({
      ...context,
      device_group: detectDeviceGroup(),
      page_path: window.location.pathname,
      ...params,
      ...(DEBUG_MODE ? { debug_mode: true } : {})
    });

    if (DEBUG_MODE || !isConfigured) {
      console.info('[دليلك Analytics]', eventName, payload);
    }
    if (isConfigured) window.gtag('event', eventName, payload);
  }

  function setContext(nextContext = {}) {
    context = cleanParams({ ...context, ...nextContext });
  }

  function trackViewOnce(eventName, uniqueId, params = {}) {
    const key = `${eventName}:${uniqueId || window.location.href}`;
    if (sentViews.has(key)) return;
    sentViews.add(key);
    track(eventName, params);
  }

  function text(selector, root = document) {
    return root.querySelector(selector)?.textContent?.trim() || '';
  }

  function currentCalendarContext() {
    const params = new URLSearchParams(window.location.search);
    return {
      calendar_id: params.get('id') || params.get('calendar') || context.calendar_id,
      calendar_name: text('[data-calendar-detail] h1') || context.calendar_name,
      organization: text('[data-calendar-detail] .org') || context.organization
    };
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('a,button');
    if (!target) return;
    const calendar = currentCalendarContext();

    if (target.matches('[data-open-android-subscribe]')) {
      track('select_subscription_method', { ...calendar, subscription_method: 'android_options' });
      return;
    }
    if (target.matches('[data-copy],[data-android-copy]')) {
      track('copy_calendar_url', { ...calendar, subscription_method: 'copy_url' });
      return;
    }
    if (target.matches('[data-android-google]')) {
      track('open_google_calendar', { ...calendar, subscription_method: 'google' });
      return;
    }
    if (target.matches('.primary-subscribe-button[href]')) {
      const href = target.getAttribute('href') || '';
      let method = 'calendar_app';
      let eventName = 'select_subscription_method';
      if (href.startsWith('webcal:')) {
        method = /iPhone|iPad|Macintosh/i.test(navigator.userAgent) ? 'apple' : 'webcal';
        eventName = method === 'apple' ? 'open_apple_calendar' : eventName;
      } else if (href.includes('calendar.google.com')) {
        method = 'google'; eventName = 'open_google_calendar';
      } else if (href.includes('outlook.live.com')) {
        method = 'outlook'; eventName = 'open_outlook_calendar';
      }
      track(eventName, { ...calendar, subscription_method: method });
      return;
    }
    if (target.matches('a[download]')) {
      track('download_ics', {
        ...calendar,
        calendar_id: target.dataset.calendarId || calendar.calendar_id,
        calendar_name: target.dataset.calendarName || calendar.calendar_name,
        file_url: target.href
      });
      return;
    }
    if (target.matches('.android-help-link')) {
      track('open_android_help', calendar);
      return;
    }
    if (target.matches('[data-share-page]')) {
      track('share_calendar_page', calendar);
      return;
    }
    if (target.matches('[data-report-link]')) {
      track('report_calendar_error', calendar);
      return;
    }
    if (target.matches('.card-link')) {
      track('select_category', { category_name: text('.card-title', target.closest('.category-card')) });
      return;
    }
    if (target.matches('.calendar-card .btn-primary')) {
      track('select_calendar', {
        calendar_id: target.dataset.calendarId,
        calendar_name: target.dataset.calendarName
      });
      return;
    }
    if (target.matches('.league-card .btn-primary')) {
      track('select_league', { league_id: target.dataset.leagueId, league_name: target.dataset.leagueName });
    }
  });

  function bindSearch(selector, scope) {
    const input = document.querySelector(selector);
    if (!input || input.dataset.analyticsBound === 'true') return;
    input.dataset.analyticsBound = 'true';
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const term = input.value.trim();
        if (term.length < 2) return;
        const resultCount = document.querySelectorAll(`${scope}:not([hidden])`).length;
        track(resultCount ? 'calendar_search' : 'search_no_results', {
          search_term: term,
          results_count: resultCount
        });
      }, 800);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindSearch('[data-home-search]', '.category-card');
    bindSearch('[data-search]', '.calendar-card, .league-card');
    bindSearch('[data-team-search]', '.team-calendar-card');
  });

  window.DaleelakAnalytics = {
    track,
    setContext,
    trackViewOnce,
    detectDeviceGroup,
    measurementId: MEASUREMENT_ID,
    configured: isConfigured
  };
})();
