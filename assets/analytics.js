// PostHog web analytics for panicbusapps.com. Every page loads this one file,
// so the project token lives here and nowhere else.
//
// The token is a public, write-only project key (it starts with "phc_"). It is
// safe to commit. Find it in PostHog under Settings > Project > Project token.
(function () {
  var POSTHOG_TOKEN = 'phc_ozvHgUZeNDiUSAYRE6GpxTtyyimqCkT9qr7jV2Uu6KZ3';
  // Our own path, proxied to PostHog's US servers by netlify.toml.
  var POSTHOG_HOST = '/pbr';

  // Stay silent until a real token is set, and never count local previews.
  if (POSTHOG_TOKEN.indexOf('REPLACE') !== -1) return;
  var host = location.hostname;
  if (location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '') return;

  // Forget any PostHog toolbar a past visit opened (it saves itself in local
  // storage and reappears as an "Authenticate" bar on every page otherwise).
  try { localStorage.removeItem('_postHogToolbarParams'); } catch (e) {}

  // Official PostHog loader snippet: https://posthog.com/docs/libraries/js
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  window.posthog.init(POSTHOG_TOKEN, {
    api_host: POSTHOG_HOST,
    ui_host: 'https://us.posthog.com',
    defaults: '2026-08-30',
    // Visitors are anonymous; no person profiles are created for them.
    person_profiles: 'identified_only',
    // A marketing site doesn't need replays, and skipping them keeps the
    // organization's free recording allowance for the apps (TallyUp etc.).
    disable_session_recording: true
  });
})();
