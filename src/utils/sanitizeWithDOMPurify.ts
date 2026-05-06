import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

export const sanitizeWithDOMPurify = (data: any): any => {
  if (typeof data === "string") {
    return DOMPurify.sanitize(data);
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeWithDOMPurify);
  }

  if (typeof data === "object" && data !== null) {
    const obj: any = {};

    for (const key in data) {
      obj[key] = sanitizeWithDOMPurify(data[key]);
    }

    return obj;
  }

  return data;
};