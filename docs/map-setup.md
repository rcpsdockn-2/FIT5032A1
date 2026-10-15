# Map search and driving directions

The directory search calls the independent Firebase function. Its matching places
are displayed as Leaflet map markers and a keyboard-accessible list. Changing the
category or suburb removes the previous results and route. No results means no
map markers; a failed request does not substitute browser data as a fake response.

Each fictional place has an approximate suburb-centre latitude and longitude in
`functions/data/places.js`. The table and function use this same dataset. These
coordinates are not real recycling facility addresses. Starting options in
`src/data/mapData.js` are also public suburb centres, not a user's current location.

## Try locally

1. Follow `docs/functions-setup.md` to install and start the Functions emulator.
2. Run `npm run dev` and open **Places & events**.
3. Choose **E-waste**, enter **Footscray**, and click **Search places**.
4. The map and list show **Westside Battery Point**. Click its marker or the
   **Show Westside Battery Point on map** button to select the destination.
5. Choose **Melbourne CBD** as the starting suburb, then **Get driving directions**.
6. A purple road route, green start marker, estimated distance/time and ordered
   instructions appear inside this page. This is not an external directions link
   or a straight-line distance calculation. It does not include live traffic.
7. Select **Footscray** as the start: the old route clears, and a new request reports
   that start and destination are the same without contacting the route provider.
8. Changing search to **Repair + Footscray** returns no matches and removes the map.

No account, map API key or geolocation permission is required. Local development
uses the Functions emulator; production uses the same-origin Hosting rewrite to
the deployed `searchPlaces` function. See `docs/deployment.md`. A frontend build
alone does not deploy the function.

## Services, privacy and limits

- Leaflet 1.9.4 is a project dependency, not a global installation or Vue wrapper.
- Map tiles load from `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. Browser
  caching and referrer defaults are retained. OSM attribution remains visible.
  There is no prefetch, tile scraping or offline tile download feature.
- Only clicking **Get driving directions** contacts the public FOSSGIS OSRM car
  endpoint. It receives the two selected public coordinate pairs and the usual
  browser request metadata, not Firebase tokens, account details or GPS location.
- Requests are disabled while busy and have a two-second per-component cooldown.
  The public service permits at most one request/second; use this modest demo
  accordingly. The cooldown is not a distributed quota or protection against
  multiple tabs/users. Do not load-test the public endpoint.
- Provider distance is in metres, duration in seconds, geometry in longitude/latitude.
  `mapRoutes.js` validates the response and converts geometry to Leaflet latitude/
  longitude. The displayed directions are simple English text, not rendered HTML.
- Network/timeout, invalid-response and no-route errors do not invent a route.
  Selected point changes clear old directions; unmounting aborts pending requests
  and removes map listeners/resize observation. A tile error reports that the
  basemap could not fully load, while the text list remains available.
- Public tiles and route services are best-effort and may be unavailable. They
  are not guaranteed live navigation. These public map services have no project
  billing integration; Firebase Hosting and Functions have separate usage charges.

## Check

`npm test` covers coordinates, route URLs, conversion, instructions, identical/
missing points, no-route/network/HTTP/JSON failures and malformed response data.
These are isolated provider substitutes, not load tests. `node scripts/check-functions.mjs`
against a running emulator also checks numeric coordinates returned by the function.
Use a browser to verify actual tiles, route geometry, keyboard selection and mobile
layout. `npm run build` checks the frontend bundle, not live service availability.

References:
- https://leafletjs.com/reference.html
- https://operations.osmfoundation.org/policies/tiles/
- https://routing.openstreetmap.de/about.html
- https://project-osrm.org/docs/v5.24.0/api/
