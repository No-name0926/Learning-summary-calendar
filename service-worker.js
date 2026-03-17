// 学習集計カレンダー Service Worker

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(clients.claim());
});

// プッシュ通知を受け取ったとき
self.addEventListener('push', (e) => {
  let data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (err) {
    data = { title: '学習集計カレンダー', body: e.data ? e.data.text() : '今日の学習記録をつけよう！' };
  }

  const title = data.title || '📚 学習集計カレンダー';
  const options = {
    body: data.body || '今日の学習記録はもうつけましたか？',
    icon: '/Learning-summary-calendar/icon.png',
    badge: '/Learning-summary-calendar/icon.png',
    tag: 'daily-reminder',
    renotify: true,
    requireInteraction: false,
    data: { url: '/Learning-summary-calendar/' }
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

// 通知をタップしたとき → アプリを開く
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/Learning-summary-calendar/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('Learning-summary-calendar') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
