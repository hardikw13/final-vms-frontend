// security-register.js
// Routes to your existing walk-in / delivery pages, in "register" context.
(async function () {
  await VMS_SECURITY.load();

  document.getElementById("walkinCard").addEventListener("click", () => {
    VMS_SECURITY.goTo("walkin-photo.html?mode=register");
  });

  document.getElementById("deliveryCard").addEventListener("click", () => {
    VMS_SECURITY.goTo("delivery-personnel.html?mode=register");
  });
})();
