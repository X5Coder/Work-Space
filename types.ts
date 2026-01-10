
export const Theme = {
  DARK: 'dark',
  LIGHT: 'light',
  MEDIUM: 'medium'
} as const;

export type ThemeType = typeof Theme[keyof typeof Theme];

export type AppMode = 'normal' | 'edit' | 'delete';

export interface WorkspaceElement {
  id: string;
  x: number;
  y: number;
  text: string;
  bgColor: string;
  textColor: string;
  width: number;
  height: number;
  borderRadius?: string; // خاصية جديدة للتحكم في الحواف
}

export interface WorkspaceState {
  theme: ThemeType;
  offsetX: number;
  offsetY: number;
  elements: WorkspaceElement[];
  timestamp: number;
}
