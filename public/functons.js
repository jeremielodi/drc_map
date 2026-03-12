function loadProvincesGeoJson(map) {
     fetch('/api/provinces')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Erreur pendant le chargement du GeoJSON');
        }
        return response.json();
      })
      .then((data) => {
        geojsonLayer = L.geoJSON(data, {
          style: featureStyle,
          onEachFeature
        }).addTo(map);

        map.fitBounds(geojsonLayer.getBounds(), { padding: [10, 10] });
      })
      .catch((error) => {
        console.error(error);
        updateInfo('Erreur', 'Impossible de charger les provinces depuis l\'API.');
      });
}