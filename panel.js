let ignoreUrls = [];
let errors = [];

// Load settings from storage
chrome.storage.local.get(['ignoreUrls'], (result) => {
  ignoreUrls = result.ignoreUrls || [];
});

const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("statusFilter");
const methodFilter = document.getElementById("methodFilter");

function applyFilters() {
  const searchValue = searchInput.value.toLowerCase();
  const statusValue = statusFilter.value;
  const methodValue = methodFilter.value;

  const items = document.querySelectorAll(".error, .request");

  items.forEach((item) => {
    const text = item.innerText.toLowerCase();
    const status = item.dataset.status;
    const method = item.dataset.method;

    const matchesSearch = text.includes(searchValue);
    const matchesStatus = !statusValue || status === statusValue;
    const matchesMethod = !methodValue || method === methodValue;

    item.style.display = (matchesSearch && matchesStatus && matchesMethod) ? "" : "none";
  });
}

if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

if (statusFilter) {
  statusFilter.addEventListener("change", applyFilters);
}

if (methodFilter) {
  methodFilter.addEventListener("change", applyFilters);
}

const container = document.getElementById("errors");
const clearBtn =
  document.getElementById("clearErrors") ||
  document.getElementById("clear");

if (clearBtn && container) {
  clearBtn.addEventListener("click", () => {
    container.innerHTML = "";
  });
}

chrome.devtools.network.onRequestFinished.addListener((request) => {
  const status = request?.response?.status;
  const url = request?.request?.url || "(unknown)";
  const method = request?.request?.method || "";

  if (method === "OPTIONS") return;

  // -------- HEADERS EXTRACTION --------
  const requestHeaders = request?.request?.headers ? request.request.headers.map(h => `${h.name}: ${h.value}`).join('\n') : 'No request headers';
  const responseHeaders = request?.response?.headers ? request.response.headers.map(h => `${h.name}: ${h.value}`).join('\n') : 'No response headers';

  // -------- PAYLOAD EXTRACTION --------
  let payload = null;

  const postData = request?.request?.postData;

  if (postData?.text) {
    try {
      payload = JSON.stringify(JSON.parse(postData.text), null, 2);
    } catch (e) {
      payload = postData.text; // fallback for non-JSON
    }
  } else if (postData?.params?.length) {
    payload = JSON.stringify(postData.params, null, 2);
  } else {
    payload = "No request payload";
  }

  request.getContent((body) => {
    if (!body) {
      body = "No response body available";
    }

    const hasNoBody =
      body.includes("No response body available") ||
      body.includes("failed before response");

    // -------- GRAPHQL ERROR DETECTION --------
    let graphQLError = null;
    try {
      const json = typeof body === "string" ? JSON.parse(body) : body;
      let errors = [];
      
      if (Array.isArray(json)) {
        json.forEach(item => {
          if (item?.errors?.length) {
            errors = errors.concat(item.errors);
          }
        });
      } else if (json?.errors?.length) {
        errors = json.errors;
      }
      
      if (errors.length) {
        graphQLError = JSON.stringify(errors, null, 2);
      }
    } catch (e) {
      if (String(body).includes('"errors"')) {
        graphQLError = body;
      }
    }

    // -------- ERROR IN RESPONSE BODY DETECTION --------
    let hasErrorInBody = false;
    if (body && typeof body === "string") {
      const lowerBody = body.toLowerCase();
      hasErrorInBody = lowerBody.includes('error') || lowerBody.includes('fail') || lowerBody.includes('exception') || lowerBody.includes('invalid');
    }

    // -------- FINAL FILTER --------
    const isHttpError =
      typeof status === "number" && status >= 400;

    const isError =
      graphQLError ||
      hasNoBody ||
      isHttpError ||
      hasErrorInBody;

    // Show all requests, but classify as error or normal
    if (!container) return;

    // -------- ERROR DETAILS EXTRACTION --------
    let errorDetails = graphQLError;
    let errorSummary = "Response Body";
    
    if (!errorDetails) {
      if (isHttpError) {
        // Try to extract error message for summary
        let extractedMessage = "";
        try {
          const json = typeof body === "string" ? JSON.parse(body) : body;
          if (json?.error) {
            extractedMessage = json.error;
          } else if (json?.message) {
            extractedMessage = json.message;
          } else if (json?.exception) {
            extractedMessage = json.exception;
          }
        } catch (e) {
          // keep extractedMessage empty
        }
        errorSummary = extractedMessage ? `HTTP ${status}: ${extractedMessage}` : `HTTP ${status} Error`;
        errorDetails = body;
      } else if (hasNoBody) {
        errorSummary = "No Response Body";
        errorDetails = body;
      } else {
        errorDetails = body;
      }
    } else {
      errorSummary = "GraphQL Error";
    }

    const div = document.createElement("div");
    div.className = isError ? "error" : "request";

    const time = new Date().toLocaleTimeString();

    div.innerHTML = `
      <div class="timestamp">🕒 ${time}</div>
      <div><b>URL:</b> ${url}</div>
      <div><b>Method:</b> ${method}</div>
      <div><b>Status:</b> ${status}</div>
      <button class="copy-jira-btn" onclick="copyToJira('${url}', '${method}', '${status}', '${errorSummary.replace(/'/g, "\\'")}', '${errorDetails.replace(/'/g, "\\'").replace(/\n/g, '\\n')}')">Copy to JIRA</button>

      <details>
        <summary><b>Request Headers</b></summary>
        <pre>${requestHeaders}</pre>
      </details>

      <details>
        <summary><b>Request Payload</b></summary>
        <pre>${payload}</pre>
      </details>

      <details>
        <summary><b>Response body</b></summary>
        <pre>${body}</pre>
      </details>

      <details open>
        <summary><b>${errorSummary}</b></summary>
        <pre>${errorDetails}</pre>
      </details>
    `;

    div.dataset.status = status;
    div.dataset.method = method;

    container.prepend(div);
  });
});

