// Save the scroll position before the page is unloaded (for example, when refreshing)
window.onbeforeunload = function() {
  localStorage.setItem('scrollPosition', window.scrollY);
};

// When the page is loaded, restore the scroll position
window.onload = function() {
  const scrollPosition = localStorage.getItem('scrollPosition');
  if (scrollPosition) {
    window.scrollTo(0, scrollPosition); // Scroll to the saved position
  }
};
