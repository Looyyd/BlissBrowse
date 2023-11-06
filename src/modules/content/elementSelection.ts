import {DEBUG, DEBUG_PERFORMANCE} from "../../constants";

const min_feed_neighbors = 3;

function hasSimilarBoundingBoxes(my_rect: DOMRect, sib_rect: DOMRect) {
  //TODO: test if this logic can be improved or another function used
  const areSizesSimilar = (size1: number, size2: number, threshold: number = 0.85): boolean => {
    /* Returns true if size1 is within threshold% of size2 */
    const lowerBound = size2 * threshold;
    const upperBound = size2 / threshold;
    return size1 >= lowerBound && size1 <= upperBound;
  }

  const my_x = my_rect.left + my_rect.width / 2;
  const sib_x = sib_rect.left + sib_rect.width / 2;

  const my_y = my_rect.top + my_rect.height / 2;
  const sib_y = sib_rect.top + sib_rect.height / 2;

  const is_vertically_placed = Math.abs(my_y - sib_y) > Math.abs(my_x - sib_x);

  if (is_vertically_placed) {
    return sib_rect.height !== 0 && areSizesSimilar(my_rect.width, sib_rect.width);
  } else {
    return sib_rect.width !== 0 && areSizesSimilar(my_rect.height, sib_rect.height);
  }
}


export function getFeedlikeAncestor(node: Node): Element | null {
  /* Returns a feed like ancestor of the given node, or the first ancestor if no feedlike is found.
  *  A Feed like ancestor is an ancestor that has at least min_feed_neighbors siblings with similar bounding boxes.
  * */
  const isElementNode = (n: Node): n is Element => n.nodeType === Node.ELEMENT_NODE;
  //TODO: put this map in global scope to get better performance boost?
  const rects = new Map<Element, DOMRect>();

  // Function to get immediate parent if it's an element or null
  const getParentElement = (n: Node) => {
    return n.parentNode && isElementNode(n.parentNode) ? n.parentNode : null;
  };

  let ancestor = getParentElement(node);
  const ancestors = [];
  const scores = [];

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

      return hasSimilarBoundingBoxes(myRect, sibRect);
    });

    scores.push(matchingSiblings.length);
    ancestors.push(ancestor);
    ancestor = getParentElement(ancestor);
  }

  if(ancestors.length === 0) {
    return null;
  }

  let bestScore = 0;
  let potentialAncestor = ancestors[0];
  for (let i = 0; i < ancestors.length; i++) {
    if (scores[i] >= min_feed_neighbors) {
      if(scores[i] > bestScore) {
        potentialAncestor = ancestors[i];
        bestScore = scores[i];
      }
    }
  }
  return potentialAncestor;
}

/*
//tests using other similarity functions
export function getFeedlikeAncestor(node: Node, min_feed_neighbors: number = 2): Element | null {
  // Function to check if two elements have the same classes
  const haveSameClasses = (elem1: Element, elem2: Element) => {
    // Check if both elements have classes; otherwise, return false
    if (elem1.classList.length === 0 || elem2.classList.length === 0) {
      return false;
    }
    const classList1 = elem1.classList;
    const classList2 = elem2.classList;
    return Array.from(classList1).every(cls => classList2.contains(cls));
  };

  const haveSameTag = (elem1: Element, elem2: Element) => {
    return elem1.tagName === elem2.tagName;
  }

  function calculateElementSimilarity(elem1: Element, elem2: Element): number {
    let score = 0;

    // Tag name similarity
    if (elem1.tagName === elem2.tagName) {
      score += 1; // Assign weight for tag name match
    }

    // Class similarity
    const commonClasses = Array.from(elem1.classList).filter(cls => elem2.classList.contains(cls));
    score += commonClasses.length; // Assign weight for each common class

    // Attribute similarity excluding class
    const attributes1 = elem1.getAttributeNames().filter(attr => attr !== 'class');
    const attributes2 = elem2.getAttributeNames().filter(attr => attr !== 'class');
    const commonAttributes = attributes1.filter(attr => attributes2.includes(attr) &&
      elem1.getAttribute(attr) === elem2.getAttribute(attr));
    score += commonAttributes.length; // Assign weight for each common attribute

    // Add more checks for structural position or content structure if needed

    return score;
  }

  function getSimilarityThreshold(): number {
    // Define and return the minimum score for elements to be considered similar
    // This would be based on your analysis of typical feed elements and their tags
    return 3; // Example threshold, this would need to be adjusted
  }

  const getSimilarityScore = (elem1: Element, elem2: Element): number => {
    //return calculateElementSimilarity(elem1, elem2) >= getSimilarityThreshold();
    //return haveSameTag(elem1, elem2);
    let score = 0;
    if(haveSameClasses(elem1, elem2)) {
      score += 1;
    }
    if(haveSameTag(elem1, elem2)) {
      score += 1;
    }
    return score;
  }

  const isElementNode = (n: Node): n is Element => n.nodeType === Node.ELEMENT_NODE;

  // Presume getSimilarityScore is a function you've defined to compare two elements
  // It should return a boolean indicating whether the elements are considered similar

  // Function to get immediate parent if it's an element or null
  const getParentElement = (n: Node): Element | null => {
    return n.parentNode && isElementNode(n.parentNode) ? n.parentNode : null;
  };

  let ancestor = getParentElement(node);
  const potentialAncestors: Element[] = [];
  const similarityScores: number[] = [];

  while (ancestor) {
    if (!isElementNode(ancestor)) {
      break; // No further valid ancestors to check
    }

    const siblings = Array.from(ancestor.parentNode!.children);
    let similarityScore = 0;

    siblings.forEach((sib) => {
      if (isElementNode(sib) && sib !== ancestor ) {
        //@ts-ignore
        similarityScore += getSimilarityScore(sib, ancestor); // Increment the score for each similar sibling
      }
    });

    // Push the ancestor and its similarity score to the respective arrays
    potentialAncestors.push(ancestor);
    similarityScores.push(similarityScore);

    ancestor = getParentElement(ancestor);
  }

  // Logic to decide which ancestor to return
  let bestScore = 0;
  let potentialAncestor = null;
  for (let i = 0; i < potentialAncestors.length; i++) {
    // Here you can apply your logic to decide if you should return this ancestor or not
    // For example, you might check if matchingSiblingsList[i].length meets a certain criterion
    // If so, you could return potentialAncestors[i];
    // This is a placeholder for your experimental logic
    if (similarityScores[i] >= min_feed_neighbors) {
      if(similarityScores[i] > bestScore) {
        potentialAncestor = potentialAncestors[i];
        bestScore = similarityScores[i];
      }
    }
  }

  // No suitable ancestor is found after applying your logic
  return potentialAncestor
}

 */



