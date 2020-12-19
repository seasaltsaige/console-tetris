interface Array<T> {
    rotate(n: number): any[];
}

Array.prototype.rotate = function (n: number): any[] {
    var len = this.length;
    return !(n % len) ? this.slice() : this.map((e, i, a) => a[(i + (len + n % len)) % len]);
};