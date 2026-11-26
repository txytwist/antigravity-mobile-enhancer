const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const source = fs.readFileSync('scripts/antigravity-test.js', 'utf8');
const html = '<!doctype html><html><head><title>Antigravity</title></head><body>Task</body></html>';
const expected = html.replace('Antigravity', 'QX 测试成功');
function run({ logs = [], logger = (message) => logs.push(message), request = { url: 'https://antigravity.google.com/remote', method: 'GET' },
  response = { headers: { 'Content-Type': 'text/html; charset=utf-8' }, body: html } } = {}) {
  const before = JSON.stringify({ request, response });
  let calls = 0;
  let result;
  vm.runInNewContext(source, { console: { log: logger }, $request: request, $response: response,
    $done(value) { calls++; result = value; } }, { timeout: 1000 });
  assert.equal(calls, 1);
  assert.equal(JSON.stringify({ request, response }), before);
  return JSON.parse(JSON.stringify(result));
}
test('only changes title text; repeated execution is stable', () => {
  assert.deepEqual(run(), { body: expected });
  assert.deepEqual(run({ response: { headers: { 'content-type': 'TEXT/HTML' }, body: expected } }), {});
});
test('rejects other URLs and methods', () => {
  for (const url of ['http://antigravity.google.com/remote', 'https://google.com/remote',
    'https://antigravity.google.com.evil.test/remote', 'https://antigravity.google.com/remote/',
    'https://antigravity.google.com/remote/task', 'https://antigravity.google.com/remote?x=1',
    'https://antigravity.google.com/remote#x', 'https://antigravity.google.com:443/remote',
    'https://antigravity.google.com/remote\n']) {
    assert.deepEqual(run({ request: { url, method: 'GET' } }), {});
  }
  assert.deepEqual(run({ request: { url: 'https://antigravity.google.com/remote', method: 'POST' } }), {});
});
test('non-document fetches pass through', () => {
  for (const destination of ['empty', 'iframe', 'script']) {
    assert.deepEqual(run({ request: { url: 'https://antigravity.google.com/remote', method: 'GET',
      headers: { 'Sec-Fetch-Dest': destination } } }), {});
  }
  assert.deepEqual(run({ request: { url: 'https://antigravity.google.com/remote', method: 'GET',
    headers: { 'Sec-Fetch-Dest': 'document' } } }), { body: expected });
});
test('non-HTML, missing headers/body, no title and malformed HTML pass through', () => {
  for (const headers of [{}, { 'Content-Type': 'application/json' },
    { 'Content-Type': 'text/plain' }, { 'Content-Type': 'text/htmlish' }]) {
    assert.deepEqual(run({ response: { headers, body: html } }), {});
  }
  for (const body of [undefined, null, 1, '', '<html><head></head></html>',
    '<html><head><title>Unclosed', '<html><body><title>Body title</title></body></html>']) {
    assert.deepEqual(run({ response: { headers: { 'Content-Type': 'text/html' }, body } }), {});
  }
  assert.deepEqual(run({ response: null }), {});
  assert.deepEqual(run({ request: null }), {});
});
test('preserves attributes, comments, scripts, styles, headers and task content', () => {
  const prefix = '<html><head><!-- <title>comment</title> --><script>const x="<title>script</title>";</script><style>/* <title>style</title> */</style>';
  const suffix = '</head><body>Task stays</body></html>';
  const body = prefix + '<TITLE data-x="a>b">Old\nTitle</TITLE>' + suffix;
  assert.deepEqual(run({ response: { headers: { 'Content-Type': 'text/html',
    'Content-Security-Policy': "script-src 'self'" }, body } }),
    { body: prefix + '<TITLE data-x="a>b">QX 测试成功</TITLE>' + suffix });
});
test('exceptions pass through without retrying completion or exposing data', () => {
  const response = { get body() { throw new Error('synthetic'); } };
  let calls = 0;
  vm.runInNewContext(source, { $request: { url: 'https://antigravity.google.com/remote', method: 'GET' },
    $response: response, $done(result) { calls++; assert.equal(JSON.stringify(result), '{}'); } });
  assert.equal(calls, 1);
  let missing;
  vm.runInNewContext(source, { $done(result) { missing = JSON.stringify(result); } });
  assert.equal(missing, '{}');
});

test('diagnostics contain exactly three booleans and no response or request data', () => {
  const cases = [
    [{}, [true, true, true]],
    [{ response: { headers: { 'Content-Type': 'application/json' }, body: 'private task' } }, [true, false, false]],
    [{ response: { headers: { 'Content-Type': 'text/html' }, body: '<html><head></head></html>' } }, [true, true, false]],
    [{ response: { headers: { 'Content-Type': 'text/html' }, body: expected } }, [true, true, false]],
    [{ response: { headers: { 'Content-Type': 'text/html' } } }, [true, false, false]],
    [{ response: null }, [true, false, false]],
    [{ request: null }, [true, true, false]],
  ];
  for (const [options, values] of cases) {
    const logs = [];
    run({ ...options, logs });
    assert.deepEqual(logs, [JSON.stringify(Object.fromEntries(
      ['scriptTriggered', 'htmlReceived', 'titleReplaced'].map((key, index) => [key, values[index]])))]);
  }
});
test('diagnostic logger failure still completes response exactly once', () => {
  assert.deepEqual(run({ logger() { throw new Error('synthetic logger failure'); } }), { body: expected });
});
test('response exception logs only status and missing globals still complete', () => {
  const logs = [];
  const context = { console: { log(message) { logs.push(message); } },
    $response: { get headers() { throw new Error('PRIVATE_SENTINEL'); } },
    $done(result) { assert.equal(JSON.stringify(result), '{}'); } };
  vm.runInNewContext(source, context);
  assert.deepEqual(logs, ['{"scriptTriggered":true,"htmlReceived":false,"titleReplaced":false}']);
});
