import { describe, it, expect } from "vitest";

import { Vector } from "./index.ts";

describe("Vector", () => {
  it("create() should create a vector with correct components", () => {
    const v = Vector.create(1, 2, 3);
    expect(v.toArray()).toEqual([1, 2, 3]);
  });

  it("RIGHT, LEFT, DOWN, UP should return correct vectors", () => {
    expect(Vector.RIGHT.toArray()).toEqual([1, 0]);
    expect(Vector.LEFT.toArray()).toEqual([-1, 0]);
    expect(Vector.DOWN.toArray()).toEqual([0, 1]);
    expect(Vector.UP.toArray()).toEqual([0, -1]);
  });

  it("fill(), zero(), one() should fill vectors correctly", () => {
    expect(Vector.fill(3, 7).toArray()).toEqual([7, 7, 7]);
    expect(Vector.zero(2).toArray()).toEqual([0, 0]);
    expect(Vector.one(4).toArray()).toEqual([1, 1, 1, 1]);
  });

  it("randomNormalised() should return a normalised vector", () => {
    const v = Vector.randomNormalised(3);
    const mag = v.getMagnitude();
    expect(Math.abs(mag - 1)).toBeLessThan(1e-10);
  });

  it("parseString() should parse valid strings and return undefined for invalid", () => {
    expect(Vector.parseString("Vector3D[1,2,3]")?.toArray()).toEqual([1, 2, 3]);
    expect(Vector.parseString("Vector2D[4,5]")?.toArray()).toEqual([4, 5]);
    expect(Vector.parseString("bad string")).toBeUndefined();
  });

  it("toString() should format correctly", () => {
    const v = Vector.create(1.23456, 2.34567);
    expect(v.toString(2)).toBe("Vector<2>[1.23, 2.35]");
  });

  it("pow(), add(), sub(), multiply(), divide(), mod(), positiveMod() should operate correctly", () => {
    expect(Vector.create(2, 3).pow(2).toArray()).toEqual([4, 9]);
    expect(Vector.create(1, 2).add(3).toArray()).toEqual([4, 5]);
    expect(Vector.create(5, 7).sub(2).toArray()).toEqual([3, 5]);
    expect(Vector.create(2, 3).multiply(4).toArray()).toEqual([8, 12]);
    expect(Vector.create(8, 9).divide(2).toArray()).toEqual([4, 4.5]);
    expect(Vector.create(7, 8).mod(3).toArray()).toEqual([1, 2]);
    expect(Vector.create(-7, 8).positiveMod(3).toArray()).toEqual([2, 2]);
  });

  it("lerp() should interpolate correctly", () => {
    const v = Vector.create(0, 0);
    v.lerp(0.5, Vector.create(2, 2));
    expect(v.toArray()).toEqual([1, 1]);
  });

  it("min() and max() should work", () => {
    expect(Vector.create(1, 5).min(Vector.create(3, 2)).toArray()).toEqual([
      1, 2,
    ]);
    expect(Vector.create(1, 5).max(Vector.create(3, 2)).toArray()).toEqual([
      3, 5,
    ]);
  });

  it("sum() should sum components", () => {
    expect(Vector.create(1, 2, 3).sum()).toBe(6);
  });

  it("abs(), floor(), ceil(), round() should work", () => {
    expect(Vector.create(-1.2, 2.7).abs().toArray()).toEqual([1.2, 2.7]);
    expect(Vector.create(1.7, 2.2).floor().toArray()).toEqual([1, 2]);
    expect(Vector.create(1.2, 2.8).ceil().toArray()).toEqual([2, 3]);
    expect(Vector.create(1.234, 2.567).round(1).toArray()).toEqual([1.2, 2.6]);
  });

  it("getMin() and getMax() should return correct values", () => {
    expect(Vector.create(1, 5, -2).getMin()).toBe(-2);
    expect(Vector.create(1, 5, -2).getMax()).toBe(5);
  });

  it("getSign() should return correct signs", () => {
    expect(Vector.create(-2, 0, 3).getSign().toArray()).toEqual([-1, 0, 1]);
  });

  it("dot() should compute dot product", () => {
    expect(Vector.create(1, 2, 3).dot(Vector.create(4, 5, 6))).toBe(32);
  });

  it("setHead() should set components", () => {
    const v = Vector.create(1, 2, 3);
    v.setHead(4, 5, 6);
    expect(v.toArray()).toEqual([4, 5, 6]);
  });

  it("getSquaredMagnitude() and getMagnitude() should work", () => {
    expect(Vector.create(3, 4).getSquaredMagnitude()).toBe(25);
    expect(Vector.create(3, 4).getMagnitude()).toBe(5);
  });

  it("sqrDistTo() and distTo() should work", () => {
    expect(Vector.create(1, 2).sqrDistTo(Vector.create(4, 6))).toBe(25);
    expect(Vector.create(1, 2).distTo(Vector.create(4, 6))).toBe(5);
  });

  it("setMagnitude(), getNorm(), normalise() should work", () => {
    const v = Vector.create(3, 4);
    v.setMagnitude(10);
    expect(v.getMagnitude()).toBeCloseTo(10);
    expect(Vector.create(3, 4).getNorm().getMagnitude()).toBeCloseTo(1);
    expect(Vector.create(3, 4).normalise().getMagnitude()).toBeCloseTo(1);
  });

  it("getAngle(), setAngle(), rotate() should work for Vector<2>", () => {
    const v = Vector.create(1, 0);
    expect(v.getAngle()).toBeCloseTo(0);
    v.setAngle(Math.PI / 2);
    expect(v.getAngle()).toBeCloseTo(Math.PI / 2);
    v.rotate(Vector.create(0, 0), Math.PI / 2);
    expect(v.getAngle()).toBeCloseTo(Math.PI);
  });

  it("crossProduct() should work for Vector<3>", () => {
    const a = Vector.create(1, 0, 0);
    const b = Vector.create(0, 1, 0);
    expect(a.crossProduct(b).toArray()).toEqual([0, 0, 1]);
  });

  it("copy() should duplicate the vector", () => {
    const v = Vector.create(1, 2, 3);
    const copy = v.copy();
    expect(copy.toArray()).toEqual([1, 2, 3]);
    expect(copy).not.toBe(v);
  });

  it("size(), x(), y(), z(), w(), valueOf() should work", () => {
    const v = Vector.create(1, 2, 3, 4);
    expect(v.size()).toBe(4);
    expect(v.x()).toBe(1);
    expect(v.y()).toBe(2);
    expect(v.z()).toBe(3);
    expect(v.w()).toBe(4);
    expect(v.valueOf(2)).toBe(3);
  });

  it("forEach(), map(), reduce(), every(), some() should work", () => {
    const v = Vector.create(1, 2, 3);
    const arr: number[] = [];
    v.forEach(x => arr.push(x * 2));
    expect(arr).toEqual([2, 4, 6]);
    expect(v.map(x => x + 1).toArray()).toEqual([2, 3, 4]);
    expect(v.reduce((a, b) => a + b, 0)).toBe(6);
    expect(v.every(x => x > 0)).toBe(true);
    expect(v.some(x => x === 2)).toBe(true);
  });

  it("toArray() and with() should work", () => {
    const v = Vector.create(1, 2, 3);
    expect(v.toArray()).toEqual([1, 2, 3]);
    expect(v.with(1, 9).toArray()).toEqual([1, 9, 3]);
  });

  it("isSize() should narrow type", () => {
    const v = Vector.create(1, 2, 3);
    expect(v.isSize(3)).toBe(true);
    expect(v.isSize(2)).toBe(false);
  });

  it("equals() should compare vectors and arrays", () => {
    const v = Vector.create(1, 2, 3);
    expect(v.equals(Vector.create(1, 2, 3))).toBe(true);
    expect(v.equals(1, 2, 3)).toBe(true);
    expect(v.equals(Vector.create(3, 2, 1))).toBe(false);
  });

  it("inBounds() should check bounds", () => {
    const v = Vector.create(2, 3);
    expect(v.inBounds(Vector.create(5, 5))).toBe(true);
    expect(v.inBounds(Vector.create(2, 2))).toBe(false);
    expect(v.inBounds(Vector.create(5, 5), Vector.create(2, 3))).toBe(true);
    expect(v.inBounds(Vector.create(5, 5), Vector.create(3, 3))).toBe(false);
  });

  it("should be iterable and have correct toStringTag", () => {
    const v = Vector.create(1, 2, 3);
    expect([...v]).toEqual([1, 2, 3]);
    expect(Object.prototype.toString.call(v)).toBe("[object Vector<3>]");
  });
});
