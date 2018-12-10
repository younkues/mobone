import { TRANSFORM, fromCSS, isString } from "@daybrush/utils";
import { BONE, MOBONE } from "./consts";
import {$, isNumber} from "./utils";
import Scene, {SceneItem} from "scenejs";

export interface IBoneInterface {
  transform?: string;
  parent?: Bone;
  origin?: string;
  childs?: WeakMap<HTMLElement, Bone>;
  rotate?: number;
  depth?: number;
}
export default class Bone {
  public el: HTMLElement;
  public state: Required<IBoneInterface>;
  public type: string = BONE;
  public item: Scene | SceneItem;
  constructor(el: string | HTMLElement, state: IBoneInterface = {}) {
    this.el = isString(el) ? $(el, state.parent && state.parent.el) : el;
    this.item = new SceneItem();

    const {[TRANSFORM]: transform, "transform-origin": origin} =
      fromCSS(this.el, [TRANSFORM, "transform-origin"]);

    this.state = {
      depth: 0,
      origin,
      transform: (!transform || transform === "none") ? "" : transform,
      parent: null,
      childs: new WeakMap(),
      rotate: 0,
      ...state,
    };
    this.state.origin !== origin && (this.el.style.cssText += `transform-origin:${this.state.origin};`);
  }
  public remove(el: Bone | string | HTMLElement) {
    const bone = el instanceof Bone ? el : this.get(el);

    this.state.childs.delete(bone.el);
    const mobone = this.base();

    mobone && mobone.remove(bone);
  }
  public set(bone: Bone) {
    this.state.childs.set(bone.el, bone);
  }
  public get(el: string | HTMLElement) {
    return this.state.childs.get(isString(el) ? this.el.querySelector(el) : el);
  }
  public add(el: string | HTMLElement, state: IBoneInterface = {}) {
    const bone = new Bone(el, {
      parent: this,
      depth: this.state.depth + 1,
      ...state,
    });

    this.set(bone);

    const mobone = this.base();

    mobone && mobone.set(bone);
    return bone;
  }
  public rotate(deg: number) {
    const state = this.state;

    state.rotate = deg;

    this.el.style.cssText += `${TRANSFORM}:${state.transform} rotate(${deg}deg);`;
    return this;
  }
  public base() {
    let baseParent: Bone = this.parent();

    while (baseParent) {
      if (baseParent.type === MOBONE) {
        return baseParent;
      }
      baseParent = baseParent.parent();
    }
    return baseParent;
  }
  public snapshot(time: number) {
    (this.item as SceneItem).set(time, "transform", "rotate", `${this.state.rotate}deg`);
    return this;
  }
  public parent(base: number | string | HTMLElement = 1) {
    if (isNumber(base)) {
      let parent: Bone = this;

      for (let i = 0; i < base; ++i) {
        if (!parent) {
          break;
        }
        parent = parent.state.parent;
      }
      return parent;
    }
    const el = isString(base) ? $(base) : base;
    let baseParent: Bone = this.parent();

    while (baseParent) {
      if (baseParent.el === el) {
        return baseParent;
      }
      baseParent = baseParent.parent();
    }
    return baseParent;
  }
  public move(degs: number | number[], base: number | HTMLElement | string = 1) {
    const baseParent =  base instanceof Bone ? base : this.parent(base);

    if (!baseParent) {
      return this;
    }
    const depth = this.state.depth;
    const divide = Math.min(depth - 2, depth - baseParent.state.depth - 1);
    let parent = this.parent();
    let deg;
    let deg2 = 0;

    if (typeof degs === "number") {
      deg = degs;
    } else {
      [deg, deg2 = 0] = degs;
    }
    this.rotate(deg + deg2);
    parent.rotate(divide < 1 ? -deg + deg2 : -2 * deg / divide);

    for (let i = 0 ; i < divide - 1; ++i) {
      parent = parent.parent();

      parent.rotate(-2 * deg / divide);
    }
    divide >= 1 && parent.parent().rotate(deg - deg2);

    return this;
  }
}
