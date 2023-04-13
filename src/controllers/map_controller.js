import "regenerator-runtime/runtime";

import { Controller } from "@hotwired/stimulus";
import { initializeMapkit } from "../mapkit";
import { getCSSVariable } from "./utilities";

export default class extends Controller {
  static targets = ["map", "listing"];
  static values = {
    activeColorVar: { type: String, default: "annotation-color" },
    inactiveColorVar: { type: String, default: "annotation-color-inactive" },
  }

  async connect() {
    this.isConnected = false;

    this.observeMapHeight();
    this.observeViewport();
    this.observeListingIntersections();
    this.annotationColor = getCSSVariable(this.element, this.activeColorVarValue);

    await this.initializeMap();

    this.listings = [];
    this.listingTargets.forEach(this.addAnnotation.bind(this));

    // Helpful for grabbing test coordinates
    this.map.addEventListener("single-tap", (e) => {
      const test = this.map.convertPointOnPageToCoordinate(e.pointOnPage);
      console.log("map click", test);
    });

    this.updateListings();
    this.isConnected = true;
  }


  get zoomOnSelect() {
    return this.isMobile ? true : false;
  }

  get mapPadding() {
    if (this.isMobile) {
      return { top: 50, right: 50, bottom: 50, left: 50 };
    } else {
      return { top: 100, right: 100, bottom: 100, left: 100 };
    }
  }

  handleViewportChange(e) {
    this.isMobile = e.matches;
  }

  observeMapHeight() {
    this.mapHeight = this.mapTarget.offsetHeight;
    this.imageResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          this.mapHeight = entry.contentBoxSize[0].blockSize;
          this.element.style.setProperty('--map-height', `${this.mapHeight}px`);
        }
      }
    });
    this.imageResizeObserver.observe(this.mapTarget);
  }

  observeViewport() {
    this.mq = window.matchMedia("(max-width: 45rem)");
    this.mq.addEventListener("change", this.handleViewportChange.bind(this));
    this.isMobile = this.mq.matches;
  }

  observeListingIntersections() {
    this.listingObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const annotation = this.map.annotations.find(
          (a) => a.data.elementId === entry.target.id
        );
        if (entry.isIntersecting) {
          annotation.enabled = false;
          annotation.selected = true;
        } else {
          annotation.enabled = true;
          annotation.selected = false;
        }
      });
    }, {
      rootMargin: "-50% 0px -50% 0px"
    });
  }

  async initializeMap() {
    await initializeMapkit();

    if (!this.map) {
      this.map = new mapkit.Map(this.mapTarget, {
        // showsPointsOfInterest: false,
        pointOfInterestFilter: mapkit.PointOfInterestFilter.including([
          mapkit.PointOfInterestCategory.ATM,
          mapkit.PointOfInterestCategory.Park,
          mapkit.PointOfInterestCategory.PublicTransport,
          mapkit.PointOfInterestCategory.Parking,
          mapkit.PointOfInterestCategory.School,
        ]),
        showsMapTypeControl: false,
        showsZoomControl: false,
        showsScale: false,
      });
    }
  }

  addAnnotation(element) {
    const coords = new mapkit.Coordinate(
      parseFloat(element.dataset.lat),
      parseFloat(element.dataset.lng)
    );
    const annotation = new mapkit.MarkerAnnotation(coords, {
      color: this.annotationColor || null,
      data: {
        elementId: element.id
      }
    });

    annotation.addEventListener("select", (e) => {
      history.replaceState({}, document.title, '#' + e.target.data.elementId);
      if (e.target.enabled) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        e.target.enabled = true;
      }
      this.map.setCenterAnimated(e.target.coordinate);
    });

    this.listingObserver.observe(element);
    this.listings.push(annotation);
  }

  updateListings() {
    console.log("current map padding", this.mapPadding, this.listings);
    this.map.showItems(this.listings, {
      animate: true,
      padding: new mapkit.Padding(this.mapPadding),
    });
  }

  
}
