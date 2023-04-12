import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  connect() {
    const template = document.getElementById("listing-template");

    let parent = document.createElement("div");
    parent.append(template.content.cloneNode(true));

    this.element.append(parent);
  }
}
