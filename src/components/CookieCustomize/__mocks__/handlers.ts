export const showCookieCustomizeModal = () => {
  console.log(`in Customize Cookies mock`)

  const newDiv = document.createElement('div')
  const newContent = document.createTextNode('MOCK_CUSTOMIZE_HANDLER')
  newDiv.appendChild(newContent)
  document.querySelector(`body`)!.appendChild(newDiv)
}