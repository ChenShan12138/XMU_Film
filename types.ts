
export interface Actor {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
}

export interface SetScene {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export interface ScriptLine {
  id: string;
  character: string;
  dialogue: string;
  cameraAngle: 'Wide' | 'Medium' | 'Close-up' | 'Over-the-shoulder';
  action: string;
  visualUrl?: string;
  duration?: number; // Duration in seconds
}

export interface ProjectData {
  title: string;
  genre: string;
  idea: string;
  script: ScriptLine[];
  cast: Record<string, Actor>; // Map Character Name -> Actor
  scene?: SetScene;
}

export enum AppStep {
  CREATIVE = 0,
  SCRIPT = 1,
  CASTING = 2,
  SCENERY = 3,
  SHOOTING = 4,
  EXPORT = 5
}
