// Calculator.tsx
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import './Calculator.css';

import {
  GoogleMap,
  DrawingManager,
  Marker,
  useJsApiLoader,
} from '@react-google-maps/api';

// Import icons (ensure correct paths)
import { ReactComponent as AreaIcon } from './icons/area.svg';
import { ReactComponent as SunIcon } from './icons/sun.svg';
import { ReactComponent as CapacityIcon } from './icons/capacity.svg';
import { ReactComponent as EnergyIcon } from './icons/energy.svg';
import { FaSolarPanel, FaCompass } from 'react-icons/fa';

// Import SunCalc library
import SunCalc from 'suncalc';

// Import Firebase (ensure correct path)
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

// Import AuthContext (ensure correct path)
import { AuthContext } from '../../AuthContext';

// Define the Google Maps API key and libraries
const googleMapsApiKey = 'AIzaSyDusy8WBjxI0W_S0EOsMuyTthLv8owJDDA'; // <-- Replace with your actual API key

const libraries: (
  | 'drawing'
  | 'geometry'
  | 'places'
  | 'visualization'
)[] = ['drawing', 'geometry', 'places'];

const Calculator: React.FC = () => {
  // Access the user from AuthContext
  const { user } = useContext(AuthContext);
  const userId = user ? user.uid : null;

  // State variables
  const [areaResult, setAreaResult] = useState<number>(0);
  const [irradianceResult, setIrradianceResult] = useState<number>(0);
  const [capacityResult, setCapacityResult] = useState<number>(0);
  const [dailyEnergyResult, setDailyEnergyResult] = useState<number>(0);
  const [tiltAngleResult, setTiltAngleResult] = useState<number>(0);
  const [sunPosition, setSunPosition] = useState<{
    azimuth: number;
    elevation: number;
  } | null>(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 28.6139,
    lng: 77.209,
  }); // Default center: New Delhi, India
  const [markerPosition, setMarkerPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [drawingManagerRef, setDrawingManagerRef] =
    useState<google.maps.drawing.DrawingManager | null>(null);
  const [selectedPolygon, setSelectedPolygon] =
    useState<google.maps.Polygon | null>(null);

  // Scroll to the top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load the Google Maps script
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey, // Your actual API key
    libraries, // Required libraries
  });

  // Memoize map options to prevent unnecessary re-renders
  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', stylers: [{ color: '#aadaff' }] },
      ],
      disableDefaultUI: false, // Enable default UI controls
      fullscreenControl: true,
      zoomControl: true,
      mapTypeControl: true, // Enable map type control
      streetViewControl: false,
    }),
    []
  );

  // Handle map load event
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // DrawingManager options
  const drawingManagerOptions = useMemo<
    google.maps.drawing.DrawingManagerOptions
  >(() => {
    if (!isLoaded || !window.google) {
      return {
        drawingControl: false, // Disable controls if not loaded
      };
    }
    return {
      drawingControl: true,
      drawingControlOptions: {
        position: window.google.maps.ControlPosition.TOP_CENTER, // Position of controls
        drawingModes: [window.google.maps.drawing.OverlayType.POLYGON], // Allow only polygons
      },
      polygonOptions: {
        editable: true,
        draggable: true,
      },
    };
  }, [isLoaded]);

  // Function to calculate the centroid of a polygon
  const getPolygonCentroid = (
    polygon: google.maps.Polygon
  ): google.maps.LatLng | null => {
    const path = polygon.getPath();
    let latSum = 0;
    let lngSum = 0;
    const numPoints = path.getLength();
    for (let i = 0; i < numPoints; i++) {
      const point = path.getAt(i);
      latSum += point.lat();
      lngSum += point.lng();
    }
    return new google.maps.LatLng(latSum / numPoints, lngSum / numPoints);
  };

  // Function to calculate optimal tilt angle based on latitude
  const calculateOptimalTiltAngle = (latitude: number): number => {
    // Simple formula: Optimal tilt angle ≈ Latitude
    return Math.abs(latitude);
  };

  // Function to calculate sun position using SunCalc
  const calculateSunPosition = (
    latitude: number,
    longitude: number
  ): {
    azimuth: number;
    elevation: number;
  } => {
    const now = new Date();
    const position = SunCalc.getPosition(now, latitude, longitude);

    // Convert azimuth and elevation from radians to degrees
    const azimuth = (position.azimuth * 180) / Math.PI + 180;
    const elevation = (position.altitude * 180) / Math.PI;

    return {
      azimuth,
      elevation,
    };
  };

  // Function to fetch solar irradiance data from NASA's API
  const getSolarIrradiance = async (
    latitude: number,
    longitude: number
  ): Promise<number> => {
    const parameters = 'ALLSKY_SFC_SW_DWN'; // Solar irradiance parameter
    const apiUrl = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=${parameters}&community=RE&longitude=${longitude}&latitude=${latitude}&format=JSON`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      // Extract monthly irradiance data
      const monthlyData = data.properties.parameter.ALLSKY_SFC_SW_DWN;
      let totalIrradiance = 0;
      let months = 0;
      for (let month in monthlyData) {
        totalIrradiance += monthlyData[month];
        months++;
      }
      const averageIrradiance = totalIrradiance / months;
      return averageIrradiance; // Units: kWh/m²/day
    } catch (error) {
      console.error('Error fetching irradiance data:', error);
      return 0;
    }
  };

  // Function to calculate solar system capacity and related metrics
  const calculateSolarCapacity = useCallback(
    async (area: number, polygon: google.maps.Polygon) => {
      const centroid = getPolygonCentroid(polygon);
      if (!centroid) return;

      const latitude = centroid.lat();
      const longitude = centroid.lng();

      // Fetch solar irradiance data
      const irradiance = await getSolarIrradiance(latitude, longitude);
      setIrradianceResult(irradiance);

      const panelEfficiency = 0.18; // 18% efficiency
      const coverageRatio = 0.8; // 80% coverage

      const totalPanelArea = area * coverageRatio; // Total panel area in m²

      // Calculate system capacity in kW
      const standardIrradiance = 1000; // W/m²
      const systemCapacityKW =
        (totalPanelArea * panelEfficiency * standardIrradiance) / 1000; // Convert W to kW
      setCapacityResult(systemCapacityKW);

      // Calculate daily energy production in kWh/day
      const dailyEnergyProduction = systemCapacityKW * irradiance;
      setDailyEnergyResult(dailyEnergyProduction);

      // Calculate optimal tilt angle
      const tiltAngle = calculateOptimalTiltAngle(latitude);
      setTiltAngleResult(tiltAngle);

      // Calculate sun position
      const sunPos = calculateSunPosition(latitude, longitude);
      setSunPosition(sunPos);

      // Save data to Firebase if user is authenticated
      if (userId) {
        const solarData = {
          area: area,
          irradiance: irradiance,
          capacity: systemCapacityKW,
          dailyEnergy: dailyEnergyProduction,
          tiltAngle: tiltAngle,
          sunPosition: sunPos,
          timestamp: new Date().toISOString(),
        };

        try {
          // Reference to the user's calculations subcollection
          const calculationsRef = collection(
            db,
            'users',
            userId,
            'calculations'
          );
          await addDoc(calculationsRef, solarData);
          console.log('Solar data saved successfully.');
        } catch (error) {
          console.error('Error saving solar data:', error);
          alert('Failed to save your calculation. Please try again.');
        }
      } else {
        // Prompt user to log in
        console.log('User not logged in. Cannot save solar data.');
        alert('Please log in to save your calculations.');
      }
    },
    [userId]
  );

  // Function to calculate area of the drawn polygon
  const calculateArea = useCallback(
    async (polygon: google.maps.Polygon) => {
      const area = google.maps.geometry.spherical.computeArea(
        polygon.getPath()
      );
      setAreaResult(area);

      // Calculate solar capacity based on the area
      await calculateSolarCapacity(area, polygon);
    },
    [calculateSolarCapacity]
  );

  // Function to add event listeners to the polygon for real-time updates
  const addPolygonListeners = useCallback(
    (polygon: google.maps.Polygon) => {
      polygon
        .getPath()
        .addListener('set_at', () => calculateArea(polygon));
      polygon
        .getPath()
        .addListener('insert_at', () => calculateArea(polygon));
      polygon.addListener('dragend', () => calculateArea(polygon));
    },
    [calculateArea]
  );

  // Handler for when a polygon is completed
  const onPolygonComplete = useCallback(
    (polygon: google.maps.Polygon) => {
      if (selectedPolygon) {
        selectedPolygon.setMap(null); // Remove the previous polygon
      }
      setSelectedPolygon(polygon);
      calculateArea(polygon);
      addPolygonListeners(polygon);

      // Exit drawing mode
      if (drawingManagerRef) {
        drawingManagerRef.setDrawingMode(null);
      }
    },
    [selectedPolygon, calculateArea, addPolygonListeners, drawingManagerRef]
  );

  // Function to geocode an address and center the map
  const geocodeAddress = () => {
    const addressInput = document.getElementById(
      'location-input'
    ) as HTMLInputElement;
    const address = addressInput.value;

    if (!address) {
      alert('Please enter a location.');
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: address }, (results, status) => {
      if (status === 'OK' && results) {
        const location = results[0].geometry.location;

        setMapCenter(location.toJSON());
        setMarkerPosition(location.toJSON());

        // Pan to the searched location
        if (mapRef.current) {
          mapRef.current.panTo(location);

          // Start smooth zoom
          const currentZoom = mapRef.current.getZoom() || 2;
          const targetZoom = 20; // Desired zoom level
          smoothZoom(mapRef.current, targetZoom, currentZoom);
        }
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  };

  // Function to perform smooth zooming
  const smoothZoom = (
    map: google.maps.Map,
    targetZoom: number,
    currentZoom: number
  ) => {
    if (currentZoom >= targetZoom) {
      return;
    } else {
      google.maps.event.addListenerOnce(map, 'zoom_changed', () => {
        smoothZoom(map, targetZoom, currentZoom + 1);
      });
      setTimeout(() => {
        map.setZoom(currentZoom);
      }, 80); // Adjust the delay for smoother or faster zoom
    }
  };

  // Handle loading errors
  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  // Render loading state
  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  return (
    <div className="calculator-page">
      {/* Hero Section */}
      <section className="calculator-hero-section">
        <div className="calculator-container calculator-animate-fade-in-up">
          <h1 className="calculator-hero-title">Power Your World</h1>
          <p className="calculator-hero-subtitle">
            Transform your rooftop into a sustainable energy powerhouse with our
            cutting-edge solar solutions.
          </p>
        </div>
        <div className="calculator-hero-image-container calculator-animate-fade-in-up calculator-delay-300">
          <img
            src="/images/solar-panel-hero.jpg"
            alt="Solar panels on a modern house"
            className="calculator-hero-image"
          />
        </div>
        <div className="calculator-search-container calculator-animate-fade-in-up calculator-delay-600">
          <div className="calculator-search-box">
            <input
              id="location-input"
              type="text"
              placeholder="Enter your location"
              className="calculator-search-input"
            />
            <button
              id="search-btn"
              className="calculator-search-button"
              onClick={geocodeAddress}
            >
              Calculate
            </button>
          </div>
        </div>
        <div className="calculator-chevron-container calculator-animate-fade-in calculator-delay-1000">
          {/* ChevronDownIcon */}
          <svg
            className="calculator-chevron-icon calculator-animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M6 9l6 6 6-6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      {/* Map Section */}
      <section className="calculator-map-section">
        <div className="calculator-map-container">
          <h2 className="calculator-section-title">
            Visualize Your Solar Potential
          </h2>
          <div className="calculator-map-wrapper">
            {/* Map Container */}
            <GoogleMap
              id="map"
              mapContainerClassName="calculator-map"
              center={mapCenter}
              zoom={5}
              onLoad={onMapLoad}
              options={mapOptions} // Use memoized options
            >
              {markerPosition && <Marker position={markerPosition} />}
              {/* DrawingManager */}
              <DrawingManager
                onLoad={(drawingManager) => setDrawingManagerRef(drawingManager)}
                onPolygonComplete={onPolygonComplete}
                options={drawingManagerOptions}
              />
            </GoogleMap>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="calculator-results-section">
        <div className="calculator-results-container">
          <h2 className="calculator-section-title">
            Your Solar System Snapshot
          </h2>
          <div className="calculator-cards-grid">
            {/* First Card (Area) */}
            <div className="calculator-card">
              <div className="calculator-card-content">
                <AreaIcon className="calculator-card-icon" />
                <h3 className="calculator-card-title">Roof Area</h3>
                <p id="area-result" className="calculator-card-value">
                  {areaResult.toFixed(2)} m²
                </p>
              </div>
            </div>
            {/* Second Card (Irradiance) */}
            <div className="calculator-card">
              <div className="calculator-card-content">
                <SunIcon className="calculator-card-icon" />
                <h3 className="calculator-card-title">Solar Irradiance</h3>
                <p id="irradiance-result" className="calculator-card-value">
                  {irradianceResult.toFixed(2)} kWh/m²/day
                </p>
              </div>
            </div>
            {/* Third Card (System Capacity) */}
            <div className="calculator-card">
              <div className="calculator-card-content">
                <CapacityIcon className="calculator-card-icon" />
                <h3 className="calculator-card-title">System Capacity</h3>
                <p id="capacity-result" className="calculator-card-value">
                  {capacityResult.toFixed(2)} kW
                </p>
              </div>
            </div>
            {/* Fourth Card (Daily Energy Production) */}
            <div className="calculator-card">
              <div className="calculator-card-content">
                <EnergyIcon className="calculator-card-icon" />
                <h3 className="calculator-card-title">
                  Daily Energy Production
                </h3>
                <p id="daily-energy-result" className="calculator-card-value">
                  {dailyEnergyResult.toFixed(2)} kWh/day
                </p>
              </div>
            </div>
            {/* Fifth Card (Optimal Tilt Angle) */}
            <div className="calculator-card">
              <div className="calculator-card-content">
                <FaSolarPanel className="calculator-card-icon" />
                <h3 className="calculator-card-title">Optimal Tilt Angle</h3>
                <p id="tilt-angle-result" className="calculator-card-value">
                  {tiltAngleResult.toFixed(2)}°
                </p>
              </div>
            </div>
            {/* Sixth Card (Sun Position) */}
            <div className="calculator-card">
              <div className="calculator-card-content">
                <FaCompass className="calculator-card-icon" />
                <h3 className="calculator-card-title">Sun Position</h3>
                {sunPosition ? (
                  <p id="sun-position-result" className="calculator-card-value">
                    Azimuth: {sunPosition.azimuth.toFixed(2)}°, Elevation:{' '}
                    {sunPosition.elevation.toFixed(2)}°
                  </p>
                ) : (
                  <p id="sun-position-result" className="calculator-card-value">
                    Calculating...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Steps Section */}
      <section className="calculator-next-steps-section">
        <div className="calculator-next-steps-container">
          <h2 className="calculator-next-steps-title">
            Ready to Embrace Solar?
          </h2>
          <p className="calculator-next-steps-text">
            Join thousands of homeowners who have already made the switch to
            clean, renewable energy.
          </p>
          <a href="/energy-estimation">
            <button className="calculator-next-steps-button">
              Let's calculate 🎉
            </button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default Calculator;
