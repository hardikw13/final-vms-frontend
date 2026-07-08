const API_URL = "http://localhost:5000/api";

const token = new URLSearchParams(window.location.search).get("token");

const form = document.getElementById("inviteForm");
const message = document.getElementById("message");

async function loadInvitation() {

    if (!token) {

        message.className = "error";
        message.textContent = "Invalid invitation link.";

        form.style.display = "none";

        return;
    }

    try {

        const res = await fetch(`${API_URL}/auth/invite/${token}`);

        const result = await res.json();

        if (!res.ok) {

            throw new Error(result.message);

        }

        document.getElementById("name").value = result.data.name;
        document.getElementById("email").value = result.data.email;
        document.getElementById("role").value = result.data.role;

        document.getElementById("userInfo").textContent =
            "Create a password to activate your account.";

    }

    catch (err) {

        form.style.display = "none";

        message.className = "error";
        message.textContent = err.message;

    }

}

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const password =
        document.getElementById("password").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (password.length < 8) {

        message.className = "error";
        message.textContent =
            "Password must contain at least 8 characters.";

        return;

    }

    if (password !== confirmPassword) {

        message.className = "error";
        message.textContent =
            "Passwords do not match.";

        return;

    }

    try {

        const res = await fetch(
            `${API_URL}/auth/accept-invite`,
            {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    token,

                    password

                })

            }
        );

        const result = await res.json();

        if (!res.ok) {

            throw new Error(result.message);

        }

        message.className = "success";
        message.textContent =
            "Account activated successfully! Redirecting...";

        setTimeout(() => {

            window.location.href = "member-login.html";

        }, 2000);

    }

    catch (err) {

        message.className = "error";
        message.textContent = err.message;

    }

});

loadInvitation();