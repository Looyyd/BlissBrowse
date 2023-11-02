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

export function getFeedlikeAncestor(node:Node) {
  const isElementNode = (n: Node): n is Element => n.nodeType === Node.ELEMENT_NODE;
  let chosenDomElement = node;
  let bestIndex = -1;  // Initialize to -1 to handle edge cases
  const rects = new Map<Element, DOMRect>();


  // Function to get all ancestors
  const getAncestors = (n:Node) => {
    const ancestors: Node[] = [];
    while (n.parentNode && n.parentNode !== document) {
      ancestors.push(n.parentNode);
      n = n.parentNode;
    }
    return ancestors;
  };

  const ancestors = getAncestors(node);
  const siblingsCount = ancestors.map((ancestor, index) => {
    if (!isElementNode(ancestor)) {
      return 0;
    }

    const myRect = rects.get(ancestor) ||ancestor.getBoundingClientRect();
    rects.set(ancestor, myRect);

    if (myRect.height === 0) {
      return 0;
    }
    if(ancestor.parentNode === null){
      return 0;
    }

    const matchingSiblings = Array.from(ancestor.parentNode.children).filter((sib) => {
      if (!isElementNode(sib) || sib === ancestor) {
        return false;
      }

      const sibRect = rects.get(sib) || sib.getBoundingClientRect();
      rects.set(sib, sibRect);
      const ancestorRect = rects.get(ancestor) || ancestor.getBoundingClientRect();
      rects.set(ancestor, ancestorRect);

      return isSimilar(ancestorRect, sibRect);
    });

    return matchingSiblings.length;
  });

  for (let i = 0; i < siblingsCount.length; i++) {
    if (siblingsCount[i] >= min_feed_neighbors) { // Replace min_feed_neighbors with your actual threshold
      bestIndex = i;
      break;
    }
  }

  if(DEBUG_PERFORMANCE) {
    console.log("getFeedLikeAncestor number of ancestors", ancestors.length);
    console.log("getFeedLikeAncestor chosen ancestor index", bestIndex);
  }

  if (bestIndex >= 0) {
    chosenDomElement = ancestors[bestIndex];
  } else if (DEBUG) {
    console.log('No suitable ancestor found.');
  }

  return chosenDomElement;
}