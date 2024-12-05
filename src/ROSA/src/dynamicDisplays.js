export const PositionMorePopup = () => {

  const handleHover = (e) => {
    const moreLink = e.currentTarget;
    const popup = moreLink.querySelector('.more');
    if (popup) {
      // Get bounding rectangles
      const lRect = moreLink.getBoundingClientRect();
      const pRect = popup.getBoundingClientRect();
      const vWidth = window.innerWidth;

      // Center popup on 
      let newLeft = lRect.left + lRect.width / 2 - pRect.width / 2;

      // if offscreen or right, pin to side
      if (newLeft < 0) {
        newLeft = 0;
      } else if ((newLeft + pRect.width) > vWidth) {
        newLeft = vWidth - pRect.width;
      }
      // set the location
      popup.style.left = `${newLeft}px`;
    }
  };

  // Add mouse over listener for each .moreLink present upon function call.
  const moreLinks = document.querySelectorAll('.moreLink');
  moreLinks.forEach(link => {
    link.addEventListener('mouseover', handleHover);
  });

  // Clean up event listeners
  return () => {
    moreLinks.forEach(link => {
      link.removeEventListener('mouseover', handleHover);
    });
  };
};
