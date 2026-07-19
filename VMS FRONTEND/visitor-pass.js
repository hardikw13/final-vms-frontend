document.addEventListener("DOMContentLoaded", async () => {

    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const qrOnlyContent = document.getElementById("qrOnlyContent");
    const passContent = document.getElementById("passContent");

    const params = new URLSearchParams(window.location.search);
    const visitId = params.get("visit_id");

    if (!visitId) {
        showError("Missing pass reference. Please use the link from your email.");
        return;
    }

    try {

        const response = await fetch(`http://localhost:5000/api/visits/pass/${visitId}`);
        const result = await response.json();

        if (!response.ok) {
            showError(result.message || "Could not load this pass.");
            return;
        }

        renderPass(result.data);

    } catch (err) {
        console.error("Error loading pass:", err);
        showError("Something went wrong while loading your pass.");
    }

    function hideAllStates() {
        loadingState.style.display = "none";
        errorState.style.display = "none";
        qrOnlyContent.style.display = "none";
        passContent.style.display = "none";
    }

    function showError(message) {
        hideAllStates();
        errorState.style.display = "block";
        document.getElementById("errorText").textContent = message;
    }

    function renderPass(data) {

        const { visitor, visit, host, qrDataUrl } = data;

        // A visit only has a real pass once it has actually been checked in
        // (pass_id is set by checkInVisit / selfCheckIn, never at invite time).
        const isCheckedIn = visit.status === "checked_in" && !!visit.pass_id;

        const visitTypeLabel = visit.visit_type === "pre_approved"
            ? "Pre-Approved Visitor"
            : "Guest Visitor";

        const formattedDate = new Date(visit.visit_date)
            .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        hideAllStates();

        if (isCheckedIn) {

            // ---- FULL PASS VIEW ----
            document.getElementById("passName").textContent = visitor.full_name;
            document.getElementById("passType").textContent = visitTypeLabel;
            document.getElementById("passPurpose").textContent = `Purpose: ${visit.purpose || "—"}`;
            document.getElementById("passHost").textContent = host?.user?.name || "—";
            document.getElementById("passDate").textContent = formattedDate;
            document.getElementById("passId").textContent = visit.pass_id;
            document.getElementById("passQrImg").src = qrDataUrl;
            document.getElementById("passBadge").textContent = "Checked In";
            document.getElementById("passQrCaption").textContent = "You have been checked in";
            document.getElementById("validityNote").textContent = "This pass is valid only for the scheduled visit date";
            document.getElementById("notifiedText").textContent =
                `${host?.department?.department_name || "Department"} host has been notified`;

            passContent.style.display = "block";

        } else {

            // ---- QR-ONLY VIEW (just the QR, nothing else) ----
            document.getElementById("qrOnlyImg").src = qrDataUrl;

            qrOnlyContent.style.display = "block";

        }

    }

    // ---------- Save to Gallery (full pass view) ----------
    document.getElementById("saveBtn")?.addEventListener("click", async () => {
        await savePassAsImage("passCardToSave", "visitor-pass.png");
    });

    // ---------- Save to Gallery (QR-only view) ----------
    document.getElementById("qrOnlySaveBtn")?.addEventListener("click", async () => {
        await savePassAsImage("qrOnlyCardToSave", "visitor-qr.png");
    });

    async function savePassAsImage(elementId, filename) {
        const cardEl = document.getElementById(elementId);
        try {
            const canvas = await html2canvas(cardEl, { backgroundColor: null, scale: 2 });
            const link = document.createElement("a");
            link.download = filename;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("Error saving pass:", err);
            alert("Could not save the pass. Please try taking a screenshot instead.");
        }
    }

    // ---------- Navigation ----------
    document.getElementById("backBtn")?.addEventListener("click", () => {
        window.history.back();
    });

    document.getElementById("doneBtn")?.addEventListener("click", () => {
        window.location.href = "host-dashboard.html";
    });

    document.getElementById("qrOnlyDoneBtn")?.addEventListener("click", () => {
        window.location.href = "host-dashboard.html";
    });

});