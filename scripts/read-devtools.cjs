const http = require('http');
const WebSocket = require('ws');

http.get('http://127.0.0.1:9225/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const targets = JSON.parse(data);
      console.log('Available targets:', targets.map(t => t.url));
      
      const target = targets.find(t => t.url.includes('localhost:3001') || t.url.includes('127.0.0.1:3001'));
      
      if (!target) {
        console.error('Could not find target for localhost:3001');
        process.exit(1);
      }
      
      console.log(`Connecting to debugger: ${target.webSocketDebuggerUrl}`);
      connectDebugger(target.webSocketDebuggerUrl);
    } catch (err) {
      console.error('Failed to parse targets list:', err);
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching targets:', err.message);
  process.exit(1);
});

function connectDebugger(wsUrl) {
  const ws = new WebSocket(wsUrl);
  
  ws.on('open', () => {
    console.log('Connected! Enabling Console and Runtime domains...');
    ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 3, method: 'Page.reload' }));
  });
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.method === 'Runtime.consoleAPICalled') {
      const args = data.params.args.map(arg => arg.value || arg.description || JSON.stringify(arg));
      console.log(`[Browser Console ${data.params.type}]`, ...args);
    }
    
    if (data.method === 'Console.messageAdded') {
      const msg = data.params.message;
      console.log(`[Browser Console ${msg.level}] ${msg.text} (Source: ${msg.url}:${msg.line})`);
    }
    
    if (data.method === 'Runtime.exceptionThrown') {
      const details = data.params.exceptionDetails;
      const exceptionText = details.exception ? (details.exception.description || details.exception.value) : details.text;
      console.error(`\n[Browser Crash Exception]`, exceptionText);
    }
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
  
  setTimeout(() => {
    console.log('\nFinished collecting logs. Closing...');
    ws.close();
    process.exit(0);
  }, 4000);
}
