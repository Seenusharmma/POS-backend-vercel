import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import videoSource from "./Assets/videoplayback.mp4";

gsap.registerPlugin(CustomEase, SplitText, ScrambleTextPlugin);

const BACKGROUND_TEXT_ITEMS = [
  { text: "TASTE", top: "5%", left: "8%" },
  { text: "FLAVOR", top: "5%", left: "15%" },
  { text: "FRESH", top: "5%", left: "28%" },
  { text: "DELICIOUS", top: "5%", left: "42%" },
  { text: "SAVORY", top: "5%", left: "55%" },
  { text: "&", top: "5%", left: "75%" },
  { text: "SWEET", top: "5%", left: "85%" },
  { text: "SPICY", top: "10%", left: "12%" },
  { text: "CRISPY", top: "10%", left: "45%" },
  { text: "JUICY", top: "10%", right: "20%" },
  { text: "THE", top: "15%", left: "8%" },
  { text: "BEST", top: "15%", left: "30%" },
  { text: "FOOD", top: "15%", left: "55%" },
  { text: "IS", top: "15%", right: "20%" },
  { text: "HERE", top: "15%", right: "5%" },
  { text: "F", top: "25%", left: "5%" },
  { text: "O", top: "25%", left: "10%" },
  { text: "O", top: "25%", left: "15%" },
  { text: "D", top: "25%", left: "20%" },
  { text: "F", top: "25%", left: "25%" },
  { text: "A", top: "25%", left: "30%" },
  { text: "N", top: "25%", left: "35%" },
  { text: "T", top: "25%", left: "40%" },
  { text: "A", top: "25%", left: "45%" },
  { text: "S", top: "25%", left: "50%" },
  { text: "Y", top: "25%", left: "55%" },
  { text: "IS THE KEY", top: "25%", right: "5%" },
  { text: "ORDER NOW", top: "35%", left: "25%" },
  { text: "ENJOY FOOD", top: "35%", left: "65%" },
  { text: "TASTE IT", top: "50%", left: "5%" },
  { text: "LOVE FOOD", top: "50%", right: "5%" },
  { text: "YUMMY", top: "75%", left: "20%" },
  { text: "TASTY", top: "75%", right: "20%" },
  { text: "HOT", top: "80%", left: "10%" },
  { text: "COLD", top: "80%", left: "35%" },
  { text: "WARM", top: "80%", left: "65%" },
  { text: "FRESH", top: "80%", right: "10%" },
  { text: "COOK", top: "85%", left: "25%" },
  { text: "SERVE", top: "85%", right: "25%" },
];

const KINETIC_LINES = [
  "taste taste taste",
  "flavor flavor flavor",
  "fresh fresh fresh",
  "delicious delicious delicious",
  "savory savory savory",
  "spicy spicy spicy",
  "sweet sweet sweet",
  "crispy crispy crispy",
  "juicy juicy juicy",
  "yummy yummy yummy",
  "tasty tasty tasty",
  "food food food",
];

export default function MainVideoSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    CustomEase.create("customEase", "0.86, 0, 0.07, 1");
    CustomEase.create("mouseEase", "0.25, 0.1, 0.25, 1");

    const state = {
      activeRowId: null,
      kineticAnimationActive: false,
      activeKineticAnimation: null,
      textRevealAnimation: null,
      transitionInProgress: false,
    };

    // For overlays *inside video section* only:
    const container = containerRef.current;

    // Overlays selectors scoped inside container
    function qsa(sel) {
      return container.querySelectorAll(sel);
    }
    function qs(sel) {
      return container.querySelector(sel);
    }


    const backgroundTextItems = qsa(".text-item");
    backgroundTextItems.forEach((item) => {
      item.dataset.originalText = item.textContent;
      item.dataset.text = item.textContent;
      gsap.set(item, { opacity: 1 });
    });

    const typeLines = qsa(".type-line");
    typeLines.forEach((line, index) => {
      if (index % 2 === 0) line.classList.add("odd");
      else line.classList.add("even");
    });
    const oddLines = qsa(".type-line.odd");
    const evenLines = qsa(".type-line.even");

    const alternativeTexts = {
      Food: {
        TASTE: "SIP",
        FLAVOR: "AROMA",
        FRESH: "CRISP",
        DELICIOUS: "APPETIZING",
        SAVORY: "UMAMI",
        "&": "+",
        SWEET: "SUGARY",
        SPICY: "HOT",
        CRISPY: "CRUNCHY",
        JUICY: "SUCCULENT",
        THE: "OUR",
        BEST: "FINEST",
        FOOD: "MEAL",
        IS: "TASTES",
        HERE: "READY",
        F: "F",
        O: "O",
        D: "D",
        A: "A",
        N: "N",
        T: "T",
        S: "S",
        Y: "Y",
        "IS THE KEY": "IS DELICIOUS",
        "ORDER NOW": "GET IT NOW",
        "ENJOY FOOD": "SAVOR IT",
        "TASTE IT": "TRY IT",
        "LOVE FOOD": "CRAVE FOOD",
        YUMMY: "SCUMPTIOUS",
        TASTY: "FLAVORFUL",
        HOT: "SPICY",
        COLD: "CHILLED",
        WARM: "STEAMING",
        FRESH: "NEW",
        COOK: "PREPARE",
        SERVE: "PLATE",
      },
      Fantasy: {
        TASTE: "SIP",
        FLAVOR: "AROMA",
        FRESH: "CRISP",
        DELICIOUS: "APPETIZING",
        SAVORY: "UMAMI",
        "&": "+",
        SWEET: "SUGARY",
        SPICY: "HOT",
        CRISPY: "CRUNCHY",
        JUICY: "SUCCULENT",
        THE: "OUR",
        BEST: "FINEST",
        FOOD: "MEAL",
        IS: "TASTES",
        HERE: "READY",
        F: "F",
        O: "O",
        D: "D",
        A: "A",
        N: "N",
        T: "T",
        S: "S",
        Y: "Y",
        "IS THE KEY": "IS DELICIOUS",
        "ORDER NOW": "GET IT NOW",
        "ENJOY FOOD": "SAVOR IT",
        "TASTE IT": "TRY IT",
        "LOVE FOOD": "CRAVE FOOD",
        YUMMY: "SCUMPTIOUS",
        TASTY: "FLAVORFUL",
        HOT: "SPICY",
        COLD: "CHILLED",
        WARM: "STEAMING",
        FRESH: "NEW",
        COOK: "PREPARE",
        SERVE: "PLATE",
      },
    };

    const textRows = qsa(".text-row");
    const splitTexts = {};
    textRows.forEach((row) => {
      const textElement = row.querySelector(".text-content");
      const rowId = row.dataset.rowId;
      splitTexts[rowId] = new SplitText(textElement, {
        type: "chars",
        charsClass: "char",
        mask: true,
        reduceWhiteSpace: false,
        propIndex: true,
      });
      textElement.style.visibility = "visible";
    });

    function updateCharacterWidths() {
      const isMobile = window.innerWidth < 1024;
      textRows.forEach((row) => {
        const rowId = row.dataset.rowId;
        const textElement = row.querySelector(".text-content");
        const computedStyle = window.getComputedStyle(textElement);
        const currentFontSize = computedStyle.fontSize;
        const chars = splitTexts[rowId].chars;

        chars.forEach((char, i) => {
          const charText =
            char.textContent ||
            char.querySelector(".char-inner")?.textContent ||
            "";
          if (!charText && i === 0) return;
          let charWidth;

          if (isMobile) {
            const fontSizeValue = parseFloat(currentFontSize);
            const standardCharWidth = fontSizeValue * 0.6;
            charWidth = standardCharWidth;
            if (!char.querySelector(".char-inner") && charText) {
              char.textContent = "";
              const innerSpan = document.createElement("span");
              innerSpan.className = "char-inner";
              innerSpan.textContent = charText;
              char.appendChild(innerSpan);
              innerSpan.style.transform = "translate3d(0, 0, 0)";
            }
            char.style.width = `${charWidth}px`;
            char.style.maxWidth = `${charWidth}px`;
            char.dataset.charWidth = charWidth;
            char.dataset.hoverWidth = charWidth;
          } else {
            const tempSpan = document.createElement("span");
            tempSpan.style.position = "absolute";
            tempSpan.style.visibility = "hidden";
            tempSpan.style.fontSize = currentFontSize;
            tempSpan.style.fontFamily = '"Longsile", sans-serif';
            tempSpan.textContent = charText;
            document.body.appendChild(tempSpan);
            const actualWidth = tempSpan.offsetWidth;
            document.body.removeChild(tempSpan);
            const fontSizeValue = parseFloat(currentFontSize);
            const fontSizeRatio = fontSizeValue / 160;
            const padding = 10 * fontSizeRatio;
            charWidth = Math.max(actualWidth + padding, 30 * fontSizeRatio);
            if (!char.querySelector(".char-inner") && charText) {
              char.textContent = "";
              const innerSpan = document.createElement("span");
              innerSpan.className = "char-inner";
              innerSpan.textContent = charText;
              char.appendChild(innerSpan);
              innerSpan.style.transform = "translate3d(0, 0, 0)";
            }
            char.style.width = `${charWidth}px`;
            char.style.maxWidth = `${charWidth}px`;
            char.dataset.charWidth = charWidth;
            const hoverWidth = Math.max(charWidth * 1.8, 85 * fontSizeRatio);
            char.dataset.hoverWidth = hoverWidth;
          }
          char.style.setProperty("--char-index", i);
        });
      });
    }

    updateCharacterWidths();
    window.addEventListener("resize", () => {
      clearTimeout(window.resizeTimer);
      window.resizeTimer = setTimeout(() => {
        updateCharacterWidths();
      }, 250);
    });

    // Animate initial row reveals
    textRows.forEach((row, rowIndex) => {
      const rowId = row.dataset.rowId;
      const chars = splitTexts[rowId].chars;
      gsap.set(chars, { opacity: 0, filter: "blur(15px)" });
      gsap.to(chars, {
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.8,
        stagger: 0.09,
        ease: "customEase",
        delay: 0.15 * rowIndex,
      });
    });

    function forceResetKineticAnimation() {
      if (state.activeKineticAnimation) {
        state.activeKineticAnimation.kill();
        state.activeKineticAnimation = null;
      }
      const kineticType = qs("#kinetic-type");
      gsap.killTweensOf([kineticType, typeLines, oddLines, evenLines]);
      gsap.set(kineticType, {
        display: "grid",
        scale: 1,
        rotation: 0,
        opacity: 1,
        visibility: "visible",
      });
      gsap.set(typeLines, { opacity: 0.015, x: "0%" });
      state.kineticAnimationActive = false;
    }

    function startKineticAnimation(text) {
      forceResetKineticAnimation();
      const kineticType = qs("#kinetic-type");
      kineticType.style.display = "grid";
      kineticType.style.opacity = "1";
      kineticType.style.visibility = "visible";
      const repeatedText = `${text} ${text} ${text}`;
      typeLines.forEach((line) => {
        line.textContent = repeatedText;
      });
      setTimeout(() => {
        const timeline = gsap.timeline({
          onComplete: () => {
            state.kineticAnimationActive = false;
          },
        });
        timeline.to(kineticType, {
          duration: 1.4,
          ease: "customEase",
          scale: 2.7,
          rotation: -90,
        });
        timeline.to(
          oddLines,
          {
            keyframes: [
              { x: "20%", duration: 1, ease: "customEase" },
              { x: "-200%", duration: 1.5, ease: "customEase" },
            ],
            stagger: 0.08,
          },
          0
        );
        timeline.to(
          evenLines,
          {
            keyframes: [
              { x: "-20%", duration: 1, ease: "customEase" },
              { x: "200%", duration: 1.5, ease: "customEase" },
            ],
            stagger: 0.08,
          },
          0
        );
        timeline.to(
          typeLines,
          {
            keyframes: [
              { opacity: 1, duration: 1, ease: "customEase" },
              { opacity: 0, duration: 1.5, ease: "customEase" },
            ],
            stagger: 0.05,
          },
          0
        );
        state.kineticAnimationActive = true;
        state.activeKineticAnimation = timeline;
      }, 20);
    }

    function fadeOutKineticAnimation() {
      if (!state.kineticAnimationActive) return;
      if (state.activeKineticAnimation) {
        state.activeKineticAnimation.kill();
        state.activeKineticAnimation = null;
      }
      const kineticType = qs("#kinetic-type");
      const fadeOutTimeline = gsap.timeline({
        onComplete: () => {
          gsap.set(kineticType, { scale: 1, rotation: 0, opacity: 1 });
          gsap.set(typeLines, { opacity: 0.015, x: "0%" });
          state.kineticAnimationActive = false;
        },
      });
      fadeOutTimeline.to(kineticType, {
        opacity: 0,
        scale: 0.8,
        duration: 0.5,
        ease: "customEase",
      });
    }

    function createTextRevealAnimation(rowId) {
      const timeline = gsap.timeline();
      timeline.to(backgroundTextItems, {
        opacity: 0.3,
        duration: 0.5,
        ease: "customEase",
      });
      timeline.call(() => {
        backgroundTextItems.forEach((item) => {
          item.classList.add("highlight");
        });
      });
      timeline.call(
        () => {
          backgroundTextItems.forEach((item) => {
            const originalText = item.dataset.text;
            if (
              alternativeTexts[rowId] &&
              alternativeTexts[rowId][originalText]
            ) {
              item.textContent = alternativeTexts[rowId][originalText];
            }
          });
        },
        null,
        "+=0.5"
      );
      timeline.call(() => {
        backgroundTextItems.forEach((item) => {
          item.classList.remove("highlight");
          item.classList.add("highlight-reverse");
        });
      });
      timeline.call(
        () => {
          backgroundTextItems.forEach((item) => {
            item.classList.remove("highlight-reverse");
          });
        },
        null,
        "+=0.5"
      );
      return timeline;
    }

    function resetBackgroundTextWithAnimation() {
      const timeline = gsap.timeline();
      timeline.call(() => {
        backgroundTextItems.forEach((item) => {
          item.classList.add("highlight");
        });
      });
      timeline.call(
        () => {
          backgroundTextItems.forEach((item) => {
            item.textContent = item.dataset.originalText;
          });
        },
        null,
        "+=0.5"
      );
      timeline.call(() => {
        backgroundTextItems.forEach((item) => {
          item.classList.remove("highlight");
          item.classList.add("highlight-reverse");
        });
      });
      timeline.call(
        () => {
          backgroundTextItems.forEach((item) => {
            item.classList.remove("highlight-reverse");
          });
        },
        null,
        "+=0.5"
      );
      timeline.to(backgroundTextItems, {
        opacity: 1,
        duration: 0.5,
        ease: "customEase",
      });
      return timeline;
    }

    function activateRow(row) {
      if (state.transitionInProgress) return;
      const rowId = row.dataset.rowId;
      if (state.activeRowId === rowId) return;
      const activeRow = container.querySelector(".text-row.active");
      if (activeRow) {
        transitionBetweenRows(activeRow, row);
      } else {
        row.classList.add("active");
        state.activeRowId = rowId;
        const text = row.querySelector(".text-content").dataset.text;
        const chars = splitTexts[rowId].chars;
        const innerSpans = row.querySelectorAll(".char-inner");
        startKineticAnimation(text);
        if (state.textRevealAnimation) state.textRevealAnimation.kill();
        state.textRevealAnimation = createTextRevealAnimation(rowId);
        const timeline = gsap.timeline();
        timeline.to(
          chars,
          {
            maxWidth: (i, target) => parseFloat(target.dataset.hoverWidth),
            duration: 0.64,
            stagger: 0.04,
            ease: "customEase",
          },
          0
        );
        timeline.to(
          innerSpans,
          { x: -35, duration: 0.64, stagger: 0.04, ease: "customEase" },
          0.05
        );
      }
    }
    function deactivateRow(row) {
      if (state.transitionInProgress) return;
      const rowId = row.dataset.rowId;
      if (state.activeRowId !== rowId) return;
      state.activeRowId = null;
      row.classList.remove("active");
      fadeOutKineticAnimation();
      if (state.textRevealAnimation) state.textRevealAnimation.kill();
      state.textRevealAnimation = resetBackgroundTextWithAnimation();
      const chars = splitTexts[rowId].chars;
      const innerSpans = row.querySelectorAll(".char-inner");
      const timeline = gsap.timeline();
      timeline.to(
        innerSpans,
        { x: 0, duration: 0.64, stagger: 0.03, ease: "customEase" },
        0
      );
      timeline.to(
        chars,
        {
          maxWidth: (i, target) => parseFloat(target.dataset.charWidth),
          duration: 0.64,
          stagger: 0.03,
          ease: "customEase",
        },
        0.05
      );
    }
    function transitionBetweenRows(fromRow, toRow) {
      if (state.transitionInProgress) return;
      state.transitionInProgress = true;
      const fromRowId = fromRow.dataset.rowId;
      const toRowId = toRow.dataset.rowId;
      fromRow.classList.remove("active");
      const fromChars = splitTexts[fromRowId].chars;
      const fromInners = fromRow.querySelectorAll(".char-inner");
      gsap.killTweensOf(fromChars);
      gsap.killTweensOf(fromInners);
      toRow.classList.add("active");
      state.activeRowId = toRowId;
      const toText = toRow.querySelector(".text-content").dataset.text;
      const toChars = splitTexts[toRowId].chars;
      const toInners = toRow.querySelectorAll(".char-inner");
      forceResetKineticAnimation();
      startKineticAnimation(toText);
      if (state.textRevealAnimation) state.textRevealAnimation.kill();
      state.textRevealAnimation = createTextRevealAnimation(toRowId);
      gsap.set(fromChars, {
        maxWidth: (i, target) => parseFloat(target.dataset.charWidth),
      });
      gsap.set(fromInners, { x: 0 });
      const timeline = gsap.timeline({
        onComplete: () => {
          state.transitionInProgress = false;
        },
      });
      timeline.to(
        toChars,
        {
          maxWidth: (i, target) => parseFloat(target.dataset.hoverWidth),
          duration: 0.64,
          stagger: 0.04,
          ease: "customEase",
        },
        0
      );
      timeline.to(
        toInners,
        { x: -35, duration: 0.64, stagger: 0.04, ease: "customEase" },
        0.05
      );
    }

    // Mouse parallax inside video overlay only
    const parallaxLayers = [0.02, 0.03, 0.04, 0.05];
    const backgroundElements = [
      ...qsa(".text-background"),
    ];
    backgroundElements.forEach((el, index) => {
      el.dataset.parallaxSpeed = parallaxLayers[index % parallaxLayers.length];
      gsap.set(el, { transformOrigin: "center center", force3D: true });
    });
    let lastParallaxTime = 0;
    const throttleParallax = 20;
    container.addEventListener("mousemove", (e) => {
      const now = Date.now();
      if (now - lastParallaxTime < throttleParallax) return;
      lastParallaxTime = now;
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const offsetX = (e.clientX - centerX) / (rect.width / 2);
      const offsetY = (e.clientY - centerY) / (rect.height / 2);
      backgroundElements.forEach((el) => {
        const speed = parseFloat(el.dataset.parallaxSpeed);
        const moveX = offsetX * 100 * speed;
        const moveY = offsetY * 50 * speed;
        gsap.to(el, {
          x: moveX,
          y: moveY,
          duration: 1,
          ease: "mouseEase",
          overwrite: "auto",
        });
      });
    });
    container.addEventListener("mouseleave", () => {
      backgroundElements.forEach((el) =>
        gsap.to(el, { x: 0, y: 0, duration: 1.5, ease: "customEase" })
      );
    });
    backgroundElements.forEach((el, index) => {
      const delay = index * 0.2;
      const floatAmount = 5 + (index % 3) * 2;
      gsap.to(el, {
        y: `+=${floatAmount}`,
        duration: 3 + (index % 2),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay,
      });
    });
    // Interactive events
    textRows.forEach((row) => {
      const interactiveArea = row.querySelector(".interactive-area");
      interactiveArea.addEventListener("mouseenter", () => activateRow(row));
      interactiveArea.addEventListener("mouseleave", () => {
        if (state.activeRowId === row.dataset.rowId) deactivateRow(row);
      });
      row.addEventListener("click", () => activateRow(row));
    });
    // Scramble single background text item
    function scrambleRandomText() {
      const randomIndex = Math.floor(
        Math.random() * backgroundTextItems.length
      );
      const randomItem = backgroundTextItems[randomIndex];
      const originalText = randomItem.dataset.text;
      gsap.to(randomItem, {
        duration: 1,
        scrambleText: {
          text: originalText,
          chars: "■▪▌▐▬",
          revealDelay: 0.5,
          speed: 0.3,
        },
        ease: "none",
      });
      const delay = 0.5 + Math.random() * 2;
      setTimeout(scrambleRandomText, delay * 1000);
    }
    setTimeout(scrambleRandomText, 1000);
    // Subtle blinking for all background text items
    backgroundTextItems.forEach((item, index) => {
      const delay = index * 0.1;
      gsap.to(item, {
        opacity: 0.85,
        duration: 2 + (index % 3),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay,
      });
    });

    // Patch: kinetic-type visible in overlay
    const style = document.createElement("style");
    style.textContent = `#kinetic-type { z-index: 400 !important; display: grid !important; visibility: visible !important; opacity: 1; pointer-events: none; }`;
    document.head.appendChild(style);
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="narrow-video-overlay"
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          userSelect: "none",
          maxWidth: "100vw",
        }}
      >
        {/* Video at base */}
        <video
          className="video-element"
          src={videoSource}
          autoPlay
          loop
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />

        <div
          className="bottom-gradient"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "40vh",
            background:
              "linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />

        <div
          className="text-background"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 15,
          }}
        >
          {BACKGROUND_TEXT_ITEMS.map(({ text, top, left, right }, i) => (
            <div
              key={i}
              className="text-item"
              data-text={text}
              style={{
                position: "absolute",
                top,
                left,
                right,
                color: "#ffcc00",
                fontSize: "0.8rem",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                fontFamily: '"TheGoodMonolith", monospace',
                opacity: 0.8,
                pointerEvents: "none",
              }}
            >
              {text}
            </div>
          ))}
        </div>

        {/* Overlay gradient for white top */}
        <div
          className="white-gradient-overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 30,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 5%, rgba(255,255,255,0) 50%)",
          }}
        />

        {/* Main text content and interactivity */}
        <div
          className="main-content sliced-container"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            maxWidth: "100vw",
            zIndex: 110,
            userSelect: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          {["Food", "Fantasy"].map((rowId) => (
            <div
              className="text-row"
              data-row-id={rowId}
              key={rowId}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "100vw",
                minHeight: "1em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <div
                className="text-content"
                data-text={rowId.toUpperCase()}
                style={{
                  fontSize: "clamp(2.1rem, 10vw, 10rem)",
                  color: "#ffcc00",
                  textTransform: "uppercase",
                  letterSpacing: "0",
                  visibility: "hidden",
                  willChange: "transform",
                  fontFamily: '"Longsile", sans-serif',
                  fontWeight: "normal",
                }}
              >
                {rowId.toUpperCase()}
              </div>
              <div
                className="interactive-area"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  zIndex: 30,
                }}
              />
            </div>
          ))}
        </div>

        {/* Kinetic animated text overlay (centered) */}
        <div
          className="type"
          id="kinetic-type"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100vmax",
            height: "100vmax",
            display: "none",
            justifyContent: "center",
            alignContent: "center",
            textAlign: "center",
            marginTop: "-50vmax",
            marginLeft: "-50vmax",
            pointerEvents: "none",
            userSelect: "none",
            transformStyle: "preserve-3d",
            zIndex: 400,
            color: "#fff",
            fontFamily: '"PP Neue Montreal", sans-serif',
            fontWeight: "bold",
            fontSize: "clamp(7rem, 18.75vh, 15rem)",
            textTransform: "uppercase",
          }}
        >
          {KINETIC_LINES.map((line, i) => (
            <div
              key={i}
              className={`type-line ${i % 2 === 0 ? "odd" : "even"}`}
              style={{
                whiteSpace: "nowrap",
                opacity: 0.015,
                lineHeight: 0.75,
                position: "relative",
                userSelect: "none",
                fontFamily: '"PP Neue Montreal", sans-serif',
                color: "#fff",
                zIndex: i % 2 === 0 ? 50 : 150,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>
      {/* External font CSS and additional styles. For a real project, these belong in your global CSS. */}
      <style>{`
  @import url("https://fonts.cdnfonts.com/css/longsile");
  @import url("https://fonts.cdnfonts.com/css/thegoodmonolith");
  @import url("https://fonts.cdnfonts.com/css/pp-neue-montreal");

  /* Base styles */
  .text-content {
    font-size: clamp(2.1rem, 10vw, 10rem) !important;
    color: #ffcc00;
    text-transform: uppercase;
    letter-spacing: 0;
    visibility: hidden;
    will-change: transform;
    font-family: "Longsile", sans-serif;
    font-weight: normal;
  }

  .text-row {
    height: auto !important;
    min-height: 2em !important;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .main-content {
    gap: 1rem; /* default spacing between rows */
  }

  .type {
    font-size: clamp(2rem, 7vw, 12rem) !important;
  }

  .text-item {
    font-size: clamp(0.5rem, 2vw, 0.8rem) !important;
  }

  /* Medium-large screens */
  @media screen and (max-width: 992px) {
    .text-content {
      font-size: clamp(1.5rem, 9vw, 7rem) !important;
    }
    .text-row {
      min-height: 1.5em !important;
    }
    .main-content {
      gap: 0.8rem !important;
    }
    .type {
      font-size: clamp(1rem, 6vw, 6rem) !important;
    }
    .text-item {
      font-size: clamp(0.4rem, 2vw, 0.7rem) !important;
    }
  }

  /* Tablets / smaller tablets */
  @media screen and (max-width: 768px) {
    .text-content {
      font-size: clamp(0.9rem, 8vw, 4.5rem) !important; /* smaller text */
      letter-spacing: -0.02em; /* tighter horizontal spacing */
    }
    .text-row {
      min-height: 1.1em !important;
      margin: 6px 0 !important;
      padding: 0 0.5rem;
    }
    .main-content {
      gap: 0.5rem !important; /* reduced gap */
    }
    .type {
      font-size: clamp(0.8rem, 8vw, 4rem) !important;
    }
    .text-item {
      font-size: clamp(0.3rem, 2vw, 0.6rem) !important;
    }
  }

  /* Mobile phones / very small devices */
  @media screen and (max-width: 480px) {
    .text-content {
      font-size: clamp(0.7rem, 14vw, 3rem) !important; /* smaller text */
      letter-spacing: -0.03em; /* tighter spacing */
    }
    .text-row {
      min-height: 0.9em !important;
      margin: 4px 0 !important;
      padding: 0 0.4rem;
    }
    .main-content {
      gap: 0.4rem !important; /* minimal gap */
    }
    .type {
      font-size: clamp(0.65rem, 11vw, 2.5rem) !important;
    }
    .text-item {
      font-size: clamp(0.25rem, 4vw, 0.6rem) !important;
    }
  }
`}</style>
    </>
  );
}