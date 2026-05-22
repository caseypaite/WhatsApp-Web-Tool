export const userApiReference = [
  {
    n: 'Session Status',
    m: 'GET',
    p: '/v1/status',
    k: true,
    mo: true,
    d: 'Check the current WhatsApp connection for your own session'
  },
  {
    n: 'Direct Single',
    m: 'POST',
    p: '/v1/message/single',
    k: true,
    mo: true,
    d: 'Send a direct message from your own WhatsApp session',
    b: '{"number": "91XXXXXXXXXX", "message": "Hello from my session", "mediaUrl": "", "mediaType": "text"}'
  },
  {
    n: 'Direct Group',
    m: 'POST',
    p: '/v1/message/group',
    k: true,
    mo: true,
    d: 'Send a message to a WhatsApp group you manage from your own session',
    b: '{"groupId": "120363XXXXXXXXXXXX@g.us", "message": "Group update", "mediaUrl": "", "mediaType": "image"}'
  },
  {
    n: 'Direct Channel',
    m: 'POST',
    p: '/v1/message/channel',
    k: true,
    mo: true,
    d: 'Publish to a WhatsApp channel you manage from your own session',
    b: '{"channelId": "120363XXXXXXXXXXXX@newsletter", "message": "Channel update", "mediaUrl": "", "mediaType": "image"}'
  },
  {
    n: 'Broadcast',
    m: 'POST',
    p: '/v1/broadcast',
    k: true,
    mo: true,
    d: 'Send to multiple individual, group, or channel targets from your own session',
    b: '{"targets": [{"id": "91XXXXXXXXXX@c.us", "type": "individual"}], "message": "Broadcast content", "mediaUrl": "", "mediaType": "image"}'
  },
  {
    n: 'Native Poll',
    m: 'POST',
    p: '/v1/poll',
    k: true,
    mo: true,
    d: 'Create a WhatsApp native poll from your own session',
    b: '{"chatId": "91XXXXXXXXXX@c.us", "question": "Are you ready?", "options": ["Yes", "No"], "allowMultiple": false}'
  }
];
