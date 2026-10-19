// Bots enviam strings aleatórias como "TYWkzwEaPiihDYwZWhpso": palavras longas com
// várias maiúsculas no meio. Nomes reais (inclusive em CAIXA ALTA) não têm esse padrão.
const isGibberishWord = (word) =>
  word.length >= 8 && /[a-z]/.test(word) && (word.slice(1).match(/[A-Z]/g) ?? []).length >= 3

export const isGibberish = (value) =>
  typeof value === 'string' && value.split(/[^A-Za-z]+/).some(isGibberishWord)

// Telefone precisa ter pelo menos 8 dígitos e nenhuma letra
export const isInvalidPhone = (value) =>
  typeof value === 'string' && value.trim() !== '' && (/[A-Za-z]/.test(value) || value.replace(/\D/g, '').length < 8)
