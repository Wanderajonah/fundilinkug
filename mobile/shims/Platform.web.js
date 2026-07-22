const Platform = {
  OS: "web",
  Version: 1,
  isTesting: false,
  isTV: false,
  constants: {},
  select: (spec) => {
    if (!spec) return undefined;
    if (Object.prototype.hasOwnProperty.call(spec, "web")) return spec.web;
    if (Object.prototype.hasOwnProperty.call(spec, "default")) return spec.default;
    if (Object.prototype.hasOwnProperty.call(spec, "native")) return spec.native;
    return undefined;
  }
};

module.exports = Platform;
