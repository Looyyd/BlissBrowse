import {Trie} from "../../src/modules/trie";

/*
describe('Trie Serialization and Deserialization', () => {

  test('Serialization of an empty Trie', () => {
    const trie = new Trie([]);
    const serialized = trie.serialize();
    expect(serialized).toBe('{"isEndOfWord":false,"children":{}}');
  });

  test('Deserialization of an empty Trie', () => {
    const serialized = '{"isEndOfWord":false,"children":{}}';
    const trie = Trie.deserialize(serialized);
    expect(trie.generateWordList()).toEqual([]);
  });

  test('Serialization and Deserialization of Trie with multiple words', () => {
    const words = ['apple', 'app', 'banana'];
    const trie = new Trie(words);
    const serialized = trie.serialize();
    const deserializedTrie = Trie.deserialize(serialized);
    expect(deserializedTrie.generateWordList().sort()).toEqual(words.sort());
  });

  test('Integrity of Trie after Serialization and Deserialization', () => {
    const words = ['cat', 'dog', 'mouse'];
    const trie = new Trie(words);
    const serialized = trie.serialize();
    const deserializedTrie = Trie.deserialize(serialized);
    words.forEach(word => {
      expect(deserializedTrie.shouldFilterTextContent(word)).toEqual({ shouldFilter: true, triggeringWord: word });
    });
  });

  test('Deserialization should throw error for invalid JSON', () => {
    const invalidJson = 'This is not valid JSON';
    expect(() => Trie.deserialize(invalidJson)).toThrow();
  });

  // Additional tests can be added to cover more scenarios
});
 */

describe('Trie word add logic', () => {
  test('Adding a word to an empty Trie', () => {
    const trie = new Trie([]);
    trie.addWord('apple');
    expect(trie.generateWordList()).toEqual(['apple']);
  });

  test('Adding whitespace word to an empty Trie', () => {
    const trie = new Trie([]);
    trie.addWord(' ');
    expect(trie.generateWordList()).toEqual([]);
  });
});

describe('Trie filter logic', () => {
  test("Word Present In Trie", () => {
    const trie = new Trie(['apple']);
    expect(trie.shouldFilterTextContent('apple')).toEqual({ shouldFilter: true, triggeringWord: 'apple' });
  });

  test("Unrelated Word with Partial Match Substring", () => {
    const trie = new Trie(['putin']);
    const filterResult = trie.shouldFilterTextContent('computing');
    expect(filterResult.shouldFilter).toEqual(false);
  });

  test("Unrelated Word with Partial Match Suffix", () => {
    const trie = new Trie(['hamas']);
    const filterResult = trie.shouldFilterTextContent('bahamas');
    expect(filterResult.shouldFilter).toEqual(false);
  });

  test("Unrelated Word with Partial Match Prefix", () => {
    const trie = new Trie(['hamas']);
    const filterResult = trie.shouldFilterTextContent('hamases');
    expect(filterResult.shouldFilter).toEqual(false);
  });

  test("Case Insensitivity", () => {
    const trie = new Trie(['apple']);
    expect(trie.shouldFilterTextContent('APPLE')).toEqual({ shouldFilter: true, triggeringWord: 'apple' });
  });

  test("Punctuation Adjacent to Trie Word", () => {
    const trie = new Trie(['apple']);
    const sentence = "I love apple, orange, and grapes";
    const filterResult = trie.shouldFilterTextContent(sentence);
    expect(filterResult.shouldFilter).toEqual(true);
  });

  test("Number adjacent to Trie Word", () => {
    const trie = new Trie(['apple']);
    const sentence = "apple123";
    const filterResult = trie.shouldFilterTextContent(sentence);
    expect(filterResult.shouldFilter).toEqual(false);//TODO: should this be true?
  });

  test("Can bactrack to find a word", () => {
    const trie2 = new Trie(["aa aa", "ab"]);
    const sentence2 = "aa ab";
    const filterResult2 = trie2.shouldFilterTextContent(sentence2);
    expect(filterResult2.shouldFilter).toEqual(true);
  });

});
