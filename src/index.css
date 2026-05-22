@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Manrope:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Hanken Grotesk", "Inter", sans-serif;
  --font-display: "Manrope", '"Hanken Grotesk"', sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  
  --color-primary: #4648d4;
  --color-primary-container: #6063ee;
  --color-primary-fixed: #e1e0ff;
  --color-primary-fixed-dim: #c0c1ff;
  --color-on-primary: #ffffff;
  --color-on-primary-container: #fffbff;
  --color-on-primary-fixed: #07006c;
  --color-on-primary-fixed-variant: #2f2ebe;
  
  --color-secondary: #b4136d;
  --color-secondary-container: #fd56a7;
  --color-secondary-fixed: #ffd9e4;
  --color-secondary-fixed-dim: #ffb0cd;
  --color-on-secondary: #ffffff;
  --color-on-secondary-container: #600037;
  --color-on-secondary-fixed: #3e0022;
  --color-on-secondary-fixed-variant: #8c0053;
  
  --color-tertiary: #6b38d4;
  --color-tertiary-container: #8455ef;
  --color-tertiary-fixed: #e9ddff;
  --color-tertiary-fixed-dim: #d0bcff;
  --color-on-tertiary: #ffffff;
  --color-on-tertiary-container: #fffbff;
  --color-on-tertiary-fixed: #23005c;
  --color-on-tertiary-fixed-variant: #5516be;
  
  --color-surface: #faf8ff;
  --color-surface-dim: #d2d9f4;
  --color-surface-bright: #faf8ff;
  --color-surface-variant: #dae2fd;
  --color-on-surface: #131b2e;
  --color-on-surface-variant: #464554;
  
  --color-surface-container-lowest: #ffffff;
  --color-surface-container-low: #f2f3ff;
  --color-surface-container: #eaedff;
  --color-surface-container-high: #e2e7ff;
  --color-surface-container-highest: #dae2fd;
  
  --color-inverse-surface: #283044;
  --color-inverse-on-surface: #eef0ff;
  --color-inverse-primary: #c0c1ff;
  
  --color-outline: #767586;
  --color-outline-variant: #c7c4d7;
  
  --color-error: #ba1a1a;
  --color-on-error: #ffffff;
  --color-error-container: #ffdad6;
  --color-on-error-container: #93000a;
  
  --color-background: #faf8ff;
  --color-on-background: #131b2e;
}

@layer utilities {
  .wheel-shadow {
    box-shadow: 0px 12px 40px rgba(15, 23, 42, 0.12), inset 0px 0px 0px 8px #ffffff;
  }
  
  .glass-panel {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(199, 196, 215, 0.3);
  }
  
  .text-glow {
    text-shadow: 0 0 12px rgba(96, 99, 238, 0.4);
  }
}

/* Animations and keyframes */
@keyframes coin-flip {
  0% { transform: scale(1) rotateY(0deg); }
  50% { transform: scale(1.4) rotateY(900deg); }
  100% { transform: scale(1) rotateY(1800deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes scan-line {
  0% { transform: translateY(0); }
  100% { transform: translateY(100%); }
}

.animate-coin-flip {
  animation: coin-flip 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

.animate-scan-line {
  animation: scan-line 2s linear infinite;
}
