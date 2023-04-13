export const scrollIntoViewWithOffset = (element, offset = 0) => {
  window.scrollTo({
    behavior: "smooth",
    top:
      element.getBoundingClientRect().top -
      document.body.getBoundingClientRect().top -
      offset,
  });
};

export const getCSSVariable = (element, variable) => {
  return getComputedStyle(element).getPropertyValue(`--${variable}`);
};
