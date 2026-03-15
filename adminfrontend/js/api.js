const BASE_URL = "http://localhost:8080/api";

// Get token from storage
function getToken() {
    return localStorage.getItem("token");
}

// Generic fetch wrapper
async function apiCall(endpoint, method = "GET", body = null) {
    const headers = {
        "Content-Type": "application/json"
    };

    const token = getToken();
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const rawText = await response.clone().text();
    console.log('Raw response:', rawText);
    // Try to parse as JSON first, fall back to plain text
    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        // Plain text response (e.g. Spring error strings)
        const text = await response.text();
        // Try parsing anyway in case content-type header is missing
        try {
            data = JSON.parse(text);
        } catch {
            data = { message: text };
        }
    }

    if (!response.ok) {
        // Extract message from whatever shape the error came in
        const message = (data && (data.message || data.error)) || "Something went wrong";
        throw new Error(message);
    }

    return data;
}