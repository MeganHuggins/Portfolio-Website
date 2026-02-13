// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initTheme();
    initNavigation();
    initScrollEffects();
    initTypingAnimation();
    initSkillBars();
    // initContactForm();
    initSmoothScrolling();
    initCreativeAnimations();
});

console.count("popup script loaded");

document.addEventListener("DOMContentLoaded", () => {
  // --- Grab DOM elements (safe after DOMContentLoaded) ---
  const overlay = document.getElementById("popupOverlay");
  const closeBtn = document.getElementById("closePopupBtn");

  const zoomWrapper = document.getElementById("zoomWrapper");
  const zoomImage = document.getElementById("zoomImage");

  const popupContent = document.querySelector(".popup-content");
  const popupLoading = document.getElementById("popupLoading");

  // --- Carousel elements (add these to your popup HTML) ---
  const carouselControls = document.getElementById("carouselControls");
  const carouselPrev = document.getElementById("carouselPrev");
  const carouselNext = document.getElementById("carouselNext");
  const carouselCount = document.getElementById("carouselCount");
  const carouselDots = document.getElementById("carouselDots");

  // --- Guard: if any required element is missing, stop and log clearly ---
  const required = {
    overlay,
    closeBtn,
    zoomWrapper,
    zoomImage,
    popupContent,
    popupLoading,
    carouselControls,
    carouselPrev,
    carouselNext,
    carouselCount,
    carouselDots,
  };

  const missing = Object.entries(required)
    .filter(([_, el]) => !el)
    .map(([name]) => name);

  if (missing.length) {
    console.error("Popup init failed. Missing elements:", missing);
    return;
  }

  // --- Config ---
  const SCALE = 2;
  let isZoomedMobile = false;

  const canHover = window.matchMedia("(hover: hover)").matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;

  // --- Carousel state ---
  let carouselImages = [];
  let carouselIndex = 0;

  function resetZoom() {
    isZoomedMobile = false;
    zoomWrapper.classList.remove("is-zoomed");
    zoomWrapper.classList.remove("is-armed");
    zoomImage.style.transform = "scale(1)";
    zoomImage.style.transformOrigin = "50% 50%";
  }

  function setOriginFromEvent(e) {
    const rect = zoomWrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;

    zoomImage.style.transformOrigin = `${x * 100}% ${y * 100}%`;
  }

  function showCarouselControls(show) {
    if (show) {
      carouselControls.classList.add("is-active");
      carouselControls.setAttribute("aria-hidden", "false");
    } else {
      carouselControls.classList.remove("is-active");
      carouselControls.setAttribute("aria-hidden", "true");
    }
  }

  function renderDots() {
    carouselDots.innerHTML = "";

    carouselImages.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "carousel-dot" + (i === carouselIndex ? " is-active" : "");
      dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
      dot.addEventListener("click", () => goToSlide(i));
      carouselDots.appendChild(dot);
    });
  }

  function updateCarouselUI() {
    const total = carouselImages.length || 1;

    carouselCount.textContent = `${carouselIndex + 1} / ${total}`;
    carouselPrev.disabled = carouselIndex === 0;
    carouselNext.disabled = carouselIndex === total - 1;

    [...carouselDots.children].forEach((dot, i) => {
      dot.classList.toggle("is-active", i === carouselIndex);
    });
  }

  async function loadIntoPopupImage(imgSrc, imgAlt = "") {
    if (!imgSrc) return;

    // Reset zoom + prep loading UI
    resetZoom();
    zoomImage.classList.remove("is-ready");
    popupContent.classList.add("is-loading");
    popupLoading.textContent = "Loading…";

    // Clear old image so it can't flash
    zoomImage.removeAttribute("src");
    zoomImage.alt = imgAlt;

    // Preload next image BEFORE showing it
    const preloaded = new Image();
    preloaded.src = imgSrc;

    try {
      await new Promise((resolve, reject) => {
        preloaded.onload = resolve;
        preloaded.onerror = reject;
      });

      if (preloaded.decode) {
        try {
          await preloaded.decode();
        } catch (e) {
          console.warn("decode() failed, continuing:", e);
        }
      }

      zoomImage.src = imgSrc;
      requestAnimationFrame(() => zoomImage.classList.add("is-ready"));
    } catch (err) {
      popupLoading.textContent = "Failed to load image.";
      console.warn("Popup image failed to load:", err, "src:", imgSrc);
    } finally {
      popupContent.classList.remove("is-loading");
    }
  }

  async function goToSlide(i) {
    carouselIndex = i;
    updateCarouselUI();
    await loadIntoPopupImage(carouselImages[carouselIndex], zoomImage.alt || "");
  }

  async function openPopup(payload = {}) {
    const imgAlt = payload.imgAlt || "";
    const carousel = Array.isArray(payload.carousel) ? payload.carousel : [];
    const isCarousel = carousel.length > 0;

    // Open modal immediately (feels responsive)
    overlay.classList.add("active");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // Reset carousel each time
    carouselImages = [];
    carouselIndex = 0;
    showCarouselControls(false);

    if (isCarousel) {
      carouselImages = carousel;
      carouselIndex = 0;

      showCarouselControls(true);
      renderDots();
      updateCarouselUI();

      await loadIntoPopupImage(carouselImages[0], imgAlt);
      return;
    }

    const imgSrc = payload.imgSrc || "";
    if (!imgSrc) {
      console.warn("openPopup called without imgSrc. Payload:", payload);
      return;
    }

    await loadIntoPopupImage(imgSrc, imgAlt);
  }

  function closePopup() {
    overlay.classList.remove("active");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    resetZoom();

    // Clear image to prevent flash on next open
    zoomImage.classList.remove("is-ready");
    zoomImage.removeAttribute("src");

    // Reset carousel UI/state
    carouselImages = [];
    carouselIndex = 0;
    showCarouselControls(false);
    carouselDots.innerHTML = "";
    carouselCount.textContent = "1 / 1";
  }

  // --- Carousel button wiring ---
  carouselPrev.addEventListener("click", (e) => {
    e.stopPropagation();
    if (carouselIndex > 0) goToSlide(carouselIndex - 1);
  });

  carouselNext.addEventListener("click", (e) => {
    e.stopPropagation();
    if (carouselImages.length && carouselIndex < carouselImages.length - 1) {
      goToSlide(carouselIndex + 1);
    }
  });

  // Optional: arrow key navigation for carousel
  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("active")) return;
    if (!carouselImages.length) return;

    if (e.key === "ArrowLeft" && carouselIndex > 0) goToSlide(carouselIndex - 1);
    if (e.key === "ArrowRight" && carouselIndex < carouselImages.length - 1) {
      goToSlide(carouselIndex + 1);
    }
  });

  // --- Trigger click (event delegation) ---
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".popup-trigger");
    if (!trigger) return;

    e.preventDefault();
    e.stopPropagation();

    const imgAlt = trigger.dataset.popupAlt || "";

    // ✅ Carousel trigger: data-carousel="a.png|b.png|c.png"
    const carouselRaw = trigger.dataset.carousel;
    if (carouselRaw) {
      const carousel = carouselRaw
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!carousel.length) {
        console.warn("data-carousel present but empty:", trigger);
        return;
      }

      requestAnimationFrame(() => openPopup({ carousel, imgAlt }));
      return;
    }

    // ✅ Single-image trigger: hidden <img class="popup-src" src="...">
    const srcEl = trigger.querySelector(".popup-src");
    const imgSrc = srcEl?.getAttribute("src") || "";

    if (!imgSrc) {
      console.warn("Popup trigger missing .popup-src <img src='...'>:", trigger);
      return;
    }

    requestAnimationFrame(() => openPopup({ imgSrc, imgAlt }));
  });

  // --- Close behavior ---
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    closePopup();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePopup();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) closePopup();
  });

  // --- Zoom behavior ---
  // Desktop: "armed" zoom so it doesn't auto-zoom on open
  if (canHover && !isCoarsePointer) {
    let armed = false;
    let startX = 0;
    let startY = 0;
    const MOVE_THRESHOLD = 6;

    zoomWrapper.addEventListener("mouseenter", (e) => {
      if (!overlay.classList.contains("active")) return;

      armed = true;
      startX = e.clientX;
      startY = e.clientY;

      zoomWrapper.classList.add("is-armed");
      resetZoom();
    });

    zoomWrapper.addEventListener("mousemove", (e) => {
      if (!overlay.classList.contains("active")) return;
      if (!armed) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) < MOVE_THRESHOLD) return;

      zoomWrapper.classList.remove("is-armed");
      setOriginFromEvent(e);
      zoomImage.style.transform = `scale(${SCALE})`;
      zoomWrapper.classList.add("is-zoomed");
    });

    zoomWrapper.addEventListener("mouseleave", () => {
      armed = false;
      resetZoom();
    });
  } else {
    // Mobile: tap-to-toggle zoom
    zoomWrapper.addEventListener("click", (e) => {
      if (!overlay.classList.contains("active")) return;

      isZoomedMobile = !isZoomedMobile;

      if (isZoomedMobile) {
        setOriginFromEvent(e);
        zoomImage.style.transform = `scale(${SCALE})`;
        zoomWrapper.classList.add("is-zoomed");
      } else {
        resetZoom();
      }
    });
  }
});



// Enhanced Theme Toggle with Smooth Transitions
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Load saved theme or use system preference
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme || (prefersDark.matches ? 'dark' : 'light');
    
    setTheme(initialTheme);
    
    // Theme toggle event
    themeToggle.addEventListener('click', function(e) {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Create elegant transition effect
        createThemeTransition(e);
        
        setTimeout(() => {
            setTheme(newTheme);
            localStorage.setItem('theme', newTheme);
        }, 150);
    });
    
    // Listen for system theme changes
    prefersDark.addListener((e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function createThemeTransition(event) {
    const transition = document.createElement('div');
    const rect = event.target.closest('.theme-toggle').getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    transition.style.cssText = `
        position: fixed;
        top: ${y}px;
        left: ${x}px;
        width: 0;
        height: 0;
        background: var(--accent-primary);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9999;
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        opacity: 0.1;
    `;
    
    document.body.appendChild(transition);
    
    requestAnimationFrame(() => {
        const size = Math.max(window.innerWidth, window.innerHeight) * 2.5;
        transition.style.width = size + 'px';
        transition.style.height = size + 'px';
    });
    
    setTimeout(() => transition.remove(), 800);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.content = theme === 'dark' ? '#0f0f0f' : '#fdfcfb';
    }
}

// Professional Navigation
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');
    const navLinksArray = document.querySelectorAll('.nav-link');

    if (!hamburger || !navLinks || !navbar) return;

    // Hamburger menu toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking on nav links
    navLinksArray.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Active nav link based on scroll position
    window.addEventListener('scroll', throttle(updateActiveNavLink, 100));
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    const scrollPosition = window.scrollY + 150;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Enhanced Typing Animation
function initTypingAnimation() {
    const roles = [
        'Digital Artisan',
        'Creative Developer', 
        'UI/UX Designer',
        'Frontend Specialist',
        'Problem Solver'
    ];
    
    const roleElement = document.getElementById('roleText');
    if (!roleElement) return;
    
    let currentRoleIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;

    function typeRole() {
        const currentRole = roles[currentRoleIndex];
        
        if (!isDeleting) {
            roleElement.textContent = currentRole.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            
            if (currentCharIndex === currentRole.length) {
                setTimeout(() => {
                    isDeleting = true;
                    typeRole();
                }, 2000);
                return;
            }
        } else {
            roleElement.textContent = currentRole.substring(0, currentCharIndex - 1);
            currentCharIndex--;
            
            if (currentCharIndex === 0) {
                isDeleting = false;
                currentRoleIndex = (currentRoleIndex + 1) % roles.length;
            }
        }
        
        const timeout = isDeleting ? 50 : 100;
        setTimeout(typeRole, timeout);
    }

    // Start typing animation after page load
    setTimeout(typeRole, 1500);
}

// Professional Scroll Effects
function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Special animations for different elements
                if (entry.target.classList.contains('skill-item')) {
                    setTimeout(() => animateSkillBar(entry.target), 200);
                }
                
                if (entry.target.classList.contains('story-card')) {
                    const cards = document.querySelectorAll('.story-card');
                    const index = Array.from(cards).indexOf(entry.target);
                    setTimeout(() => {
                        entry.target.style.transform = 'translateY(0)';
                        entry.target.style.opacity = '1';
                    }, index * 150);
                }
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));
}

// Skill Bars Animation
function initSkillBars() {
    const skillBars = document.querySelectorAll('.progress-bar');
    skillBars.forEach(bar => {
        bar.style.width = '0%';
    });
}

function animateSkillBar(skillItem) {
    const progressBar = skillItem.querySelector('.progress-bar');
    if (progressBar && !progressBar.animated) {
        const targetWidth = progressBar.getAttribute('data-width');
        
        setTimeout(() => {
            progressBar.style.width = targetWidth;
            progressBar.animated = true;
        }, 300);
    }
}

// Enhanced Contact Form
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        const isValid = validateForm();
        if (!isValid) return;
        
        // Get form data
        const formData = new FormData(contactForm);
        const formObject = {};
        formData.forEach((value, key) => {
            formObject[key] = value;
        });
        
        // Simulate form submission with professional feedback
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalContent = submitButton.innerHTML;
        
        // Loading state
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
        setTimeout(() => {
            // Success state
            submitButton.classList.remove('loading');
            submitButton.classList.add('success');
            submitButton.innerHTML = '<span class="btn-text">Message Sent!</span><div class="btn-arrow">✓</div>';
            
            setTimeout(() => {
                submitButton.innerHTML = originalContent;
                submitButton.classList.remove('success');
                submitButton.disabled = false;
                contactForm.reset();
            }, 2000);
        }, 1500);
        
        console.log('Form submitted:', formObject);
    });
    
    // Form validation
    const inputs = contactForm.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearValidation);
    });
}

function validateForm() {
    const inputs = document.querySelectorAll('#contactForm input, #contactForm textarea');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove existing validation classes
    field.classList.remove('valid', 'invalid');
    
    if (field.hasAttribute('required') && !value) {
        field.classList.add('invalid');
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            field.classList.add('invalid');
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
    }
    
    field.classList.add('valid');
    clearFieldError(field);
    return true;
}

function clearValidation(e) {
    const field = e.target;
    field.classList.remove('valid', 'invalid');
    clearFieldError(field);
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorElement = document.createElement('span');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    field.parentNode.appendChild(errorElement);
}

function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Smooth Scrolling
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Creative Animations and Interactions
function initCreativeAnimations() {
    // Profile frame 3D effect
    const profileFrame = document.querySelector('.profile-frame');
    if (profileFrame) {
        profileFrame.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            const rotateX = (mouseY / rect.height) * 5;
            const rotateY = (mouseX / rect.width) * -5;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        profileFrame.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }
    
    // Social links platform-specific hover colors
    const socialLinks = document.querySelectorAll('.social-link[data-platform]');
    socialLinks.forEach(link => {
        const platform = link.getAttribute('data-platform');
        let hoverColor;
        
        switch(platform) {
            case 'github': hoverColor = '#333'; break;
            case 'linkedin': hoverColor = '#0077b5'; break;
            case 'twitter': hoverColor = '#1da1f2'; break;
            case 'dribbble': hoverColor = '#ea4c89'; break;
            default: hoverColor = 'var(--accent-primary)';
        }
        
        link.addEventListener('mouseenter', function() {
            this.style.setProperty('--hover-color', hoverColor);
        });
    });
    
    // Decorative stars interaction
    const stars = document.querySelectorAll('.deco-star');
    stars.forEach(star => {
        star.addEventListener('mouseenter', function() {
            this.style.animation = 'gentleTwinkle 0.6s ease-in-out 2';
        });
    });
    
    // Floating shapes interaction on scroll
    window.addEventListener('scroll', throttle(() => {
        const scrolled = window.pageYOffset;
        const shapes = document.querySelectorAll('.floating-shape');
        
        shapes.forEach((shape, index) => {
            const speed = 0.1 + (index * 0.05);
            const yPos = scrolled * speed;
            shape.style.transform = `translateY(${yPos}px)`;
        });
    }, 16));
}

// Utility Functions
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Page Loading Animation
window.addEventListener('load', function() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease-in-out';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Performance Optimizations
const resizeObserver = new ResizeObserver(debounce(() => {
    // Handle resize events efficiently
    const isMobile = window.innerWidth <= 768;
    document.documentElement.style.setProperty('--is-mobile', isMobile ? '1' : '0');
}, 100));

resizeObserver.observe(document.documentElement);

// Console Branding
console.log('%c🏛️ Welcome to my Museum-Quality Portfolio!', 
    'color: #8b6f47; font-size: 24px; font-weight: 600; font-family: "Playfair Display", serif;');
console.log('%c✨ Inspired by Harvey.ai aesthetics and Louvre sophistication', 
    'color: #6b5b73; font-size: 14px; font-style: italic;');
console.log('%c💼 Crafted for GFG Patna Workshop', 
    'color: #7c8471; font-size: 12px;');
console.log('%c🎨 Professional • Elegant • Unique', 
    'color: #c19a6b; font-size: 12px; font-weight: 500;');
    