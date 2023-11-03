import {DEBUG, DEBUG_PERFORMANCE} from "../../constants";

const min_feed_neighbors = 3;

function isSimilar(my_rect: DOMRect, sib_rect: DOMRect) {
  //TODO: test if this logic can be improved or another functio nused
  const my_x = my_rect.left + my_rect.width / 2;
  const sib_x = sib_rect.left + sib_rect.width / 2;

  const my_y = my_rect.top + my_rect.height / 2;
  const sib_y = sib_rect.top + sib_rect.height / 2;

  const is_vertically_placed = Math.abs(my_y - sib_y) > Math.abs(my_x - sib_x);

  if (is_vertically_placed) {
    return sib_rect.height != 0 && my_rect.width == sib_rect.width;
  } else {
    return my_rect.height == sib_rect.height;
  }
}
export function getFeedlikeAncestor(node: Node): Element | null {
  const isElementNode = (n: Node): n is Element => n.nodeType === Node.ELEMENT_NODE;
  let chosenDomElement: Element | null = null;
  //TODO: put this map in global scope to get better performance boost?
  const rects = new Map<Element, DOMRect>();

  // Helper function to check for similar elements
  // Define isSimilar function or make sure it is defined elsewhere in your code

  // Function to get immediate parent if it's an element or null
  const getParentElement = (n: Node) => {
    return n.parentNode && isElementNode(n.parentNode) ? n.parentNode : null;
  };

  let ancestor = getParentElement(node);
  while (ancestor) {
    const myRect = rects.get(ancestor) || ancestor.getBoundingClientRect();
    rects.set(ancestor, myRect);

    if (myRect.height === 0) {
      ancestor = getParentElement(ancestor);
      continue;
    }

    const matchingSiblings = Array.from(ancestor.parentNode!.children).filter((sib) => {
      if (!isElementNode(sib) || sib === ancestor) {
        return false;
      }

      const sibRect = rects.get(sib) || sib.getBoundingClientRect();
      rects.set(sib, sibRect);
      return isSimilar(myRect, sibRect);
    });

    if (matchingSiblings.length >= min_feed_neighbors) { // Replace min_feed_neighbors with your actual threshold
      chosenDomElement = ancestor;
      break;
    }

    ancestor = getParentElement(ancestor);
  }

  if (chosenDomElement) {
    return chosenDomElement;
  } else if (DEBUG) {
    console.log('No suitable ancestor found.');
  }

  return null; // Return null if no suitable ancestor is found
}
