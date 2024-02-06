import web3 from "web3";

export function normalizedAddress(address: string) {
  return web3.utils.toChecksumAddress(address);
}

export function normalizeSize(size: number) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let index = 0;
  while (size >= 1024) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(2)} ${units[index]}`;
}

export function parseTime(
  time?: string | number | Date,
  format = "{y}-{m}-{d} {h}:{i}:{s}",
) {
  if (!time) return "";
  let date;
  if (typeof time === "object") {
    date = time;
  } else {
    if (typeof time === "string" && /^\d+$/.test(time)) {
      time = Number.parseInt(time);
    }
    if (typeof time === "number" && time.toString().length === 10) {
      time *= 1000;
    }
    date = new Date(time);
  }
  const formatObj: Record<string, number> = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay(),
  };
  const time_str = format.replace(/{([adhimsy])+}/g, (result, key) => {
    const value = formatObj[key];
    let valueStr = `${value}`;
    // Note: getDay() returns 0 on Sunday
    if (key === "a") {
      return ["日", "一", "二", "三", "四", "五", "六"][value];
    }
    if (result.length > 0 && value < 10) {
      valueStr = `0${value}`;
    }
    return valueStr;
  });
  return time_str;
}

export function cidAbbreviation(cid?: string) {
  if (cid) {
    return `${cid.slice(0, 8)}...${cid.slice(-10, cid.length)}`;
  }
}

export function addressAbbreviation(address?: string) {
  if (!address) return;
  return `${address.slice(0, 5)}...${address.slice(-3, address.length)}`;
}
