"use client";

export function SobekMascot({ className = "" }: { className?: string }) {
  return (
    <div className={`sobek-mascot ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 120"
        width="200"
        height="120"
      >
        <defs>
          <filter id="neonGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="eyeGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#166534" />
            <stop offset="50%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>
          <linearGradient id="bellyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#166534" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <g className="sobek-float">
          {/* Tail */}
          <path
            className="sobek-tail"
            d="M155 55 C165 50 178 42 190 48 C195 52 192 58 185 56 C178 54 170 58 160 58"
            fill="url(#bodyGrad)"
            stroke="#22c55e"
            strokeWidth="0.5"
            strokeOpacity="0.3"
          />

          {/* Body */}
          <ellipse cx="110" cy="58" rx="55" ry="22" fill="url(#bodyGrad)" />

          {/* Belly */}
          <ellipse cx="110" cy="62" rx="42" ry="14" fill="url(#bellyGrad)" />

          {/* Scale pattern on back */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path
              key={`scale-${i}`}
              d={`M${75 + i * 10} ${42 + (i % 2) * 2} Q${80 + i * 10} ${38 + (i % 2) * 2} ${85 + i * 10} ${42 + (i % 2) * 2}`}
              fill="none"
              stroke="#22c55e"
              strokeWidth="0.8"
              opacity="0.25"
            />
          ))}

          {/* Back ridge spines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={`spine-${i}`}
              d={`M${82 + i * 12} 40 L${85 + i * 12} 34 L${88 + i * 12} 40`}
              fill="#15803d"
              stroke="#22c55e"
              strokeWidth="0.3"
              opacity="0.5"
            />
          ))}

          {/* Head */}
          <path
            d="M55 46 C45 40 20 38 10 48 C8 52 10 58 14 62 C20 68 45 70 55 66 C60 63 62 58 62 56 C62 52 60 48 55 46Z"
            fill="url(#bodyGrad)"
          />

          {/* Snout top */}
          <path
            d="M15 48 C20 42 40 40 50 46 L50 52 C40 48 25 48 15 52Z"
            fill="#14532d"
            opacity="0.5"
          />

          {/* Jaw line with teeth */}
          <path
            d="M14 58 L18 56 L22 59 L26 56 L30 59 L34 56 L38 59 L42 56 L46 59 L50 56"
            fill="none"
            stroke="#d1fae5"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Nostrils */}
          <circle cx="16" cy="50" r="1.5" fill="#052e16" />
          <circle cx="16" cy="56" r="1.5" fill="#052e16" />

          {/* Left eye socket */}
          <ellipse cx="38" cy="48" rx="7" ry="6" fill="#0a1a0a" />

          {/* Left eye - NEON */}
          <ellipse
            className="sobek-eye"
            cx="38"
            cy="48"
            rx="5.5"
            ry="5"
            fill="#00ff87"
            filter="url(#eyeGlow)"
          />

          {/* Left eye pupil - vertical slit */}
          <ellipse cx="38" cy="48" rx="1.8" ry="4.5" fill="#0a0a0a" />

          {/* Left eye highlight */}
          <circle cx="36" cy="46" r="1.2" fill="#ffffff" opacity="0.6" />

          {/* Right eye socket */}
          <ellipse cx="38" cy="64" rx="6" ry="5" fill="#0a1a0a" />

          {/* Right eye - NEON */}
          <ellipse
            className="sobek-eye"
            cx="38"
            cy="64"
            rx="4.5"
            ry="4"
            fill="#00ff87"
            filter="url(#eyeGlow)"
          />

          {/* Right eye pupil - vertical slit */}
          <ellipse cx="38" cy="64" rx="1.5" ry="3.5" fill="#0a0a0a" />

          {/* Right eye highlight */}
          <circle cx="36.5" cy="62.5" r="1" fill="#ffffff" opacity="0.6" />

          {/* Front legs */}
          <path d="M80 72 L75 90 L78 92 L84 78" fill="url(#bodyGrad)" />
          <path d="M95 72 L92 90 L95 92 L100 78" fill="url(#bodyGrad)" />

          {/* Back legs */}
          <path d="M130 70 L126 88 L129 90 L135 76" fill="url(#bodyGrad)" />
          <path d="M145 68 L143 86 L146 88 L150 74" fill="url(#bodyGrad)" />

          {/* Claws */}
          {[75, 92, 126, 143].map((x, i) => (
            <g key={`claw-${i}`}>
              <line
                x1={x}
                y1={88 + (i < 2 ? 2 : 0)}
                x2={x - 2}
                y2={92 + (i < 2 ? 2 : 0)}
                stroke="#22c55e"
                strokeWidth="0.8"
                opacity="0.5"
              />
              <line
                x1={x + 2}
                y1={88 + (i < 2 ? 2 : 0)}
                x2={x + 1}
                y2={93 + (i < 2 ? 2 : 0)}
                stroke="#22c55e"
                strokeWidth="0.8"
                opacity="0.5"
              />
            </g>
          ))}

          {/* Neon outline glow on body */}
          <ellipse
            cx="110"
            cy="58"
            rx="55"
            ry="22"
            fill="none"
            stroke="#00ff87"
            strokeWidth="0.5"
            opacity="0.15"
            filter="url(#neonGlow)"
          />
        </g>
      </svg>

      <style>{`
        .sobek-mascot {
          display: inline-block;
          filter: drop-shadow(0 0 20px rgba(0, 255, 135, 0.15));
        }
        .sobek-float {
          animation: sobekFloat 4s ease-in-out infinite;
          transform-origin: center;
        }
        .sobek-tail {
          animation: sobekTail 3s ease-in-out infinite;
          transform-origin: 155px 55px;
        }
        .sobek-eye {
          animation: sobekEyePulse 3s ease-in-out infinite;
        }
        @keyframes sobekFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes sobekTail {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(3deg); }
          75% { transform: rotate(-3deg); }
        }
        @keyframes sobekEyePulse {
          0%, 100% { opacity: 1; fill: #00ff87; }
          50% { opacity: 0.7; fill: #4ade80; }
        }
      `}</style>
    </div>
  );
}
