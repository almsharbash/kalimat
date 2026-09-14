const http = require('http');
const { WebSocketServer } = require('ws');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 10000;

// بيانات التوثيق والمعلومات الخاصة بالمرحل (NIP-11)
const RELAY_METADATA = {
  name: "كلمات والقلم",
  description: "مرحّل كلمات الخاص لنشر المحتوى والتواصل عبر Nostr",
  pubkey: "", // يمكنك وضع مفتاحك العام (npub أو hex) هنا إن أردت
  contact: "bal612.com@gmail.com",
  supported_nips: [1, 11, 20],
  software: "kalimat-custom-relay",
  version: "1.0.0",
  icon: "https://kalimat-ruddy.vercel.app/icon.png", // رابط الشعار (أو أي رابط صورة مباشر للشعار)
  privacy_policy: "https://kalimat.app/privacy",
  terms_of_service: "https://kalimat.app/terms"
};

// إنشاء خادم HTTP للتعامل مع طلبات البيانات وطلبات الـ WebSocket
const server = http.createServer((req, res) => {
  // إضافة ترويسات CORS للسماح بالوصول من أي تطبيق
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // عند طلب معلومات المرحل (NIP-11)
  if (req.headers['accept'] === 'application/nostr+json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(RELAY_METADATA));
  } else {
    // الاستجابة العادية عند فتح الرابط في المتصفح
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('مرحباً بك في مرحّل كلمات (Kalimat Nostr Relay)');
  }
});

// إعداد خادم الـ WebSocket على نفس الخادم
const wss = new WebSocketServer({ server });

const SUPABASE_URL = 'https://iewuxvilbwlvvxgdnfze.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlld3V4dmlsYndsdnZ4Z2RuZnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2OTA1OTUsImV4cCI6MjA3MzI2NjU5NX0.S_J4H6Y3oG6wYvWv8F0-fE4uP4nZ5h6g7-h8i9j0k1l2';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message[0] === 'EVENT') {
        const event = message[1];
        const { error } = await supabase.from('events').insert([{
          id: event.id,
          pubkey: event.pubkey,
          created_at: event.created_at,
          kind: event.kind,
          tags: JSON.stringify(event.tags),
          content: event.content,
          sig: event.sig
        }]);

        if (!error) {
          ws.send(JSON.stringify(['OK', event.id, true, 'saved']));
        } else {
          ws.send(JSON.stringify(['OK', event.id, false, error.message]));
        }
      }
    } catch (e) {
      console.error(e);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Relay running on port ${PORT}`);
});
