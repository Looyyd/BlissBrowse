import {FilterResult} from "./content/filter";

export interface TrieNode {
  isEndOfWord: boolean;
  children: Map<string, TrieNode>;
}

export function isTrieNode(obj: unknown): obj is TrieNode {
  const asTrieNode = obj as Partial<TrieNode>;
  return (
    asTrieNode !== null &&
    typeof asTrieNode === 'object' &&
    typeof asTrieNode.isEndOfWord === 'boolean' &&
    asTrieNode.children instanceof Map
  );
}


export function isTrieInstance(object: unknown): object is Trie {
  return object instanceof Trie;
}


export class Trie {
  private root: TrieNode;

  constructor(words: string[]) {
    //TODO: wordsToFilter lowercase class to make sure only lowercase is passed
    this.root = { isEndOfWord: false, children: new Map() };
    this.buildTrie(words);
  }

  private buildTrie(words: string[]): void {
    for (const word of words) {
      this.addWord(word);
    }
  }
  // Add a new word to the Trie
  public addWord(word: string): void {
    let currentNode = this.root;
    for (const char of word.toLowerCase()) {
      if (!currentNode.children.has(char)) {
        currentNode.children.set(char, { isEndOfWord: false, children: new Map() });
      }
      currentNode = currentNode.children.get(char)!;
    }
    currentNode.isEndOfWord = true;
  }

  // Remove a word from the Trie
  public removeWord(word: string): void {
    const stack: { node: TrieNode, char: string }[] = [];
    let currentNode = this.root;
    for (const char of word.toLowerCase()) {
      if (!currentNode.children.has(char)) {
        return;  // Word not found in Trie
      }
      stack.push({ node: currentNode, char });
      currentNode = currentNode.children.get(char)!;
    }

    if (!currentNode.isEndOfWord) {
      return;  // Word not found as an exact match
    }

    // Mark as not the end of a word
    currentNode.isEndOfWord = false;

    // Remove the nodes that are no longer part of any words
    while (stack.length > 0) {
      const { node, char } = stack.pop()!;
      const childNode = node.children.get(char)!;
      if (childNode.isEndOfWord || childNode.children.size > 0) {
        break;
      }
      node.children.delete(char);
    }
  }

  public shouldFilterTextContent(textContent: string): FilterResult {
    const cleanedTextContent = textContent.toLowerCase().trim();
    const result: FilterResult = {
      shouldFilter: false,
    };
    let currentNode = this.root;
    let triggeringWord = '';

    for (const char of cleanedTextContent) {
      if (currentNode.children.has(char)) {
        triggeringWord += char;
        currentNode = currentNode.children.get(char)!;
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

  public generateWordList(): string[] {
    const wordList: string[] = [];
    this.generateWordListHelper(this.root, '', wordList);
    return wordList;
  }

  private generateWordListHelper(node: TrieNode, currentWord: string, wordList: string[]): void {
    if (node.isEndOfWord) {
      wordList.push(currentWord);
    }

    for (const [char, childNode] of node.children) {
      this.generateWordListHelper(childNode, currentWord + char, wordList);
    }
  }

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


}
