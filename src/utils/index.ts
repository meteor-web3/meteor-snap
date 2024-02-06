export const deepFind = (
  obj: object,
  key: string,
  predicate?: (value: any) => boolean,
) => {
  let result = undefined;
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; i++) {
      if (obj[i] instanceof Object || obj[i] instanceof Array) {
        result = deepFind(obj[i], key, predicate);
      }
      if (result !== undefined) {
        return result;
      }
    }
  } else if (obj instanceof Object) {
    for (const prop in obj) {
      if (prop === key) {
        if (!predicate || predicate?.(obj[prop])) {
          return obj[prop];
        }
      }
      if (obj[prop] instanceof Object || obj[prop] instanceof Array) {
        result = deepFind(obj[prop], key, predicate);
        if (result !== undefined) {
          return result;
        }
      }
    }
  }
  return result;
};
