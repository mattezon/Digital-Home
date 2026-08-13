// Единый способ показать имя пользователя:
// - showUsername = true  → показываем юзернейм
// - showUsername = false → показываем почту
export const getAuthorDisplayName = (author) => {
  if (!author) return 'Неизвестный'
  const email = author.email || ''
  if (author.showUsername) {
    return author.username || author.displayName || email.split('@')[0] || 'Неизвестный'
  }
  return email || 'Неизвестный'
}