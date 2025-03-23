// event.preventDefault() to prevent navigating away from here
// plus focus trap and set opaque on rest of site


export const openCity = (event: Event, cityName: string) => {
  // Get all elements with class="tabcontent" and hide them
  const tabcontent = document.getElementsByClassName('tabcontent') as HTMLCollectionOf<HTMLElement>
  const tabcontentArray = Array.from(tabcontent);
  tabcontentArray.forEach(tabcontent => {
    tabcontent.style.display = 'none'
  });

  // Get all elements with class="tablinks" and remove the class "active"
  const tablinks = document.getElementsByClassName('tablinks') as HTMLCollectionOf<HTMLElement>
  const tablinksArray = Array.from(tabcontent);
  tablinksArray.forEach(tablinks => {
    tablinks.className.replace(' active', '')
  });


  // Show the current tab, and add an "active" class to the button that opened the tab
  const currentTab = document.getElementById(cityName)
  if (currentTab) currentTab.style.display = 'block'

  const target = event.currentTarget as HTMLElement
  if (target) target.className += ' active'
}

/*
// Get the element with id="defaultOpen" and click on it to show the tab by default
document.getElementById('defaultOpen').click()
*/

export const showCookieCustomizeModal = () => {
  console.log(`implement showCookieCustomizeModal`)
}
