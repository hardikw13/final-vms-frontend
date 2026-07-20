document.addEventListener("DOMContentLoaded", async () => {

  const backBtn = document.getElementById("backBtn");
  const doneBtn = document.getElementById("doneBtn");
  const saveGalleryBtn = document.getElementById("saveGalleryBtn");
  const passCard = document.getElementById("passCardV2");

  backBtn.addEventListener("click", () => {
    window.location.href = "pre-approved-confirm.html";
  });

  doneBtn.addEventListener("click", () => {
    sessionStorage.removeItem("checkedInVisit");
    window.location.href = "welcome.html";
  });

  const visitJSON = sessionStorage.getItem("checkedInVisit");

  if (!visitJSON) {
    window.location.href = "pre-approved-scan.html";
    return;
  }

  const visit = JSON.parse(visitJSON);
  const host = visit.assigned_host || visit.requested_host;

  // ---------- populate the pass card ----------

  document.getElementById("passVisitorName").textContent = visit.visitor?.full_name || "—";
  document.getElementById("passPurpose").textContent = visit.purpose || "—";
  document.getElementById("passHost").textContent = host?.user?.name || "—";

  document.getElementById("passDate").textContent = new Date(visit.visit_date)
    .toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  document.getElementById("passCheckin").textContent =
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  document.getElementById("passId").textContent = visit.pass_id || "—";

  // ---------- QR fetch removed — pass no longer displays a QR code ----------

  // ---------- Save to Gallery: capture the pass card as a PNG ----------

  saveGalleryBtn.addEventListener("click", async () => {

    saveGalleryBtn.disabled = true;
    saveGalleryBtn.textContent = "Saving...";

    try {

      const canvas = await html2canvas(passCard, {
        backgroundColor: null,
        scale: 2
      });

      const link = document.createElement("a");
      link.download = `visitor-pass-${visit.pass_id || visit.visit_id}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

    } catch (err) {

      console.error("Error saving pass to gallery:", err);
      alert("Could not save the pass image. Please try again.");

    } finally {

      saveGalleryBtn.disabled = false;
      saveGalleryBtn.textContent = "⬇️ Save to Gallery";

    }

  });

  sessionStorage.removeItem("checkedInVisit");

});