// ===============================
// UI References
// ===============================
const container = document.getElementById("errors");
const clearBtn = document.getElementById("clearErrors");

// ===============================
// Clear Button Logic
// ===============================
clearBtn.addEventListener("click", () => {
  container.innerHTML = "";
});

// ===============================
// Network Listener
// ===============================
chrome.devtools.network.onRequestFinished.addListener((request) => {

  const status = request.response.status;
  const url = request.request.url;
  const method = request.request.method;

  request.getContent((body) => {

    // Normalize empty response body
    if (!body) {
      body = "⚠ No response body available (request failed before response was returned)";
    }

    // Detect missing / broken response body
    const hasNoResponseBody =
      body.includes("No response body available") ||
      body.includes("failed before response");

    // Detect GraphQL logical errors (200 OK but errors inside)
    let graphQLError = null;
    try {
      const json = JSON.parse(body);
      if (json.errors) {
        graphQLError = JSON.stringify(json.errors, null, 2);
      }
    } catch (e) {
      // Non-JSON response (ignore)
    }

    // ===============================
    // FINAL DECISION LOGIC (IMPORTANT)
    // ===============================
    const shouldShowError =
      status !== 200 || // any 3xx / 4xx / 5xx
      (status === 200 && (hasNoResponseBody || graphQLError)); // broken 200

    // ===============================
    // Render Error Card
    // ===============================
    if (shouldShowError) {

      const div = document.createElement("div");
      div.className = "error";

      div.innerHTML = `
        <div class="error-header">
          <div class="error-title" title="${url}">
            ${url}
          </div>

          <div class="error-meta">
            <span class="method">${method}</span>
            <span class="status-badge">
              ${status}
            </span>
          </div>
        </div>

        <details>
          <summary>Request Payload</summary>
          <pre>${JSON.stringify(request.request.postData || {}, null, 2)}</pre>
        </details>

        <details>
          <summary>Response / Error</summary>
          <pre>${graphQLError || body}</pre>
        </details>

        <button class="copyBtn">📋 Copy</button>
      `;

      // ===============================
      // Copy Button (DevTools-safe)
      // ===============================
      const copyBtn = div.querySelector(".copyBtn");

      copyBtn.addEventListener("click", () => {
        const copyText = `
❌ API FAILURE

URL: ${url}
Method: ${method}
Status: ${status}

Request Payload:
${JSON.stringify(request.request.postData || {}, null, 2)}

Error Response:
${graphQLError || body}
        `.trim();

        // DevTools-safe clipboard copy
        const textarea = document.createElement("textarea");
        textarea.value = copyText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        copyBtn.innerText = "✅ Copied";
        setTimeout(() => {
          copyBtn.innerText = "📋 Copy";
        }, 1500);
      });

      container.prepend(div);
    }
  });
});
