-- KPI queries for dataset awaketab_events (docs/18 §4)
-- Optional live run: CF_AE_TOKEN + CF_ACCOUNT_ID with apps/web/scripts/metrics-week.mjs (posts the first statement).

SELECT toStartOfDay(timestamp) AS day,
       countIf(index1 = 'lock_state' AND blob7 = 'held' AND double1 <= 300) / countIf(index1 = 'session_start' AND blob6 = 'autostart') AS autostart_success
FROM awaketab_events WHERE timestamp > NOW() - INTERVAL '7' DAY AND blob4 IN ('web','pwa')
GROUP BY day ORDER BY day;

SELECT blob3 AS ua,
       countIf(index1='session_end' AND blob6 IN ('lost_timeout','denied')) / countIf(index1='session_end') AS bad_end_share,
       countIf(index1='fallback_used') AS fallback
FROM awaketab_events WHERE timestamp > NOW() - INTERVAL '30' DAY
GROUP BY ua ORDER BY bad_end_share DESC;

SELECT toStartOfWeek(timestamp) AS week, sum(double1) / 60 AS awake_hours
FROM awaketab_events WHERE index1 = 'session_end' AND timestamp > NOW() - INTERVAL '12' WEEK
GROUP BY week ORDER BY week;

SELECT countIf(index1='pro_view') AS views, countIf(index1='pro_checkout_click') AS checkouts, countIf(index1='pro_activated') AS activated,
       activated / views AS view_to_active
FROM awaketab_events WHERE timestamp > NOW() - INTERVAL '30' DAY;

SELECT count() AS content_pv FROM awaketab_events
WHERE index1='page_view' AND timestamp > NOW() - INTERVAL '30' DAY
  AND (blob1 LIKE '/for/%' OR blob1 LIKE '/on/%' OR blob1 LIKE '/vs/%' OR blob1 LIKE '/guides/%' OR blob1 LIKE '/learn/%'
       OR blob1 LIKE '/%/for/%' OR blob1 LIKE '/%/on/%' OR blob1 LIKE '/%/vs/%' OR blob1 LIKE '/%/guides/%' OR blob1 LIKE '/%/learn/%');
