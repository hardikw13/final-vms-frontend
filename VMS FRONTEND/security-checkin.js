// security-checkin.js
// All three visitor types are handled by dedicated pages already built
// elsewhere in the project — this screen is just the router between them.
(async function () {
  await VMS_SECURITY.load();

  document.getElementById("walkinCard").addEventListener("click", () => {
    VMS_SECURITY.goTo("walkin-photo.html");
  });

  document.getElementById("deliveryCard").addEventListener("click", () => {
    VMS_SECURITY.goTo("delivery-personnel.html");
  });

  document.getElementById("preApprovedCard").addEventListener("click", () => {
    VMS_SECURITY.goTo("pre-approved-scan.html");
  });
})();
