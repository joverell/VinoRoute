# This script formats the manually collected boundary data into the TypeScript format.
# It is a developer tool used to regenerate the `src/data/regionBoundaries.ts` file.
# It is not part of the application runtime.

# Manually collected data. This is an approximation based on the maps from vineyards.com.
# Each region has a list of lat/lng points that form a polygon.
MANUAL_BOUNDARIES = {
    "Hunter Valley, NSW": [ { "lat": -32.4, "lng": 151.0 }, { "lat": -32.5, "lng": 151.5 }, { "lat": -32.9, "lng": 151.4 }, { "lat": -32.8, "lng": 150.8 }, { "lat": -32.7, "lng": 150.8 } ],
    "Orange, NSW": [ { "lat": -33.1, "lng": 148.9 }, { "lat": -33.2, "lng": 149.3 }, { "lat": -33.5, "lng": 149.2 }, { "lat": -33.4, "lng": 148.8 } ],
    "Mudgee, NSW": [ { "lat": -32.4, "lng": 149.4 }, { "lat": -32.5, "lng": 149.8 }, { "lat": -32.8, "lng": 149.7 }, { "lat": -32.7, "lng": 149.3 } ],
    "Canberra District, ACT": [ { "lat": -35.0, "lng": 149.0 }, { "lat": -35.1, "lng": 149.4 }, { "lat": -35.4, "lng": 149.3 }, { "lat": -35.3, "lng": 148.9 } ],
    "Riverina, NSW": [ { "lat": -34.0, "lng": 145.8 }, { "lat": -34.2, "lng": 146.5 }, { "lat": -34.8, "lng": 146.3 }, { "lat": -34.6, "lng": 145.6 } ],
    "Southern Highlands, NSW": [ { "lat": -34.3, "lng": 150.2 }, { "lat": -34.4, "lng": 150.6 }, { "lat": -34.7, "lng": 150.5 }, { "lat": -34.6, "lng": 150.1 } ],
    "New England Australia, NSW": [ { "lat": -29.0, "lng": 151.0 }, { "lat": -29.2, "lng": 152.0 }, { "lat": -30.0, "lng": 151.8 }, { "lat": -29.8, "lng": 150.8 } ],
    "Hastings River, NSW": [ { "lat": -31.2, "lng": 152.5 }, { "lat": -31.3, "lng": 152.9 }, { "lat": -31.6, "lng": 152.8 }, { "lat": -31.5, "lng": 152.4 } ],
    "Perricoota, NSW": [ { "lat": -35.7, "lng": 144.6 }, { "lat": -35.8, "lng": 145.0 }, { "lat": -36.0, "lng": 144.9 }, { "lat": -35.9, "lng": 144.5 } ],
    "Shoalhaven Coast, NSW": [ { "lat": -34.8, "lng": 150.5 }, { "lat": -34.9, "lng": 150.9 }, { "lat": -35.1, "lng": 150.8 }, { "lat": -35.0, "lng": 150.4 } ],
    "Tumbarumba, NSW": [ { "lat": -35.7, "lng": 147.8 }, { "lat": -35.8, "lng": 148.2 }, { "lat": -36.0, "lng": 148.1 }, { "lat": -35.9, "lng": 147.7 } ],
    "Gundagai, NSW": [ { "lat": -34.9, "lng": 147.9 }, { "lat": -35.0, "lng": 148.3 }, { "lat": -35.2, "lng": 148.2 }, { "lat": -35.1, "lng": 147.8 } ],
    "Hilltops, NSW": [ { "lat": -34.4, "lng": 148.3 }, { "lat": -34.5, "lng": 148.7 }, { "lat": -34.7, "lng": 148.6 }, { "lat": -34.6, "lng": 148.2 } ],

    "Barossa Valley, SA": [ { "lat": -34.4, "lng": 138.8 }, { "lat": -34.5, "lng": 139.2 }, { "lat": -34.7, "lng": 139.1 }, { "lat": -34.6, "lng": 138.7 } ],
    "McLaren Vale, SA": [ { "lat": -35.1, "lng": 138.4 }, { "lat": -35.2, "lng": 138.7 }, { "lat": -35.4, "lng": 138.6 }, { "lat": -35.3, "lng": 138.3 } ],
    "Adelaide Hills, SA": [ { "lat": -34.8, "lng": 138.7 }, { "lat": -34.9, "lng": 139.0 }, { "lat": -35.1, "lng": 138.9 }, { "lat": -35.0, "lng": 138.6 } ],
    "Clare Valley, SA": [ { "lat": -33.7, "lng": 138.5 }, { "lat": -33.8, "lng": 138.8 }, { "lat": -34.0, "lng": 138.7 }, { "lat": -33.9, "lng": 138.4 } ],
    "Coonawarra, SA": [ { "lat": -37.2, "lng": 140.7 }, { "lat": -37.3, "lng": 141.0 }, { "lat": -37.5, "lng": 140.9 }, { "lat": -37.4, "lng": 140.6 } ],
    "Eden Valley, SA": [ { "lat": -34.5, "lng": 139.0 }, { "lat": -34.6, "lng": 139.3 }, { "lat": -34.8, "lng": 139.2 }, { "lat": -34.7, "lng": 138.9 } ],
    "Langhorne Creek, SA": [ { "lat": -35.2, "lng": 138.9 }, { "lat": -35.3, "lng": 139.2 }, { "lat": -35.5, "lng": 139.1 }, { "lat": -35.4, "lng": 138.8 } ],
    "Southern Flinders Ranges, SA": [ { "lat": -32.8, "lng": 137.8 }, { "lat": -32.9, "lng": 138.2 }, { "lat": -33.2, "lng": 138.1 }, { "lat": -33.1, "lng": 137.7 } ],
    "Riverland, SA": [ { "lat": -34.0, "lng": 140.3 }, { "lat": -34.1, "lng": 140.8 }, { "lat": -34.4, "lng": 140.7 }, { "lat": -34.3, "lng": 140.2 } ],
    "Adelaide Plains, SA": [ { "lat": -34.6, "lng": 138.3 }, { "lat": -34.7, "lng": 138.7 }, { "lat": -34.9, "lng": 138.6 }, { "lat": -34.8, "lng": 138.2 } ],
    "Kangaroo Island, SA": [ { "lat": -35.6, "lng": 136.8 }, { "lat": -35.7, "lng": 137.6 }, { "lat": -36.0, "lng": 137.5 }, { "lat": -35.9, "lng": 136.7 } ],
    "Mount Benson, SA": [ { "lat": -36.9, "lng": 139.6 }, { "lat": -37.0, "lng": 140.0 }, { "lat": -37.2, "lng": 139.9 }, { "lat": -37.1, "lng": 139.5 } ],
    "Robe, SA": [ { "lat": -37.1, "lng": 139.6 }, { "lat": -37.2, "lng": 140.0 }, { "lat": -37.4, "lng": 139.9 }, { "lat": -37.3, "lng": 139.5 } ],
    "Padthaway, SA": [ { "lat": -36.5, "lng": 140.3 }, { "lat": -36.6, "lng": 140.7 }, { "lat": -36.8, "lng": 140.6 }, { "lat": -36.7, "lng": 140.2 } ],
    "Wrattonbully, SA": [ { "lat": -36.8, "lng": 140.6 }, { "lat": -36.9, "lng": 141.0 }, { "lat": -37.1, "lng": 140.9 }, { "lat": -37.0, "lng": 140.5 } ],
    "Southern Fleurieu, SA": [ { "lat": -35.4, "lng": 138.3 }, { "lat": -35.5, "lng": 138.7 }, { "lat": -35.7, "lng": 138.6 }, { "lat": -35.6, "lng": 138.2 } ],
    "Currency Creek, SA": [ { "lat": -35.3, "lng": 138.6 }, { "lat": -35.4, "lng": 139.0 }, { "lat": -35.6, "lng": 138.9 }, { "lat": -35.5, "lng": 138.5 } ],

    "Tamar Valley, TAS": [ { "lat": -41.0, "lng": 146.7 }, { "lat": -41.1, "lng": 147.2 }, { "lat": -41.4, "lng": 147.1 }, { "lat": -41.3, "lng": 146.6 } ],
    "Coal River Valley, TAS": [ { "lat": -42.6, "lng": 147.3 }, { "lat": -42.7, "lng": 147.6 }, { "lat": -42.9, "lng": 147.5 }, { "lat": -42.8, "lng": 147.2 } ],
    "Derwent Valley, TAS": [ { "lat": -42.6, "lng": 146.9 }, { "lat": -42.7, "lng": 147.2 }, { "lat": -42.9, "lng": 147.1 }, { "lat": -42.8, "lng": 146.8 } ],
    "East Coast, TAS": [ { "lat": -41.8, "lng": 148.0 }, { "lat": -41.9, "lng": 148.4 }, { "lat": -42.2, "lng": 148.3 }, { "lat": -42.1, "lng": 147.9 } ],
    "North West, TAS": [ { "lat": -41.0, "lng": 145.6 }, { "lat": -41.1, "lng": 146.0 }, { "lat": -41.3, "lng": 145.9 }, { "lat": -41.2, "lng": 145.5 } ],
    "Pipers River, TAS": [ { "lat": -40.8, "lng": 147.2 }, { "lat": -40.9, "lng": 147.6 }, { "lat": -41.1, "lng": 147.5 }, { "lat": -41.0, "lng": 147.1 } ],
    "Huon Valley, TAS": [ { "lat": -42.8, "lng": 146.8 }, { "lat": -42.9, "lng": 147.2 }, { "lat": -43.1, "lng": 147.1 }, { "lat": -43.0, "lng": 146.7 } ],

    "Yarra Valley, VIC": [ { "lat": -37.5, "lng": 145.3 }, { "lat": -37.6, "lng": 145.7 }, { "lat": -37.9, "lng": 145.6 }, { "lat": -37.8, "lng": 145.2 } ],
    "Mornington Peninsula, VIC": [ { "lat": -38.2, "lng": 144.9 }, { "lat": -38.3, "lng": 145.2 }, { "lat": -38.5, "lng": 145.1 }, { "lat": -38.4, "lng": 144.8 } ],
    "Rutherglen, VIC": [ { "lat": -35.9, "lng": 146.3 }, { "lat": -36.0, "lng": 146.7 }, { "lat": -36.2, "lng": 146.6 }, { "lat": -36.1, "lng": 146.2 } ],
    "Geelong, VIC": [ { "lat": -38.0, "lng": 144.2 }, { "lat": -38.1, "lng": 144.6 }, { "lat": -38.3, "lng": 144.5 }, { "lat": -38.2, "lng": 144.1 } ],
    "King Valley, VIC": [ { "lat": -36.7, "lng": 146.2 }, { "lat": -36.8, "lng": 146.6 }, { "lat": -37.0, "lng": 146.5 }, { "lat": -36.9, "lng": 146.1 } ],
    "Heathcote, VIC": [ { "lat": -36.8, "lng": 144.6 }, { "lat": -36.9, "lng": 145.0 }, { "lat": -37.1, "lng": 144.9 }, { "lat": -37.0, "lng": 144.5 } ],
    "Macedon Ranges, VIC": [ { "lat": -37.3, "lng": 144.4 }, { "lat": -37.4, "lng": 144.8 }, { "lat": -37.6, "lng": 144.7 }, { "lat": -37.5, "lng": 144.3 } ],
    "Pyrenees, VIC": [ { "lat": -37.0, "lng": 143.2 }, { "lat": -37.1, "lng": 143.6 }, { "lat": -37.3, "lng": 143.5 }, { "lat": -37.2, "lng": 143.1 } ],
    "Swan Hill, VIC": [ { "lat": -35.1, "lng": 143.3 }, { "lat": -35.2, "lng": 143.7 }, { "lat": -35.4, "lng": 143.6 }, { "lat": -35.3, "lng": 143.2 } ],
    "Murray Darling, VIC": [ { "lat": -34.3, "lng": 142.3 }, { "lat": -34.4, "lng": 142.8 }, { "lat": -34.6, "lng": 142.7 }, { "lat": -34.5, "lng": 142.2 } ],
    "Gippsland, VIC": [ { "lat": -37.8, "lng": 146.8 }, { "lat": -37.9, "lng": 147.3 }, { "lat": -38.1, "lng": 147.2 }, { "lat": -38.0, "lng": 146.7 } ],
    "Bendigo, VIC": [ { "lat": -36.6, "lng": 144.1 }, { "lat": -36.7, "lng": 144.5 }, { "lat": -36.9, "lng": 144.4 }, { "lat": -36.8, "lng": 144.0 } ],
    "Goulburn Valley, VIC": [ { "lat": -36.2, "lng": 145.0 }, { "lat": -36.3, "lng": 145.4 }, { "lat": -36.5, "lng": 145.3 }, { "lat": -36.4, "lng": 144.9 } ],
    "Strathbogie Ranges, VIC": [ { "lat": -36.7, "lng": 145.5 }, { "lat": -36.8, "lng": 145.9 }, { "lat": -37.0, "lng": 145.8 }, { "lat": -36.9, "lng": 145.4 } ],
    "Alpine Valleys, VIC": [ { "lat": -36.5, "lng": 146.6 }, { "lat": -36.6, "lng": 147.0 }, { "lat": -36.8, "lng": 146.9 }, { "lat": -36.7, "lng": 146.5 } ],
    "Beechworth, VIC": [ { "lat": -36.2, "lng": 146.5 }, { "lat": -36.3, "lng": 146.9 }, { "lat": -36.5, "lng": 146.8 }, { "lat": -36.4, "lng": 146.4 } ],
    "Glenrowan, VIC": [ { "lat": -36.3, "lng": 146.0 }, { "lat": -36.4, "lng": 146.4 }, { "lat": -36.6, "lng": 146.3 }, { "lat": -36.5, "lng": 145.9 } ],
    "Sunbury, VIC": [ { "lat": -37.4, "lng": 144.5 }, { "lat": -37.5, "lng": 144.9 }, { "lat": -37.7, "lng": 144.8 }, { "lat": -37.6, "lng": 144.4 } ],
    "Grampians, VIC": [ { "lat": -37.0, "lng": 142.3 }, { "lat": -37.1, "lng": 142.8 }, { "lat": -37.3, "lng": 142.7 }, { "lat": -37.2, "lng": 142.2 } ],
    "Henty, VIC": [ { "lat": -37.7, "lng": 141.6 }, { "lat": -37.8, "lng": 142.0 }, { "lat": -38.0, "lng": 141.9 }, { "lat": -37.9, "lng": 141.5 } ],

    "Margaret River, WA": [ { "lat": -33.6, "lng": 114.9 }, { "lat": -33.7, "lng": 115.3 }, { "lat": -34.0, "lng": 115.2 }, { "lat": -33.9, "lng": 114.8 } ],
    "Swan Valley, WA": [ { "lat": -31.7, "lng": 115.9 }, { "lat": -31.8, "lng": 116.2 }, { "lat": -32.0, "lng": 116.1 }, { "lat": -31.9, "lng": 115.8 } ],
    "Great Southern, WA": [ { "lat": -34.5, "lng": 117.0 }, { "lat": -34.6, "lng": 118.0 }, { "lat": -35.1, "lng": 117.8 }, { "lat": -35.0, "lng": 116.8 } ],
    "Geographe, WA": [ { "lat": -33.5, "lng": 115.5 }, { "lat": -33.6, "lng": 115.9 }, { "lat": -33.8, "lng": 115.8 }, { "lat": -33.7, "lng": 115.4 } ],
    "Swan District, WA": [ { "lat": -31.5, "lng": 115.8 }, { "lat": -31.6, "lng": 116.2 }, { "lat": -31.8, "lng": 116.1 }, { "lat": -31.7, "lng": 115.7 } ],
    "Perth Hills, WA": [ { "lat": -31.7, "lng": 115.9 }, { "lat": -31.8, "lng": 116.3 }, { "lat": -32.0, "lng": 116.2 }, { "lat": -31.9, "lng": 115.8 } ],
    "Peel, WA": [ { "lat": -32.3, "lng": 115.7 }, { "lat": -32.4, "lng": 116.1 }, { "lat": -32.6, "lng": 116.0 }, { "lat": -32.5, "lng": 115.6 } ],
    "Blackwood Valley, WA": [ { "lat": -33.7, "lng": 115.8 }, { "lat": -33.8, "lng": 116.2 }, { "lat": -34.0, "lng": 116.1 }, { "lat": -33.9, "lng": 115.7 } ],
    "Manjimup, WA": [ { "lat": -34.0, "lng": 115.9 }, { "lat": -34.1, "lng": 116.3 }, { "lat": -34.3, "lng": 116.2 }, { "lat": -34.2, "lng": 115.8 } ],
    "Pemberton, WA": [ { "lat": -34.2, "lng": 115.8 }, { "lat": -34.3, "lng": 116.2 }, { "lat": -34.5, "lng": 116.1 }, { "lat": -34.4, "lng": 115.7 } ],
}

def generate_typescript_data(region_name, coords):
    """
    Generates a TypeScript interface for a region boundary.
    """
    path_str = ",\n      ".join([f"{{ lat: {c['lat']:.4f}, lng: {c['lng']:.4f} }}" for c in coords])
    return f"""  {{
    name: "{region_name}",
    paths: [
      {path_str}
    ],
  }}"""

def main():
    """
    Generates the TypeScript code for the regionBoundaries.ts file.
    """
    ts_data = []
    for region_name, coords in MANUAL_BOUNDARIES.items():
        ts_data.append(generate_typescript_data(region_name, coords))

    print("import { RegionBoundary } from '@/types';")
    print("\nexport const regionBoundaries: RegionBoundary[] = [")
    print(",\n".join(ts_data))
    print("];")


if __name__ == "__main__":
    main()
