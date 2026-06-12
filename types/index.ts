export interface Memory {
  id: string;
  caption: string;
  photoUrl: string; // Base64 data URL (for photo) or base64 data URL (for video)
  date: string; // ISO timestamp or YYYY-MM-DD
  createdAt?: string; // ISO timestamp
  type?: "photo" | "video"; // Default to photo for backwards compatibility
  mood?: string;
  tags?: string[];
  location?: string;
}

export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  hoursNeeded: number;
  hoursSlept: number;
}

export interface Decision {
  id: string;
  options: string[];
  selectedOption: string;
  commentary: string;
  date: string; // ISO timestamp
}

export interface TimeCapsule {
  id: string;
  message: string;
  unlockDate: string; // YYYY-MM-DD
  createdAt: string; // YYYY-MM-DD
  isOpened: boolean;
}

export interface LifePassport {
  name: string;
  vibe: string;
  avatarUrl?: string; // Base64 data URL
  joinedDate: string; // ISO timestamp
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dateAssigned: string; // YYYY-MM-DD
}

