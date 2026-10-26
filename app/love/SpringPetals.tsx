import type { CSSProperties } from "react";
import styles from "./petals.module.css";

// Fixed values keep the decoration identical during server rendering and hydration.
const petals = [
  { left: 8, size: 13, duration: 19, delay: -8, drift: 42, turn: 230 },
  { left: 25, size: 10, duration: 23, delay: -17, drift: -31, turn: -150 },
  { left: 43, size: 15, duration: 21, delay: -3, drift: 26, turn: 280 },
  { left: 60, size: 11, duration: 25, delay: -20, drift: -45, turn: -250 },
  { left: 78, size: 14, duration: 20, delay: -12, drift: 35, turn: 200 },
  { left: 92, size: 9, duration: 24, delay: -6, drift: -38, turn: -190 },
  { left: 15, size: 9, duration: 27, delay: -23, drift: 52, turn: 320 },
  { left: 52, size: 12, duration: 22, delay: -14, drift: -20, turn: -270 },
  { left: 85, size: 16, duration: 26, delay: -2, drift: -48, turn: 230 },
];

export default function SpringPetals() {
  return (
    <div className={styles.petals} aria-hidden="true">
      {petals.map((petal, index) => (
        <span className={styles.falling} key={index} style={{
          left: `${petal.left}%`,
          width: petal.size,
          height: petal.size * 1.2,
          "--duration": `${petal.duration}s`,
          "--delay": `${petal.delay}s`,
          "--drift": `${petal.drift}px`,
          "--turn": `${petal.turn}deg`,
        } as CSSProperties}>
          <span className={styles.swaying}>
            <svg width="20" height="24" viewBox="0 0 20 24" focusable="false">
              <path d="M10 22C3 19 0 13 2 7 3 3 6 1 9 3l1 2 2-2c3-2 6 1 6 5 1 6-3 11-8 14Z" fill="currentColor" />
              <path d="M10 21C10 14 9 9 10 6" fill="none" stroke="#c7898e" strokeOpacity=".25" strokeWidth=".6" />
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}
