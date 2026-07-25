const STATUS_LABELS = {
  pending_otp: "Not Checked In Yet",
  auto_cleared: "Auto Cleared",
  flagged: "Flagged",
  resolved_approved: "Approved — Not Checked In Yet",
  resolved_rejected: "Rejected",
  checked_in: "Checked In",
  checked_out: "Checked Out"
};

const VISIT_TYPE_LABELS = {
  pre_approved: "Pre-Approved",
  walk_in: "Walk-in",
  delivery: "Delivery"
};

document.addEventListener("DOMContentLoaded", async () => {

    const loadingState = document.getElementById("loadingState");
    const errorState = document.getElementById("errorState");
    const detailsContent = document.getElementById("detailsContent");
    

    const params = new URLSearchParams(window.location.search);
    const visitId = params.get("visit_id");
   
    if (!visitId) {
        showError("Missing visit reference.");
        return;
    }

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(`https://edugate-9yl5.onrender.com/api/visits/${visitId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            showError(result.message || "Could not load this visit.");
            return;
        }

        renderDetails(result.data);

    } catch (err) {
        console.error("Error loading visit:", err);
        showError("Something went wrong.");
    }

    function showError(message) {
        loadingState.style.display = "none";
        errorState.style.display = "block";
        document.getElementById("errorText").textContent = message;
    }

    function renderDetails(visit) {

        const visitor = visit.visitor;
        const host = visit.assigned_host || visit.requested_host;

        const initials = visitor.full_name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

        document.getElementById("detailAvatar").textContent = initials;
        document.getElementById("detailName").textContent = visitor.full_name;
        document.getElementById("detailPurpose").textContent = VISIT_TYPE_LABELS[visit.visit_type] || "—";
        document.getElementById("detailPurposeGrid").textContent = visit.purpose || "—";
        document.getElementById("detailEmail").textContent = visitor.email || "—";
        document.getElementById("detailPhone").textContent = visitor.phone || "—";
        document.getElementById("detailOrg").textContent = visitor.organization || "—";

        document.getElementById("detailDate").textContent = new Date(visit.visit_date)
            .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        document.getElementById("detailCreatedOn").textContent = new Date(visit.created_at)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

        document.getElementById("detailStatus").textContent = STATUS_LABELS[visit.status] || visit.status;
        document.getElementById("detailHost").textContent = host?.user?.name || "—";

        loadingState.style.display = "none";
        detailsContent.style.display = "block";

    }

    document.getElementById("backBtn")?.addEventListener("click", () => {
        window.history.back();
    });

});