declare module '@env' {
  export const GOOGLE_MAPS_API_KEY: string;
}

declare module 'react-native-google-places-autocomplete' {
  import React from 'react';
  import { StyleProp, ViewStyle, TextStyle } from 'react-native';

  export interface GooglePlacesAutocompleteProps {
    placeholder?: string;
    onPress?: (data: any, details: any | null) => void;
    query?: any;
    fetchDetails?: boolean;
    styles?: {
      container?: StyleProp<ViewStyle>;
      textInput?: StyleProp<TextStyle>;
    };
    onFail?: (error: any) => void;
  }

  const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps>;

  export { GooglePlacesAutocomplete };
}