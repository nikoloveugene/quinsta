(function () {
  var script = document.currentScript;
  var siteKey = (script && script.getAttribute("data-site-key")) || "";
  var origin = script && script.src ? new URL(script.src).origin : window.location.origin;
  var demoUrl = origin + "/demo?siteKey=" + encodeURIComponent(siteKey);

  var button = document.createElement("button");
  button.type = "button";
  button.textContent = "Get estimate";
  button.setAttribute(
    "style",
    [
      "position:fixed",
      "right:20px",
      "bottom:20px",
      "z-index:2147483000",
      "background:#3ECF6A",
      "color:#07140b",
      "border:0",
      "border-radius:999px",
      "padding:14px 18px",
      "font:600 14px/1.2 system-ui,sans-serif",
      "cursor:pointer",
      "box-shadow:0 10px 30px rgba(28,36,29,0.25)",
    ].join(";"),
  );
  button.addEventListener("click", function () {
    window.open(demoUrl, "quinsta-estimate", "width=480,height=760");
  });
  document.body.appendChild(button);
})();
