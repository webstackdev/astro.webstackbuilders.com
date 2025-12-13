type VelocityTrackerModule = typeof import('gsap/types/utils/velocity-tracker') extends {
  VelocityTracker: infer T
}
  ? T
  : unknown

declare module 'gsap/utils/VelocityTracker' {
  const VelocityTracker: VelocityTrackerModule
  export { VelocityTracker }
  export default VelocityTracker
}

declare module 'gsap/utils/VelocityTracker.js' {
  const VelocityTracker: VelocityTrackerModule
  export { VelocityTracker }
  export default VelocityTracker
}
