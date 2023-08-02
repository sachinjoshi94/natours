/* eslint-disable */
export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2FjaGluam9zaGkzNDkxIiwiYSI6ImNsam15bDB6YjFhdWUzZWsybnpoZ2F5ZnEifQ.I5vyrfJhDxbRWYghe7Jf0Q';
  var map = new mapboxgl.Map({
    container: 'map',
    // scrollZoom: false,
    style: 'mapbox://styles/sachinjoshi3491/cljn4ks8u00d701pjc8wf6ht1',
  });

  const bounds = new mapboxgl.LngLatBounds();
  for (let location of locations) {
    bounds.extend(location.coordinates);
    const el = document.createElement('div');
    el.className = 'marker';
    const [lng, lat] = location.coordinates;
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat({ lng, lat })
      .setPopup(
        new mapboxgl.Popup({ closeButton: false, offset: 10 }).setHTML(
          `<h3>Day ${location.day}: ${location.description}</h3>`
        )
      )
      .addTo(map);
  }

  // zoom and center properties will be overwritten when using bounds
  map.fitBounds(bounds, {
    padding: {
      top: 150,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
