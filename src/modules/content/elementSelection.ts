import $ from "jquery";
import {DEBUG} from "../../constants";

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

export function getFeedlikeAncestor(node: Node): Node {
  let chosen_dom_element;
  const parents = $(node).add($(node).parents());
  const sibling_counts = parents.map(function (index, elem) {
    if (!(elem instanceof Element)) {
      return 0;
    }
    const myRect = elem.getBoundingClientRect();

    // Ignore elements with zero height.
    if (myRect.height == 0) {
      return 0;
    }

    const matching_siblings = $(elem)
      .siblings()
      .filter(function (index, sib) {
        if (sib.nodeType != Node.ELEMENT_NODE) {
          return false;
        }
        const sibRect = sib.getBoundingClientRect();
        return isSimilar(myRect, sibRect);//is similar helps on youtube to avoir hiding everythin
      });
    return matching_siblings.length;
  });

  let best_index = 0;

  // Note, parents were ordered by document order
  //TODO: better logic for best index? maybe put into a function?
  for (let i = 0; i < sibling_counts.length - 1; i++) {
    if (sibling_counts[i] >= min_feed_neighbors) {
      best_index = i;
    }
  }
  if (best_index < 0 || best_index === 0) {
    if (DEBUG) {
      console.log('Uh oh: best_index < 0 or best_index is the node itself');
    }
    chosen_dom_element = node;
  } else {
    chosen_dom_element = parents[best_index];
  }
  return $(chosen_dom_element)[0];
}