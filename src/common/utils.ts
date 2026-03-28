export function geometricWeights(
  N: number,
  startat: number = 0,
  rtype: 'list' | 'dict' = 'list',
): number[] | Record<string, number> {
  if (rtype === 'list') {
    const weights: number[] = [];
    for (let i = 0; i < N; i++) {
      weights.push(50.0 / Math.pow(2, i));
    }
    return weights;
  } else {
    const weights: Record<string, number> = {};
    for (let i = 0; i < N; i++) {
      weights[String(startat + i)] = 50.0 / Math.pow(2, i);
    }
    return weights;
  }
}

export function stringToInt(val: any): number {
  if (typeof val !== 'string') {
    return val;
  }
  if (val.endsWith('%')) {
    return parseInt(val.slice(0, -1), 10);
  }
  return parseInt(val, 10);
}
