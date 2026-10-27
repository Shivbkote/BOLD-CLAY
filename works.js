
/* =========================================================
   BOLD CLAY STUDIOS — WORKS CAROUSEL
   Infinite loop • Center zoom • Filters • Touch support
========================================================= */

(() => {
  "use strict";

  const section = document.querySelector(".bc-works");
  if (!section) return;

  const slider = section.querySelector(".bc-works-slider");
  const track = section.querySelector(".bc-works-track");
  const filters = [...section.querySelectorAll(".bc-work-filter")];
  const prevButton = section.querySelector(".bc-works-prev");
  const nextButton = section.querySelector(".bc-works-next");

  const currentCounter = section.querySelector(".bc-works-current");
  const totalCounter = section.querySelector(".bc-works-total");
  const slideCurrent = section.querySelector(".bc-works-slide-current");
  const slideTotal = section.querySelector(".bc-works-slide-total");
  const progress = section.querySelector(".bc-works-progress");
  const progressFill = section.querySelector(".bc-works-progress-fill");

  if (!slider || !track) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const autoplayDelay = 5000;

  let originalCards = [...track.querySelectorAll(".bc-work-card")];
  let visibleCards = [...originalCards];

  let index = 1;
  let autoplayTimer = null;
  let isAnimating = false;
  let touchStartX = 0;
  let touchStartY = 0;
  let pointerDown = false;
  let destroyed = false;

  /* -------------------------------------------------------
     HELPERS
  ------------------------------------------------------- */

  const pad = (number) => String(number).padStart(2, "0");

  function removeClones() {
    track.querySelectorAll("[data-carousel-clone]").forEach((card) => {
      card.remove();
    });
  }

  function createClone(card) {
    const clone = card.cloneNode(true);

    clone.dataset.carouselClone = "true";
    clone.setAttribute("aria-hidden", "true");
    clone.setAttribute("inert", "");

    // Prevent cloned links and images from being separate
    // keyboard targets or duplicated content for screen readers.
    clone.querySelectorAll("a, button, input, select, textarea").forEach((el) => {
      el.setAttribute("tabindex", "-1");
    });

    return clone;
  }

  function getCards() {
    return [...track.querySelectorAll(".bc-work-card")];
  }

  function updateCounters() {
    const total = visibleCards.length;
    const current = total ? ((index - 1 + total) % total) + 1 : 0;

    if (currentCounter) currentCounter.textContent = pad(current);
    if (totalCounter) totalCounter.textContent = pad(total);

    if (slideCurrent) slideCurrent.textContent = pad(current);
    if (slideTotal) slideTotal.textContent = pad(total);

    if (progress) {
      progress.setAttribute("aria-valuemax", String(Math.max(total, 1)));
      progress.setAttribute("aria-valuenow", String(current || 1));
    }

    if (progressFill) {
      progressFill.style.width =
        `${total ? (current / total) * 100 : 0}%`;
    }
  }

  /* -------------------------------------------------------
     CLONE SETUP
  ------------------------------------------------------- */

  function buildSlider() {
    removeClones();

    visibleCards = originalCards.filter((card) => {
      return !card.classList.contains("is-hidden");
    });

    track.replaceChildren(...visibleCards);

    if (!visibleCards.length) {
      index = 0;
      isAnimating = false;
      updateCounters();
      return;
    }

    if (visibleCards.length === 1) {
      index = 0;
      isAnimating = false;
      updateCounters();
      updateCardStates();
      positionSlider(false);
      return;
    }

    track.prepend(createClone(visibleCards[visibleCards.length - 1]));
    track.append(createClone(visibleCards[0]));

    index = 1;
    isAnimating = false;

    updateCounters();
    updateCardStates();
    positionSlider(false);
  }

  /* -------------------------------------------------------
     ACTIVE CARD / CENTER ALIGNMENT
  ------------------------------------------------------- */

  function updateCardStates() {
    const cards = getCards();

    cards.forEach((card, cardIndex) => {
      card.classList.remove("is-active", "is-side");

      if (cardIndex === index) {
        card.classList.add("is-active");
      } else if (
        cardIndex === index - 1 ||
        cardIndex === index + 1
      ) {
        card.classList.add("is-side");
      }
    });
  }

  function positionSlider(animate = true) {
    const cards = getCards();

    if (!cards.length || index < 0 || index >= cards.length) return;

    const activeCard = cards[index];
    const sliderWidth = slider.clientWidth;

    const cardCenter =
      activeCard.offsetLeft + activeCard.offsetWidth / 2;

    const offset = cardCenter - sliderWidth / 2;

    if (!animate) {
      track.classList.add("is-instant");
    } else {
      track.classList.remove("is-instant");
    }

    track.style.transform = `translate3d(${-offset}px, 0, 0)`;

    if (!animate) {
      // Apply the instant position before enabling transitions.
      void track.offsetWidth;
      track.classList.remove("is-instant");
    }
  }

  /* -------------------------------------------------------
     SLIDE NAVIGATION
  ------------------------------------------------------- */

  function goToSlide(direction) {
    if (
      destroyed ||
      visibleCards.length < 2 ||
      isAnimating
    ) {
      return;
    }

    isAnimating = true;
    index += direction;

    updateCardStates();
    updateCounters();
    positionSlider(true);
  }

  function nextSlide() {
    goToSlide(1);
  }

  function previousSlide() {
    goToSlide(-1);
  }

  track.addEventListener("transitionend", (event) => {
    if (
      event.target !== track ||
      event.propertyName !== "transform"
    ) {
      return;
    }

    const total = visibleCards.length;

    if (total < 2) {
      isAnimating = false;
      return;
    }

    // First clone: jump to the matching final real card.
    if (index === 0) {
      index = total;
      positionSlider(false);
    }

    // Last clone: jump back to the first real card.
    if (index === total + 1) {
      index = 1;
      positionSlider(false);
    }

    updateCardStates();
    updateCounters();

    isAnimating = false;
  });

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      nextSlide();
      restartAutoplay();
    });
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      previousSlide();
      restartAutoplay();
    });
  }

  /* -------------------------------------------------------
     CATEGORY FILTERS
  ------------------------------------------------------- */

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedCategory = button.dataset.filter || "all";

      filters.forEach((filter) => {
        const active = filter === button;

        filter.classList.toggle("is-active", active);
        filter.setAttribute("aria-pressed", String(active));
      });

      originalCards.forEach((card) => {
        const matches =
          selectedCategory === "all" ||
          card.dataset.category === selectedCategory;

        card.classList.toggle("is-hidden", !matches);
      });

      stopAutoplay();
      buildSlider();
      startAutoplay();
    });
  });

  /* -------------------------------------------------------
     TOUCH / SWIPE
  ------------------------------------------------------- */

  slider.addEventListener("touchstart", (event) => {
    if (!event.touches.length) return;

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }, { passive: true });

  slider.addEventListener("touchend", (event) => {
    if (!event.changedTouches.length) return;

    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const deltaY = event.changedTouches[0].clientY - touchStartY;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      nextSlide();
    } else {
      previousSlide();
    }

    restartAutoplay();
  }, { passive: true });

  /* -------------------------------------------------------
     KEYBOARD SUPPORT
  ------------------------------------------------------- */

  slider.addEventListener("keydown", (event) => {
    if (event.target.closest("a, button")) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      nextSlide();
      restartAutoplay();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousSlide();
      restartAutoplay();
    }
  });

  /* -------------------------------------------------------
     AUTOPLAY
  ------------------------------------------------------- */

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();

    if (
      destroyed ||
      reducedMotion.matches ||
      visibleCards.length < 2 ||
      document.hidden
    ) {
      return;
    }

    autoplayTimer = setInterval(() => {
      nextSlide();
    }, autoplayDelay);
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  slider.addEventListener("mouseenter", stopAutoplay);
  slider.addEventListener("mouseleave", startAutoplay);

  slider.addEventListener("focusin", stopAutoplay);
  slider.addEventListener("focusout", (event) => {
    if (!slider.contains(event.relatedTarget)) {
      startAutoplay();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  reducedMotion.addEventListener?.("change", () => {
    if (reducedMotion.matches) {
      stopAutoplay();
      positionSlider(false);
    } else {
      startAutoplay();
    }
  });

  /* -------------------------------------------------------
     RESPONSIVE RESIZING
  ------------------------------------------------------- */

  let resizeFrame = null;

  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);

    resizeFrame = requestAnimationFrame(() => {
      if (visibleCards.length < 2) {
        positionSlider(false);
        return;
      }

      // A resize during motion should not leave the track
      // positioned between cards.
      if (isAnimating) {
        const total = visibleCards.length;

        if (index === 0) index = total;
        if (index === total + 1) index = 1;

        isAnimating = false;
      }

      positionSlider(false);
      updateCardStates();
    });
  });

  /* -------------------------------------------------------
     INITIALIZE
  ------------------------------------------------------- */

  buildSlider();
  startAutoplay();

  // Optional cleanup if this component is later mounted
  // dynamically by a framework.
  section.addEventListener("bc-works:destroy", () => {
    destroyed = true;
    stopAutoplay();
    cancelAnimationFrame(resizeFrame);
  }, { once: true });

})();
