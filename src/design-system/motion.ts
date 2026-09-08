export const motionDuration = {
  micro: 0.14,
  fast: 0.18,
  normal: 0.24,
  enter: 0.36,
  page: 0.48,
  chart: 0.7,
} as const;

export const motionEase = {
  standard: [0.2, 0.8, 0.2, 1],
  emphasized: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export const motionSpring = {
  responsive: {
    type: 'spring' as const,
    stiffness: 420,
    damping: 34,
    mass: 0.75,
  },
  gentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 0.85,
  },
} as const;

export const motionTransition = {
  micro: { duration: motionDuration.micro, ease: motionEase.standard },
  normal: { duration: motionDuration.normal, ease: motionEase.standard },
  enter: { duration: motionDuration.enter, ease: motionEase.emphasized },
  page: { duration: motionDuration.page, ease: motionEase.emphasized },
} as const;

export const reducedMotionTransition = { duration: 0 } as const;
