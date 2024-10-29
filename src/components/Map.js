import React, { useState, useEffect } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const zoom = 15;

export default function MapComponent({ origin, destination }) {
  return (
    <APIProvider
      apiKey={"AIzaSyCDuoGHrM9DLaWmtGeVn2BnBsC1BOLGGCo"}
      onLoad={() => console.log("Maps API has loaded.")}
    >
      <Map
        defaultZoom={zoom}
        defaultCenter={origin}
        mapId={"c3cb794006efeda"}
        style={mapContainerStyle}
      >
        <Directions origin={origin} destination={destination} />
        {/* IUNCOMMENT NING MARKERS IF GANAHAN MO CUSTOM COLOR MARKER */}

        {/* <AdvancedMarker key={"origin"} position={origin}>
          <Pin
            background={"#FBBC04"}
            glyphColor={"#000"}
            borderColor={"#000"}
          />
        </AdvancedMarker>
        <AdvancedMarker key={"destination"} position={destination}>
          <Pin
            background={"#FBBC04"}
            glyphColor={"#000"}
            borderColor={"#000"}
          />
        </AdvancedMarker> */}
      </Map>
    </APIProvider>
  );
}

const Directions = ({ origin, destination }) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");
  const [directionsService, setDirectionsService] = useState();
  const [directionsRenderer, setDirectionsRenderer] = useState();

  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!directionsRenderer || !directionsService) return;

    directionsService
      .route({
        origin: origin,
        destination: destination,
        travelMode: routesLibrary.TravelMode.DRIVING,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
      });
  }, [directionsService, directionsRenderer]);

  return null;
};
