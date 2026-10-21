export interface Language {
  /** Value stored in the URL (`?lang=cpp`). */
  id: string;
  /** Label shown in the UI. */
  label: string;
  /** Value for GitHub's `language:` qualifier. */
  query: string;
}

export const LANGUAGES: readonly Language[] = [
  { id: 'typescript', label: 'TypeScript', query: 'typescript' },
  { id: 'javascript', label: 'JavaScript', query: 'javascript' },
  { id: 'python', label: 'Python', query: 'python' },
  { id: 'go', label: 'Go', query: 'go' },
  { id: 'rust', label: 'Rust', query: 'rust' },
  { id: 'java', label: 'Java', query: 'java' },
  // "C++" and "C#" contain characters that break the qualifier; GitHub accepts these aliases.
  { id: 'cpp', label: 'C++', query: 'cpp' },
  { id: 'csharp', label: 'C#', query: 'csharp' },
  { id: 'php', label: 'PHP', query: 'php' },
  { id: 'ruby', label: 'Ruby', query: 'ruby' },
  { id: 'swift', label: 'Swift', query: 'swift' },
  { id: 'kotlin', label: 'Kotlin', query: 'kotlin' },
];

export function findLanguage(id: string): Language | undefined {
  return LANGUAGES.find((language) => language.id === id);
}

/** Dot colours for languages that commonly appear in results (values follow GitHub's palette). */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Go: '#00add8',
  Rust: '#dea584',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  C: '#555555',
  PHP: '#4f5d95',
  Ruby: '#701516',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  Dart: '#00b4ab',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#663399',
  Vue: '#41b883',
  'Jupyter Notebook': '#da5b0b',
};

export function getLanguageColor(name: string): string {
  return LANGUAGE_COLORS[name] ?? '#8b949e';
}
