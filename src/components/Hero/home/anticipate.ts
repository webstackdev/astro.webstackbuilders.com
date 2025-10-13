/**
 * Animation magic
 */
const cnst = () => {
  const tenPercentBounce = 1.70158
  return tenPercentBounce * 1.525
}

export const Anticipate = {
  out: function (p: number) {
    return (p *= 2) < 1
      ? 0.5 * p * p * ((cnst() + 1) * p - cnst())
      : 0.5 * (2 - Math.pow(2, -10 * (p - 1)))
  },
  in: function (p: number) {
    return (p *= 2) < 1
      ? 0.5 * (Math.pow(2, 10 * (p - 1)) - 0.001)
      : 0.5 * ((p -= 2) * p * ((cnst() + 1) * p + cnst()) + 2)
  },
  inOut: function (p: number) {
    return (p *= 2) < 1
      ? 0.5 * p * p * ((cnst() + 1) * p - cnst())
      : 0.5 * ((p -= 2) * p * ((cnst() + 1) * p + cnst()) + 2)
  },
}
