"use client";

import { useEffect, useRef, useState } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

// Lifted Place payload returned to the parent on selection. Fields are best-effort;
// callers should treat each as optional and fall back to existing form state.
export interface PickedPlace {
  formattedAddress: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  country: string;
  lat: number | null;
  lng: number | null;
  placeId: string;
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  onPlaceSelected: (place: PickedPlace) => void;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** ISO-3166 country codes to bias autocomplete suggestions to. Defaults to ['au']. */
  countries?: string[];
}

// Module-scoped loader so setOptions is only ever called once, and the Places
// library import happens at most once across all instances.
let placesPromise: Promise<google.maps.PlacesLibrary> | null = null;

function getPlacesLib(apiKey: string): Promise<google.maps.PlacesLibrary> {
  if (!placesPromise) {
    setOptions({ key: apiKey, v: "weekly" });
    placesPromise = importLibrary("places");
  }
  return placesPromise;
}

function parseComponents(place: google.maps.places.PlaceResult): Omit<PickedPlace, "lat" | "lng" | "placeId" | "formattedAddress"> {
  const get = (type: string, useShort = false): string => {
    const comp = (place.address_components ?? []).find((c) => c.types.includes(type));
    if (!comp) return "";
    return useShort ? comp.short_name : comp.long_name;
  };
  const streetNumber = get("street_number");
  const route = get("route");
  return {
    streetAddress: [streetNumber, route].filter(Boolean).join(" "),
    suburb: get("locality") || get("sublocality") || get("postal_town"),
    state: get("administrative_area_level_1", true),
    postcode: get("postal_code"),
    country: get("country", true),
  };
}

export function PlacesAutocompleteInput({
  value,
  onChange,
  onPlaceSelected,
  name,
  placeholder = "Search address",
  className,
  disabled,
  countries = ["au"],
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [missingKey, setMissingKey] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setMissingKey(true);
      return;
    }
    let cancelled = false;
    getPlacesLib(apiKey)
      .then((places) => {
        if (cancelled || !inputRef.current) return;
        const ac = new places.Autocomplete(inputRef.current, {
          fields: ["address_components", "formatted_address", "geometry", "place_id"],
          componentRestrictions: { country: countries },
          types: ["address"],
        });
        autoRef.current = ac;
        ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place) return;
          const parsed = parseComponents(place);
          const lat = place.geometry?.location?.lat?.() ?? null;
          const lng = place.geometry?.location?.lng?.() ?? null;
          const formattedAddress = place.formatted_address ?? "";
          onPlaceSelected({
            ...parsed,
            formattedAddress,
            lat,
            lng,
            placeId: place.place_id ?? "",
          });
          // Mirror the formatted address back into the input so the user sees the canonical text.
          onChange(parsed.streetAddress || formattedAddress);
        });
      })
      .catch((err) => {
        console.error("Failed to load Google Maps JS API:", err);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={missingKey ? "Address (autocomplete unavailable)" : placeholder}
      disabled={disabled}
      autoComplete="off"
      className={className}
    />
  );
}
