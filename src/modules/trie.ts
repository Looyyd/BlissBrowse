import {FilterResult} from "./content/filter";

export interface TrieNode {
  isEndOfWord: boolean;
  children: { [key: string]: TrieNode  };
}

export function isTrieNode(obj: unknown): obj is TrieNode {
  const asTrieNode = obj as Partial<TrieNode>;
  if (
    asTrieNode === null ||
    typeof asTrieNode !== 'object' ||
    typeof asTrieNode.isEndOfWord !== 'boolean' ||
    !asTrieNode.children ||
    typeof asTrieNode.children !== 'object'
  ) {
    return false;
  }

  return Object.values(asTrieNode.children).every(
    child =>  isTrieNode(child)
  );
}


export function isTrieInstance(object: unknown): object is Trie {
  return object instanceof Trie;
}


export class Trie {
  private root: TrieNode;

  setRoot(root: TrieNode): void {
    this.root = root;
  }

  getRoot(): TrieNode {
    return this.root;
  }

  constructor(wordsOrRoot: string[] | TrieNode) {
    if (Array.isArray(wordsOrRoot)) {
      // It's an array of strings
      this.root = { isEndOfWord: false, children: {} };
      this.buildTrie(wordsOrRoot);
    } else {
      // It's a TrieNode
      this.root = wordsOrRoot;
    }
  }

  private buildTrie(words: string[]): void {
    for (const word of words) {
      this.addWord(word);
    }
  }
  // Add a new word to the Trie
  public addWord(word: string): void {
    // does not add whitespace words
    if(word.trim() === '') return;

    let currentNode = this.root;
    for (const char of word.toLowerCase()) {
      if (!currentNode.children[char]) {
        currentNode.children[char] = { isEndOfWord: false, children: {} };
      }
      currentNode = currentNode.children[char];
    }
    currentNode.isEndOfWord = true;
  }


  public removeWord(word: string): void {
    const stack: { node: TrieNode, char: string }[] = [];
    let currentNode = this.root;
    for (const char of word.toLowerCase()) {
      if (!currentNode.children[char]) {
        return;  // Word not found in Trie
      }
      stack.push({ node: currentNode, char });
      currentNode = currentNode.children[char];
    }

    if (!currentNode.isEndOfWord) {
      return;  // Word not found as an exact match
    }

    // Mark as not the end of a word
    currentNode.isEndOfWord = false;

    // Remove the nodes that are no longer part of any words
    while (stack.length > 0) {
      const { node, char } = stack.pop()!;
      const childNode = node.children[char];
      if (childNode.isEndOfWord || Object.keys(childNode.children).length > 0) {
        break;
      }
      delete node.children[char];
    }
  }

  public wordExists(word: string): boolean {
    let currentNode = this.root;
    for (const char of word.toLowerCase()) {
      if (!currentNode.children[char]) {
        return false;
      }
      currentNode = currentNode.children[char];
    }
    return currentNode.isEndOfWord;
  }

  /*
  public shouldFilterTextContent(textContent: string): FilterResult {
    const cleanedTextContent = textContent.toLowerCase().trim();
    const result: FilterResult = {
      shouldFilter: false,
    };
    let currentNode = this.root;
    let triggeringWord = '';

    for (const char of cleanedTextContent) {
      if (currentNode.children[char]) {
        triggeringWord += char;
        currentNode = currentNode.children[char];
        if (currentNode.isEndOfWord) {
          result.shouldFilter = true;
          result.triggeringWord = triggeringWord;
          return result;
        }
      } else {
        triggeringWord = '';
        currentNode = this.root;
      }
    }
    return result;
  }
   */

  public shouldFilterTextContent(textContent: string): FilterResult {
    function boundaryChecker(c: string): boolean {
      // This regex checks for any non-alphanumeric character including underscores.
      // It effectively treats punctuation, spaces, and special characters as boundaries.
      //return /[^a-zA-Z0-9]/.test(c);
      // This regex uses Unicode property escapes to match any character that is not a letter or number in any language.
      // You need to use the 'u' flag with the regular expression to enable Unicode mode.
      return /[^\p{L}\p{N}]/u.test(c);
    }

    const cleanedTextContent = textContent.toLowerCase().trim();
    const result: FilterResult = {
      shouldFilter: false,
    };
    let currentNode = this.root;
    let triggeringWord = '';
    let earliestBoundaryInTriggeringWord = -1;

    for (let i = 0; i < cleanedTextContent.length; i++) {
      const char = cleanedTextContent[i];
      const currentIsBoundary = boundaryChecker(char);

      if (currentNode.children[char]) {
        if (currentIsBoundary && earliestBoundaryInTriggeringWord === -1) {
          earliestBoundaryInTriggeringWord = i;  // Set the earliest boundary in the triggering word
        }
        triggeringWord += char;
        currentNode = currentNode.children[char];
        if (currentNode.isEndOfWord) {
          // Check if the end of the word is a boundary or end of the text
          const nextCharIsBoundary = i === cleanedTextContent.length - 1 || boundaryChecker(cleanedTextContent[i + 1]);
          if (nextCharIsBoundary) {
            result.shouldFilter = true;
            result.triggeringWord = triggeringWord;
            return result;
          }
        }
      } else {
        if (earliestBoundaryInTriggeringWord !== -1) {
          i = earliestBoundaryInTriggeringWord;
        }
        else{
          //got to next boundary
          while(i < cleanedTextContent.length && !boundaryChecker(cleanedTextContent[i])){
            i++;
          }
        }
        triggeringWord = '';
        currentNode = this.root;
        earliestBoundaryInTriggeringWord = -1;
      }
    }

    return result;
  }


  public generateWordList(): string[] {
    const wordList: string[] = [];
    this.generateWordListHelper(this.root, '', wordList);
    return wordList;
  }

  private generateWordListHelper(node: TrieNode, currentWord: string, wordList: string[]): void {
    if (node.isEndOfWord) {
      wordList.push(currentWord);
    }

    for (const [char, childNode] of Object.entries(node.children)) {
      this.generateWordListHelper(childNode, currentWord + char, wordList);
    }
  }

  /*
  //dropped serialization because converting to string was too slow, storing an object is faster
  serialize(): string{
    return this.serializeNode(this.root);
  }

  private serializeNode(node: TrieNode): string {
    // Create a function that recursively builds the object representation of the node
    function buildObject(node: TrieNode): any{
      const obj: { isEndOfWord: boolean; children: Record<string, any> } = {
        isEndOfWord: node.isEndOfWord,
        children: {}
      };
      node.children.forEach((childNode, key) => {
        obj.children[key] = buildObject(childNode);
      });
      return obj;
    }

    // Create the object representation of the entire trie
    const trieObject = buildObject(node);

    // Serialize the object representation to a JSON string
    return JSON.stringify(trieObject);
  }

  static deserialize(serializedObject: string): Trie {
    const trie = new Trie([]);

    function buildNode(obj: any): TrieNode {
      const childrenMap = new Map<string, TrieNode>();
      if (obj.children) {
        Object.entries(obj.children).forEach(([key, childObj]) => {
          childrenMap.set(key, buildNode(childObj));
        });
      }

      const node: TrieNode = {
        isEndOfWord: obj.isEndOfWord,
        children: childrenMap
      };

      return node;
    }

    const rootObject = JSON.parse(serializedObject);
    trie.root = buildNode(rootObject);
    return trie;
  }

   */

}
