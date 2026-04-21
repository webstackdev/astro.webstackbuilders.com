export const queryWebMentionsIconMarkup = (params: {
  iconBankId: string
  iconName: 'background-broken' | 'heart-filled'
  root?: Document
}): string | null => {
  const { iconBankId, iconName, root = document } = params

  if (!iconBankId || !iconName) {
    return null
  }

  const iconBank = root.getElementById(iconBankId)
  if (!(iconBank instanceof HTMLDivElement)) {
    return null
  }

  const iconHost = iconBank.querySelector(`[data-webmentions-icon="${iconName}"]`)
  const markup = iconHost?.innerHTML.trim()
  return markup ? markup : null
}
