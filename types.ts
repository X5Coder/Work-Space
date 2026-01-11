
export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  MEDIUM = 'medium'
}

export type Mode = 'normal' | 'edit' | 'delete';

export interface CanvasElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  bgColor: string;
  textColor: string;
  borderRadius: string;
}

export interface Offset {
  x: number;
  y: number;
}
