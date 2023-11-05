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

  constructor(words: string[]) {
    //TODO: wordsToFilter lowercase class to make sure only lowercase is passed
    this.root = { isEndOfWord: false, children: {} };
    this.buildTrie(words);
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
    const cleanedTextContent = textContent.toLowerCase().trim();
    const result: FilterResult = {
      shouldFilter: false,
    };
    let currentNode = this.root;
    let triggeringWord = '';
    let wordStartIndex = -1;

    for (let i = 0; i < cleanedTextContent.length; i++) {
      const char = cleanedTextContent[i];
      const isBoundary = i === 0 || /[\s,.;!?]/.test(cleanedTextContent[i - 1]);

      if (currentNode.children[char]) {
        if (triggeringWord === '' && isBoundary) {
          wordStartIndex = i;  // Set the start index when the first char of a word is found
        }
        triggeringWord += char;
        currentNode = currentNode.children[char];
        if (currentNode.isEndOfWord) {
          // Check if the end of the word is a boundary or end of the text
          const nextCharIsBoundary = i === cleanedTextContent.length - 1 || /[\s,.;!?]/.test(cleanedTextContent[i + 1]);
          if (wordStartIndex === 0 || nextCharIsBoundary) {
            result.shouldFilter = true;
            result.triggeringWord = triggeringWord;
            return result;
          }
        }
      } else {
        // Reset if the current sequence is not a word
        triggeringWord = '';
        currentNode = this.root;
        wordStartIndex = -1;
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
