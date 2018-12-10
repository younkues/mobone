export function $(selector: string, target?: Element) {
  return (target || document).querySelector(selector) as HTMLElement;
}

export function isNumber(obj: any): obj is number {
  return typeof obj === "number";
}
