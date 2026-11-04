/* ABESsystems: small, dependency-free behaviour */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");

  /* Footer year */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* Mobile navigation */
  var toggle = document.querySelector(".nav__toggle");
  var list = document.getElementById("nav-list");
  function closeNav(returnFocus) {
    if (!list.classList.contains("is-open")) return;
    list.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
    if (returnFocus) toggle.focus();
  }
  if (toggle && list) {
    toggle.addEventListener("click", function () {
      var open = list.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
    });
    list.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav(true);
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".nav")) closeNav(false);
    });
  }

  /* Week calculator: uses only the visitor's own numbers */
  var calc = document.getElementById("calc");
  if (calc) {
    var ranges = calc.querySelectorAll('input[type="range"]');
    var days = document.getElementById("p-days");
    var hoursOut = document.getElementById("calc-hours");
    var update = function () {
      var perDay = 0;
      ranges.forEach(function (r) {
        var v = Number(r.value);
        perDay += v;
        var out = calc.querySelector('[data-for="' + r.id + '"]');
        if (out) out.textContent = v + " min";
        r.style.setProperty("--fill", (v / Number(r.max)) * 100 + "%");
      });
      var hours = (perDay * Number(days.value)) / 60;
      hoursOut.textContent = hours >= 10 ? Math.round(hours).toString() : (Math.round(hours * 10) / 10).toString();
      if (Math.round(hours * 10) / 10 === 1) hoursOut.parentNode.lastChild.textContent = " hour a week";
      else hoursOut.parentNode.lastChild.textContent = " hours a week";
    };
    ranges.forEach(function (r) { r.addEventListener("input", update); });
    days.addEventListener("change", update);
    update();
  }

  /* Contact form */
  var form = document.getElementById("contact-form");
  if (form) {
    var success = document.getElementById("form-success");
    var rules = [
      { id: "f-name", msg: "Please tell us your name." },
      { id: "f-email", msg: "Please enter your email so we can reply.", email: true },
      { id: "f-biz", msg: "Please add your business name." },
      { id: "f-time", msg: "Please tell us a little about what takes up your time." }
    ];
    var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); };
    var setError = function (input, err, text) {
      if (text) {
        input.setAttribute("aria-invalid", "true");
        err.textContent = text;
        err.hidden = false;
      } else {
        input.removeAttribute("aria-invalid");
        err.textContent = "";
        err.hidden = true;
      }
    };
    var validate = function (rule) {
      var input = document.getElementById(rule.id);
      var err = document.getElementById(rule.id + "-err");
      var v = input.value.trim();
      if (!v) { setError(input, err, rule.msg); return false; }
      if (rule.email && !emailOk(v)) { setError(input, err, "That email doesn't look right. Please check it (for example name@business.com)."); return false; }
      setError(input, err, "");
      return true;
    };
    rules.forEach(function (rule) {
      var input = document.getElementById(rule.id);
      input.addEventListener("blur", function () { if (input.value.trim()) validate(rule); });
      input.addEventListener("input", function () { if (input.getAttribute("aria-invalid")) validate(rule); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      rules.forEach(function (rule) {
        if (!validate(rule) && !firstBad) firstBad = document.getElementById(rule.id);
      });
      if (firstBad) { firstBad.focus(); return; }

      // Honeypot: bots fill the hidden field; quietly ignore them.
      if (form.website && form.website.value) return;

      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = "Sending…";

      /* [OWNER: connect form]
         No backend is connected yet, so nothing is sent anywhere. Replace the setTimeout below with a real
         request to your form service, for example:
           fetch("https://formspree.io/f/YOUR_ID", { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
             .then(function (res) { if (!res.ok) throw new Error(); showSuccess(); })
             .catch(function () { btn.disabled = false; btn.textContent = "Send my message"; alert("Sorry, that didn't send. Please email us instead."); });
      */
      setTimeout(showSuccess, 500);
    });

    var showSuccess = function () {
      var name = document.getElementById("f-name").value.trim().split(" ")[0];
      document.getElementById("success-name").textContent = name || "there";
      form.hidden = true;
      success.hidden = false;
      success.focus();
    };
  }

  /* Entrances: stagger the parts of each section as it enters */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduce) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var groups = new Map();
    items.forEach(function (el) {
      var parent = el.closest("section, footer") || document.body;
      var n = groups.get(parent) || 0;
      el.style.setProperty("--d", Math.min(n, 6) * 80 + "ms");
      groups.set(parent, n + 1);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content hidden.
    setTimeout(function () { items.forEach(function (el) { el.classList.add("is-in"); }); }, 6000);
  }

  /* Gentle parallax on the street photograph */
  var streetImg = document.querySelector(".final__media img");
  if (streetImg && !reduce) {
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var r = streetImg.parentNode.getBoundingClientRect();
        var vh = window.innerHeight;
        if (r.bottom > 0 && r.top < vh) {
          var p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1
          streetImg.style.setProperty("--py", (p * -24).toFixed(1) + "px");
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
