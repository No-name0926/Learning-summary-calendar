// GitHub Actionsから実行される通知送信スクリプト
// 使用ライブラリ: web-push, firebase-admin

const webpush = require('web-push');
const admin = require('firebase-admin');

// ── VAPID設定 ──────────────────────────────
webpush.setVapidDetails(
  'mailto:lsc.app.support@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ── Firebase Admin初期化 ────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://study-summary-calendar-default-rtdb.firebaseio.com'
});

const db = admin.database();

// ── メッセージ一覧（ランダムで選ぶ） ──────────
const MESSAGES = [
  { title: '📚 今日も学習しよう！', body: '毎日の積み重ねが最強の武器になります。今日の記録をつけましょう！' },
  { title: '🏆 ランキングを確認しよう！', body: '今日の学習を記録してライバルに差をつけよう！' },
  { title: '🎯 目標に近づこう！', body: '今日の学習記録をつけて、カウントダウンを進めよう。' },
  { title: '⭐ レベルアップまであと少し？', body: 'スタンプを貯めてEXPを稼ごう！今日の記録はもうつけましたか？' },
  { title: '🔥 連続記録を続けよう！', body: '今日も学習記録をつけてストリークを伸ばそう！' },
  { title: '📅 今日の振り返りをしよう', body: '何時間学習できましたか？カレンダーに記録してみましょう。' },
];

async function sendNotifications() {
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  console.log(`送信メッセージ: ${msg.title}`);

  // Firebaseから全購読者を取得
  const snapshot = await db.ref('pushSubscriptions').once('value');
  const subs = snapshot.val();

  if (!subs) {
    console.log('購読者なし');
    process.exit(0);
  }

  const entries = Object.entries(subs);
  console.log(`購読者数: ${entries.length}`);

  let success = 0, failed = 0;

  await Promise.all(entries.map(async ([uid, sub]) => {
    try {
      await webpush.sendNotification(sub, JSON.stringify(msg));
      success++;
    } catch (err) {
      console.error(`送信失敗 uid:${uid}`, err.statusCode);
      // 410: 購読が無効になった → Firebaseから削除
      if (err.statusCode === 410 || err.statusCode === 404) {
        await db.ref(`pushSubscriptions/${uid}`).remove();
        console.log(`  → 無効な購読を削除: ${uid}`);
      }
      failed++;
    }
  }));

  console.log(`完了 成功:${success} 失敗:${failed}`);
  process.exit(0);
}

sendNotifications().catch((e) => {
  console.error(e);
  process.exit(1);
});
