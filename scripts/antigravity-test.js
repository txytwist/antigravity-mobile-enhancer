/* Quantumult X script-response-body; no network, storage or logging. */
(function () {
  var result = {};
  try {
    if ($request.url === 'https://antigravity.google.com/remote' &&
        $request.method === 'GET' && typeof $response.body === 'string') {
      var requestHeaders = $request.headers || {};
      var destinations = Object.keys(requestHeaders).filter(function (key) {
        return key.toLowerCase() === 'sec-fetch-dest';
      });
      var isDocument = destinations.length === 0 ||
        (destinations.length === 1 && requestHeaders[destinations[0]] === 'document');
      var headers = $response.headers || {};
      var contentType = Object.keys(headers).filter(function (key) {
        return key.toLowerCase() === 'content-type';
      });
      if (isDocument && contentType.length === 1 &&
          /^text\/html\s*(?:;|$)/i.test(headers[contentType[0]])) {
        var body = $response.body;
        var inHead = false;
        // shortcut: scan ordinary HTML head tokens, not a full HTML parser; revisit if the site's markup needs more.
        var tokens = /<!--[\s\S]*?(?:-->|$)|<(script|style|textarea)\b(?:"[^"]*"|'[^']*'|[^'">])*?>[\s\S]*?(?:<\/\1\s*>|$)|(<title(?:\s+(?:"[^"]*"|'[^']*'|[^'">])*)?>)[\s\S]*?(<\/title\s*>)|<[^>]*>/gi;
        var match;
        while ((match = tokens.exec(body)) !== null) {
          if (/^<head\s*>$/i.test(match[0])) inHead = true;
          if (/^<\/(?:head)\s*>$|^<body\b/i.test(match[0])) break;
          if (inHead && match[2]) {
            var changed = body.slice(0, match.index) + match[2] +
              'QX 测试成功' + match[3] + body.slice(tokens.lastIndex);
            if (changed !== body) result = { body: changed };
            break;
          }
        }
      }
    }
  } catch (error) {
    result = {};
  }
  $done(result);
}());
