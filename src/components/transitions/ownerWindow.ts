import ownerDocument from "./ownerDocument";

export default function ownerWindow(node: Element) {
  const doc = ownerDocument(node);
  return doc.defaultView || window;
}
