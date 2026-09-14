const { WebSocketServer } = require('ws');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 10000;
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

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

console.log(`Relay running on port ${PORT}`);
