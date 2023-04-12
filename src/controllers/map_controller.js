import "regenerator-runtime/runtime";

import { Controller } from "@hotwired/stimulus";
import { useIntersection, useMatchMedia } from "stimulus-use";

const scrollIntoViewWithOffset = (element, offset = 0) => {
  window.scrollTo({
    behavior: "smooth",
    top:
      element.getBoundingClientRect().top -
      document.body.getBoundingClientRect().top -
      offset,
  });
};


export default class extends Controller {
  static targets = ["map", "listing"];

  // TODO: Observe map height changes and add an offset to scrollIntoView


  // Only fires on initial load, for some reason
  isSmall() {
    console.log('is small?')
    this.isSmallAttr = true;
  }

  smallChanged({ matches }) {
    console.log('small changed', matches)
    this.isSmallAttr = matches;
    this.updateListings();
  }

  get zoomOnSelect() {
    return this.isSmallAttr ? true : false;
  }

  get mapPadding() {
    console.log("get mappadding", this.isSmallAttr);
    if (this.isSmallAttr) {
      return { top: 50, right: 50, bottom: 50, left: 50 };
    } else {
      return { top: 100, right: 200, bottom: 100, left: 200 };
    }
  }

  async connect() {
    this.mapHeight = this.mapTarget.offsetHeight;

    this.imageResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          this.mapHeight = entry.contentBoxSize[0].blockSize;
        }
      }
    })
    this.imageResizeObserver.observe(this.mapTarget);

    useMatchMedia(this, {
      mediaQueries: {
        small: "(max-width: 45rem)",
      },
    });

    this.annotationColor = getComputedStyle(this.element).getPropertyValue("--annotation-color");
    console.log('annotation color', this.annotationColor)
    const tokenID = 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Iko1RlpZMjhRR00ifQ.eyJpc3MiOiI0TVQ5SEZWTjhFIiwiaWF0IjoxNjgxMzI1ODk2LCJleHAiOjE3MTI4ODAwMDB9.CioSplbh1y9kBLZ-WV-krgeEkz9pj40KrNsTXxX-UE3UupzNCNQp4AfqmXeeSFwvoHj8jMfDvGX0nmhwilFOSQ';

    if (!window.mapkit || window.mapkit.loadedLibraries.length === 0) {
      await new Promise(resolve => { window.initMapKit = resolve });
      delete window.initMapKit;
    }

    mapkit.init({
      authorizationCallback: function(done) {
        done(tokenId);
      }
    });

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
    });

    // this.map.addEventListener('select', (e) => {
    //   console.log('map-level select event', e)
    // });
    
    this.listings = [];

    this.listingTargets.forEach((element, index) => {
      const coords = new mapkit.Coordinate(parseFloat(element.dataset.lat), parseFloat(element.dataset.lng));
      const annotation = new mapkit.MarkerAnnotation(coords, {
        color: this.annotationColor || null
      });

      annotation.addEventListener('select', (e) =>  {
        if (e.target.enabled) {
          // If the selection was made by user interaction
          // element.scrollIntoView({ behavior: "smooth" });
          scrollIntoViewWithOffset(element, this.mapHeight);
        } else {
          // If the selection was made by scrolling to a listing
          e.target.enabled = true;
        }
        
        console.log('zoom on select?', this.zoomOnSelect)
        if (this.zoomOnSelect) this.map.setCenterAnimated(e.target.coordinate)

      });

      this.listings.push(annotation);
      element.dataset.listingIndex = index;

      useIntersection(this, { element, rootMargin: '-25% 0px -25% 0px' });
    });

    
    this.updateListings();
  }
  
  updateListings() {
    console.log('current map padding', this.mapPadding);
    this.map.showItems(this.listings, {
      animate: true,
      padding: new mapkit.Padding(this.mapPadding),
    });
  }

  // When a listing is scrolled into view
  appear(e) {
    const annotation = this.listings[e.target.dataset.listingIndex];
    annotation.enabled = false;
    annotation.selected = true;
    annotation.title = e.target.dataset.title; 
  }

  // When a listing is scrolled out of view
  disappear(e) {
    const annotation = this.listings[e.target.dataset.listingIndex];

    annotation.enabled = true;
    annotation.selected = false;
    annotation.title = null;
  }
}
