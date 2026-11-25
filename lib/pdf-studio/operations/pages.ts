import { PAGE_SIZES, type PageSizeName } from "../constants";
import type { PageModel } from "../types";
import { newId } from "../types";

export function rotatePage(page: PageModel, delta: 90 | -90): PageModel {
  const next = (((page.rotation + delta) % 360) + 360) % 360 as 0 | 90 | 180 | 270;
  const swap = Math.abs(delta) === 90;
  return {
    ...page,
    rotation: next,
    width: swap ? page.height : page.width,
    height: swap ? page.width : page.height,
  };
}

export function createBlankPage(
  size: PageSizeName | { width: number; height: number },
  landscape = false,
): PageModel {
  const dim = typeof size === "string" ? PAGE_SIZES[size] : size;
  let { width, height } = dim;
  if (landscape) [width, height] = [height, width];
  return {
    id: newId("page"),
    sourceDocId: "blank",
    sourcePageIndex: 0,
    width,
    height,
    rotation: 0,
    blank: true,
  };
}

export function duplicatePage(page: PageModel): PageModel {
  return { ...page, id: newId("page") };
}

export function reorderPages(order: string[], fromIndex: number, toIndex: number): string[] {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return order;
  const next = [...order];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}