(function () {
  var host = (location.hostname || "").toLowerCase();
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
  var adminUrl = isLocal ? "http://localhost:5173/admin/" : "/admin/";
  document.querySelectorAll("a.shoveler-admin-link").forEach(function (link) {
    link.setAttribute("href", adminUrl);
  });
})();
