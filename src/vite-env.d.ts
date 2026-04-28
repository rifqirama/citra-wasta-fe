/// <reference types="vite/client" />
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "camera-controls"?: boolean;
        "touch-action"?: string;
        "shadow-intensity"?: string | number;
        exposure?: string | number;
        "environment-image"?: string;
        poster?: string;
        "disable-zoom"?: boolean;
        "auto-rotate"?: boolean;
        "ios-src"?: string;
        style?: React.CSSProperties;
      };
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "model-viewer": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        > & {
          src?: string;
          alt?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "camera-controls"?: boolean;
          "touch-action"?: string;
          "shadow-intensity"?: string | number;
          exposure?: string | number;
          "environment-image"?: string;
          poster?: string;
          "disable-zoom"?: boolean;
          "auto-rotate"?: boolean;
          "ios-src"?: string;
          style?: React.CSSProperties;
        };
      }
    }
  }
}
