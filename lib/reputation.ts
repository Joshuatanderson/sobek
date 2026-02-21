/** Base: shared log-weighted formula */
const logWeighted =
  (multiplier: number) =>
  (amountUsd: number): number => {
    if (amountUsd <= 0) throw new RangeError("amountUsd must be > 0");
    return Math.round(Math.log10(amountUsd) * multiplier);
  };

/** +rep for seller on successful order release (happy path or dispute-seller-wins) */
export const calculateSuccessSeller = logWeighted(10);

/** -rep for seller when buyer wins dispute */
export const calculateDisputeLossSeller = (amountUsd: number): number =>
  -logWeighted(50)(amountUsd) || 0;

/** -rep for buyer when seller wins dispute */
export const calculateDisputeLossBuyer = (amountUsd: number): number =>
  -logWeighted(20)(amountUsd) || 0;
