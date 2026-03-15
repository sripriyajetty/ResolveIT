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

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Something went wrong");
    }

    return response.json();
}