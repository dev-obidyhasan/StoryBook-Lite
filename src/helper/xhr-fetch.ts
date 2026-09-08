'use client';

/**
 * XHR-based fetch replacement.
 *
 * Some browser extensions (download managers such as IDM, browser hijackers,
 * and antivirus content scripts) monkey-patch `window.fetch`. Their patched
 * version sends the request through a content-script / background-script
 * bridge and, when the extension context is invalidated or the script isn't
 * actually loaded, the bridge fails with:
 *
 *   "Could not establish connection. Receiving end does not exist."
 *
 * The patched `fetch` then rejects the promise, and because the response
 * never carries the `Access-Control-Allow-Origin` header, the browser ALSO
 * reports a CORS error:
 *
 *   "Access to fetch at '...' has been blocked by CORS policy:
 *    No 'Access-Control-Allow-Origin' header is present..."
 *
 * `XMLHttpRequest` is not patched by these extensions, so using it here
 * makes the uploads immune to that class of failure. We keep the same
 * fetch-like signature so the call sites don't change.
 */

export interface XhrFetchOptions extends RequestInit {
  /** Progress callback (upload progress in 0..1). */
  onUploadProgress?: (percent: number) => void;
}

/**
 * fetch() polyfill backed by XMLHttpRequest.
 * Returns the same Response-shaped object the rest of the app expects.
 */
export function xhrFetch(
  input: string,
  options: XhrFetchOptions = {},
): Promise<Response> {
  const { headers: rawHeaders, method = 'GET', body, onUploadProgress } = options;

  return new Promise<Response>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, input, true);

    // Apply custom headers (Authorization, Content-Type, Accept, ...)
    if (rawHeaders) {
      const headers = rawHeaders instanceof Headers
        ? Array.from(rawHeaders.entries())
        : Object.entries(rawHeaders as Record<string, string>);
      for (const [key, value] of headers) {
        if (value != null) xhr.setRequestHeader(key, String(value));
      }
    }

    // Send cookies on cross-origin requests (matches credentials: 'include')
    xhr.withCredentials = true;

    // Report upload progress so the UI can show a real progress bar.
    if (onUploadProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
        if (e.lengthComputable && e.total > 0) {
          onUploadProgress(e.loaded / e.total);
        }
      });
    }

    xhr.onload = () => {
      const response = new Response(xhr.response, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr.getAllResponseHeaders()),
      });
      resolve(response);
    };

    xhr.onerror = () => {
      // Mirror the native fetch error so callers can distinguish network errors.
      reject(new TypeError('Failed to fetch'));
    };

    xhr.ontimeout = () => reject(new TypeError('Network request failed (timeout).'));

    xhr.send(body as XMLHttpRequestBodyInit | null);
  });
}

/** Parse the raw `getAllResponseHeaders()` string into a Headers object. */
function parseHeaders(raw: string): Headers {
  const headers = new Headers();
  if (!raw) return headers;
  const lines = raw.trim().split(/[\r\n]+/);
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) headers.append(key, value);
  }
  return headers;
}
