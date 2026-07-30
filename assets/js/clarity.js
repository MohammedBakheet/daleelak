(() => {
  'use strict';

  const CLARITY_PROJECT_ID = 'xurquxq2yt';

  const isConfigured =
    CLARITY_PROJECT_ID &&
    CLARITY_PROJECT_ID !== 'xurquxq2yt';

  if (!isConfigured) {
    console.info(
      '[دليلك] Microsoft Clarity غير مفعّل بعد.'
    );
    return;
  }

  window.clarity = window.clarity || function () {
    (window.clarity.q = window.clarity.q || []).push(arguments);
  };

  const script = document.createElement('script');

  script.async = true;
  script.src =
    `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_PROJECT_ID)}`;

  script.onerror = () => {
    console.warn(
      '[دليلك] تعذر تحميل Microsoft Clarity.'
    );
  };

  const firstScript = document.getElementsByTagName('script')[0];

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  window.DaleelakClarity = {
    configured: true,
    projectId: CLARITY_PROJECT_ID,

    setTag(name, value) {
      if (!name || value === undefined || value === null) return;

      window.clarity(
        'set',
        String(name),
        String(value)
      );
    },

    setTags(tags = {}) {
      Object.entries(tags).forEach(([name, value]) => {
        this.setTag(name, value);
      });
    }
  };
})();