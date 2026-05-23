(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const body = document.body;

  function setCurrentYear() {
    document.querySelectorAll("[data-year]").forEach((item) => {
      item.textContent = new Date().getFullYear();
    });
  }

  function initHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;

    const syncHeader = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 20);
    };

    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });
  }

  function initNavigation() {
    const header = document.querySelector("[data-header]");
    const toggle = document.querySelector("[data-nav-toggle]");
    const nav = document.querySelector("[data-nav]");
    if (!header || !toggle || !nav) return;

    const closeNav = () => {
      toggle.setAttribute("aria-expanded", "false");
      header.classList.remove("nav-active");
      body.classList.remove("nav-open");
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      header.classList.toggle("nav-active", !isOpen);
      body.classList.toggle("nav-open", !isOpen);
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNav();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });
  }

  function initLenis() {
    if (prefersReducedMotion || typeof Lenis === "undefined") return null;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.88,
      touchMultiplier: 1.1
    });

    window.siteLenis = lenis;

    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    return lenis;
  }

  function initAnchorScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = document.querySelector(link.getAttribute("href"));
        if (!target) return;

        event.preventDefault();
        if (window.siteLenis && !prefersReducedMotion) {
          window.siteLenis.scrollTo(target, { offset: -70 });
        } else {
          target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        }
      });
    });
  }

  function initActiveNavigation() {
    const navLinks = Array.from(document.querySelectorAll(".primary-nav a"));
    if (!navLinks.length) return;

    const setActive = (activeLink, currentValue) => {
      navLinks.forEach((link) => {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });

      if (activeLink) {
        activeLink.classList.add("is-active");
        activeLink.setAttribute("aria-current", currentValue);
      }
    };

    if (body.dataset.page !== "home") {
      const currentPage = navLinks.find((link) => link.getAttribute("href") === "contact.html");
      setActive(currentPage, "page");
      return;
    }

    const homeLink = navLinks.find((link) => link.getAttribute("href") === "index.html");
    const sectionLinkMap = new Map([
      ["top", homeLink],
      ["about", navLinks.find((link) => link.getAttribute("href") === "#about")],
      ["services", navLinks.find((link) => link.getAttribute("href") === "#services")],
      ["timeline", navLinks.find((link) => link.getAttribute("href") === "#timeline")]
    ]);

    const sections = Array.from(sectionLinkMap.keys())
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length || !("IntersectionObserver" in window)) {
      setActive(homeLink, "page");
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      const id = visibleEntry.target.id;
      const link = sectionLinkMap.get(id);
      setActive(link, id === "top" ? "page" : "location");
    }, {
      rootMargin: "-42% 0px -42% 0px",
      threshold: [0.05, 0.2, 0.5, 0.8]
    });

    sections.forEach((section) => observer.observe(section));
    setActive(homeLink, "page");
  }

  function initHeroCanvas() {
    const canvas = document.getElementById("hero-canvas");
    if (!canvas) return;

    const context = canvas.getContext("2d");
    const sparks = [];
    let width = 0;
    let height = 0;
    let animationFrame;

    const resetSpark = (spark, randomizeX) => {
      spark.x = randomizeX ? Math.random() * width : -60;
      spark.y = Math.random() * height;
      spark.length = 24 + Math.random() * 76;
      spark.speed = 0.45 + Math.random() * 1.1;
      spark.alpha = 0.12 + Math.random() * 0.52;
      spark.slope = -0.14 + Math.random() * 0.08;
      spark.hue = Math.random() > 0.6 ? "48, 199, 213" : "242, 193, 107";
    };

    const resize = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const count = prefersReducedMotion ? 26 : Math.min(110, Math.max(42, Math.floor(width / 16)));
      sparks.length = 0;
      for (let index = 0; index < count; index += 1) {
        const spark = {};
        resetSpark(spark, true);
        sparks.push(spark);
      }
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";

      sparks.forEach((spark) => {
        context.beginPath();
        const gradient = context.createLinearGradient(spark.x, spark.y, spark.x + spark.length, spark.y + spark.length * spark.slope);
        gradient.addColorStop(0, `rgba(${spark.hue}, 0)`);
        gradient.addColorStop(0.48, `rgba(${spark.hue}, ${spark.alpha})`);
        gradient.addColorStop(1, `rgba(${spark.hue}, 0)`);
        context.strokeStyle = gradient;
        context.lineWidth = 1;
        context.moveTo(spark.x, spark.y);
        context.lineTo(spark.x + spark.length, spark.y + spark.length * spark.slope);
        context.stroke();

        if (!prefersReducedMotion) {
          spark.x += spark.speed;
          spark.y += spark.slope * spark.speed;
          if (spark.x > width + spark.length || spark.y < -30) resetSpark(spark, false);
        }
      });

      if (!prefersReducedMotion) animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    if (prefersReducedMotion && animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  }

  function initGsapAnimations() {
    if (prefersReducedMotion || !window.gsap || !window.ScrollTrigger) {
      body.classList.add("is-loaded");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    gsap.set(".title-line", { y: 80, autoAlpha: 0 });
    gsap.set(".reveal-hero", { y: 28, autoAlpha: 0 });
    gsap.set("[data-reveal]", { y: 46, autoAlpha: 0 });

    body.classList.add("is-loaded");

    const heroTimeline = gsap.timeline({ defaults: { ease: "power4.out" } });
    heroTimeline
      .to(".title-line", { y: 0, autoAlpha: 1, duration: 1.08, stagger: 0.11 })
      .to(".reveal-hero", { y: 0, autoAlpha: 1, duration: 0.78, stagger: 0.12 }, "-=0.72");

    gsap.utils.toArray("[data-reveal]").forEach((element) => {
      gsap.to(element, {
        y: 0,
        autoAlpha: 1,
        duration: 0.92,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 84%",
          once: true
        }
      });
    });

    gsap.utils.toArray(".parallax-media").forEach((media) => {
      const trigger = media.closest("section") || media;
      gsap.to(media, {
        yPercent: 9,
        ease: "none",
        scrollTrigger: {
          trigger,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });

    const progress = document.querySelector(".timeline-progress");
    const timelineWrap = document.querySelector(".timeline-wrap");
    if (progress && timelineWrap) {
      gsap.to(progress, {
        height: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: timelineWrap,
          start: "top center",
          end: "bottom center",
          scrub: true
        }
      });
    }

    gsap.utils.toArray(".timeline-item").forEach((item) => {
      const card = item.querySelector(".phase-card");
      const node = item.querySelector(".phase-node");
      const direction = item.classList.contains("phase-left") ? -80 : 80;

      if (card) {
        gsap.from(card, {
          x: direction,
          y: 36,
          rotateX: 6,
          autoAlpha: 0,
          duration: 1.05,
          ease: "power4.out",
          scrollTrigger: {
            trigger: item,
            start: "top 74%",
            once: true
          }
        });
      }

      if (node) {
        gsap.from(node, {
          scale: 0,
          rotate: 45,
          duration: 0.55,
          ease: "back.out(1.9)",
          scrollTrigger: {
            trigger: item,
            start: "top 72%",
            once: true
          }
        });
      }
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  function initTiltCards() {
    if (prefersReducedMotion) return;

    document.querySelectorAll(".tilt-card").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
      });

      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const fields = Array.from(form.querySelectorAll("input:not([type='hidden']):not(.honeypot), textarea"));
    const updateFieldState = (field) => {
      const label = field.closest("label");
      if (!label) return;
      label.classList.toggle("field-invalid", !field.validity.valid);
    };

    fields.forEach((field) => {
      field.addEventListener("input", () => updateFieldState(field));
      field.addEventListener("blur", () => updateFieldState(field));
    });

    form.addEventListener("submit", (event) => {
      form.classList.add("was-validated");
      fields.forEach(updateFieldState);

      if (!form.checkValidity()) {
        event.preventDefault();
        const firstInvalid = fields.find((field) => !field.validity.valid);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const button = form.querySelector(".form-submit");
      if (button) {
        button.setAttribute("aria-busy", "true");
        const label = button.querySelector("span");
        if (label) label.textContent = "Sending...";
      }
    });
  }

  setCurrentYear();
  initHeader();
  initNavigation();
  initLenis();
  initAnchorScroll();
  initActiveNavigation();
  initHeroCanvas();
  initGsapAnimations();
  initTiltCards();
  initContactForm();
})();
