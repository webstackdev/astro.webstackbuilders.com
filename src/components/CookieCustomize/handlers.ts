// event.preventDefault() to prevent navigating away from here
// plus focus trap and set opaque on rest of site


export const openCity = (evt: Event, cityName: string) => {
  // Declare all variables
  let tabcontent, tablinks
  let i


  // Get all elements with class="tabcontent" and hide them
  tabcontent = document.getElementsByClassName('tabcontent')
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = 'none'
  }

  // Get all elements with class="tablinks" and remove the class "active"
  tablinks = document.getElementsByClassName('tablinks')
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(' active', '')
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(cityName).style.display = 'block'
  evt.currentTarget.className += ' active'
}

/*
// Get the element with id="defaultOpen" and click on it to show the tab by default
document.getElementById('defaultOpen').click()
*/

export const showCookieCustomizeModal = () => {
  console.log(`implement showCookieCustomizeModal`)
}
