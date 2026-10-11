document.documentElement.classList.add("js");

if (
  "PageRevealEvent" in window &&
  "startViewTransition" in document &&
  CSS.supports("view-transition-name: root")
) {
  document.documentElement.classList.add("view-transition-capable");
}
