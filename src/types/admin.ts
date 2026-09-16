export interface UserCountStats {
  totalUsers: number;
  totalFoodLogs: number;
  sourceStats: {
    sourceType: string;
    _count: {
      sourceType: number;
    };
  }[];
}

export interface UserProfile {
  id: string;
  lineUserId: string;
  displayName: string | null;
  gender: string | null;
  birthday: string | null;
  weight: number | null;
  height: number | null;
  goal: string | null;
  targetWeight: number | null;
  activityLevel: string | null;
  dailyCalorieGoal: number;
  createdAt: string;
  _count: {
    foodLogs: number;
  };
}

export interface FoodLog {
  id: string;
  userId?: string;
  user?: {
    id: string;
    lineUserId: string;
    displayName: string | null;
  };
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  imageUrl: string | null;
  sourceType: string;
  loggedAt: string;
}

export interface FoodLogsResponse {
  logs: FoodLog[];
  total: number;
  page: number;
  limit?: number;
}
