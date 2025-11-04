export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Waypoint = {
  sequence: number;
  sub_locality: string;
  sub_locality_type: 'district' | 'barangay';
  street: string;
  destination: string[];
} & Coordinates;

export type Route = {
  route_code: string;
  name: string;
  waypoints: Waypoint[];
};

export type City = {
  country: 'Philippines';
  country_code: 'PH';
  island_group: 'Luzon' | 'Visayas' | 'Mindanao';
  region: string; // e.g., "Region VI"
  region_code: string; // e.g., "06"
  province: string;
  province_code: string; // e.g., "IL0"
  city: string;
  city_type: 'highly_urbanized_city' | 'component_city' | 'municipality';
  postal_code: string; // 4-digit PH ZIP
  routes: Route[];
} & Coordinates;
